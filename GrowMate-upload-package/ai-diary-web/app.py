from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import re
import secrets
import sqlite3
import urllib.parse
import urllib.error
import urllib.request
from datetime import datetime, timedelta
from http import HTTPStatus
from http.cookies import SimpleCookie
from pathlib import Path
from typing import Any
from zoneinfo import ZoneInfo
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer


ROOT = Path(__file__).resolve().parent
STATIC_DIR = ROOT / "static"
DATA_DIR = ROOT / "data"
CONFIG_DIR = ROOT / "config"
DB_PATH = DATA_DIR / "app.db"
SENSITIVE_WORDS_PATH = CONFIG_DIR / "sensitive_words.txt"
TZ = ZoneInfo(os.getenv("APP_TIMEZONE", "Asia/Shanghai"))
SESSION_COOKIE = "ai_diary_session"
MAX_CONTENT_LENGTH = 2000


def now_iso() -> str:
    return datetime.now(TZ).replace(microsecond=0).isoformat()


def db() -> sqlite3.Connection:
    DATA_DIR.mkdir(exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db() -> None:
    with db() as conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                role TEXT NOT NULL DEFAULT 'user',
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS sessions (
                token TEXT PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS diary_entries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                content TEXT NOT NULL,
                entry_date TEXT NOT NULL,
                time_period TEXT NOT NULL,
                analysis_status TEXT NOT NULL DEFAULT 'pending',
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS tags (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                category TEXT NOT NULL,
                is_system INTEGER NOT NULL DEFAULT 1,
                UNIQUE(name, category)
            );

            CREATE TABLE IF NOT EXISTS diary_entry_tags (
                diary_entry_id INTEGER NOT NULL REFERENCES diary_entries(id) ON DELETE CASCADE,
                tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
                PRIMARY KEY (diary_entry_id, tag_id)
            );

            CREATE TABLE IF NOT EXISTS analysis_results (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                diary_entry_id INTEGER NOT NULL UNIQUE REFERENCES diary_entries(id) ON DELETE CASCADE,
                event_tags TEXT NOT NULL,
                emotion_label TEXT NOT NULL,
                personality_label TEXT NOT NULL,
                values_label TEXT NOT NULL,
                happiness_label TEXT NOT NULL,
                schedule_candidate TEXT,
                raw_json TEXT NOT NULL,
                model_version TEXT NOT NULL,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS analysis_jobs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                diary_entry_id INTEGER NOT NULL REFERENCES diary_entries(id) ON DELETE CASCADE,
                status TEXT NOT NULL,
                retry_count INTEGER NOT NULL DEFAULT 0,
                error_message TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS schedules (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                diary_entry_id INTEGER REFERENCES diary_entries(id) ON DELETE SET NULL,
                title TEXT NOT NULL,
                start_at TEXT NOT NULL,
                end_at TEXT,
                location TEXT,
                note TEXT,
                source TEXT NOT NULL DEFAULT 'diary',
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS schedule_reminders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                schedule_id INTEGER NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
                reminder_at TEXT NOT NULL,
                offset_minutes INTEGER NOT NULL DEFAULT 15,
                status TEXT NOT NULL DEFAULT 'pending',
                sent_at TEXT
            );

            CREATE TABLE IF NOT EXISTS audit_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
                action TEXT NOT NULL,
                detail TEXT,
                created_at TEXT NOT NULL
            );
            """
        )


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 120_000)
    return base64.b64encode(salt + digest).decode("ascii")


def verify_password(password: str, stored: str) -> bool:
    raw = base64.b64decode(stored.encode("ascii"))
    salt, expected = raw[:16], raw[16:]
    actual = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 120_000)
    return hmac.compare_digest(actual, expected)


def contains_emoji(text: str) -> bool:
    for ch in text:
        code = ord(ch)
        if (
            0x1F000 <= code <= 0x1FAFF
            or 0x2600 <= code <= 0x27BF
            or 0xFE00 <= code <= 0xFE0F
            or 0x200D == code
        ):
            return True
    return False


def contains_image_payload(text: str) -> bool:
    patterns = [r"<\s*img\b", r"data:image/", r"!\[[^\]]*\]\([^)]+\)", r"\.(png|jpe?g|gif|webp|bmp|svg)\b"]
    return any(re.search(pattern, text, re.IGNORECASE) for pattern in patterns)


def load_sensitive_rules() -> list[tuple[str, str]]:
    if not SENSITIVE_WORDS_PATH.exists():
        return []
    rules: list[tuple[str, str]] = []
    for raw_line in SENSITIVE_WORDS_PATH.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#"):
            continue
        if line.startswith("re:"):
            rules.append(("regex", line[3:].strip()))
        else:
            rules.append(("text", line.casefold()))
    return rules


def find_sensitive_match(text: str) -> str | None:
    normalized = text.casefold()
    for rule_type, pattern in load_sensitive_rules():
        if rule_type == "regex":
            try:
                if re.search(pattern, text, re.IGNORECASE):
                    return pattern
            except re.error:
                continue
        elif pattern and pattern in normalized:
            return pattern
    return None


def validate_diary_text(text: str) -> str | None:
    if not isinstance(text, str) or not text.strip():
        return "内容不能为空"
    if len(text) > MAX_CONTENT_LENGTH:
        return "单条日记不能超过 2000 字"
    if contains_emoji(text) or contains_image_payload(text):
        return "仅允许纯文字输入，不能包含图片或表情"
    if find_sensitive_match(text):
        return "内容包含敏感词或敏感表达，请修改后再提交"
    visible = [ch for ch in text if not ch.isspace()]
    if not visible:
        return "内容不能为空"
    meaningful = sum(1 for ch in visible if re.match(r"[\w\u4e00-\u9fff]", ch, re.UNICODE))
    if meaningful / max(len(visible), 1) < 0.35:
        return "内容像乱码，请输入可读纯文字"
    return None


def time_period(dt: datetime) -> str:
    if 5 <= dt.hour < 12:
        return "上午"
    if 12 <= dt.hour < 18:
        return "下午"
    if 18 <= dt.hour < 23:
        return "晚上"
    return "深夜"


def local_analysis(content: str) -> dict[str, Any]:
    event_rules = [
        ("社交", ["朋友", "同事", "聚会", "聊天", "约", "见面", "老公", "老婆", "家人"]),
        ("朋友", ["朋友", "闺蜜"]),
        ("吃饭", ["吃饭", "吃了饭", "晚饭", "午饭", "早餐", "餐厅", "火锅", "咖啡"]),
        ("工作轻松", ["下班无事", "工作日晚上下班无事", "不忙"]),
        ("工作投入", ["加班", "项目", "开会", "汇报", "任务"]),
        ("穿搭", ["穿搭", "衣服", "裙子", "搭配", "妆"]),
        ("休闲", ["看电影", "散步", "旅行", "放松"]),
        ("健康", ["生病", "不舒服", "医院", "吃药", "头疼"]),
    ]
    event_tags = [label for label, words in event_rules if any(word in content for word in words)]
    if not event_tags:
        event_tags = ["日常记录"]

    negative_words = ["累", "加班", "没等我", "难过", "焦虑", "生气", "失望", "压力", "崩溃"]
    positive_words = ["开心", "放松", "幸福", "满足", "顺利", "舒服", "喜欢", "很好"]
    has_negative = any(word in content for word in negative_words)
    has_positive = any(word in content for word in positive_words)

    social_reward = any(word in content for word in ["朋友", "逛街", "吃饭", "吃了饭", "放松"])
    if (has_positive or social_reward) and not has_negative:
        emotion = "情绪稳定偏愉悦"
        happiness = "幸福度高"
    elif has_negative and has_positive:
        emotion = "情绪混合"
        happiness = "幸福度中性"
    elif has_negative:
        emotion = "情绪低落或疲惫"
        happiness = "幸福度低"
    else:
        emotion = "情绪稳定"
        happiness = "幸福度中性"

    if any(word in content for word in ["朋友", "聚会", "逛街", "聊天"]):
        personality = "性格外向"
        values = "价值观重视陪伴"
    elif any(word in content for word in ["加班", "任务", "项目", "汇报"]):
        personality = "性格负责克制"
        values = "价值观重视责任"
    else:
        personality = "无明确性格倾向"
        values = "无明确价值观倾向"

    schedule_candidate = detect_schedule_candidate(content)
    return {
        "event_tags": event_tags,
        "emotion_label": emotion,
        "personality_label": personality,
        "values_label": values,
        "happiness_label": happiness,
        "schedule_candidate": schedule_candidate,
        "model_version": "local-rules-v1",
    }


def detect_schedule_candidate(content: str) -> dict[str, Any] | None:
    plan_words = ["明天", "后天", "下周", "周一", "周二", "周三", "周四", "周五", "周六", "周日", "星期", "点", "预约", "计划", "打算", "准备", "要去", "开会", "看电影"]
    if not any(word in content for word in plan_words):
        return None

    base = datetime.now(TZ)
    start_date = base.date()
    if "明天" in content:
        start_date = (base + timedelta(days=1)).date()
    elif "后天" in content:
        start_date = (base + timedelta(days=2)).date()
    else:
        m = re.search(r"(\d{1,2})月(\d{1,2})日", content)
        if m:
            month, day = int(m.group(1)), int(m.group(2))
            year = base.year + (1 if month < base.month else 0)
            start_date = datetime(year, month, day, tzinfo=TZ).date()

    hour = 9
    minute = 0
    tm = re.search(r"(上午|中午|下午|晚上|晚)?\s*([零一二三四五六七八九十两\d]{1,3})\s*点(半|([零一二三四五六七八九十两\d]{1,3})分?)?", content)
    if tm:
        prefix, raw_hour = tm.group(1) or "", chinese_number(tm.group(2))
        hour = raw_hour
        if prefix in ["下午", "晚上", "晚"] and hour < 12:
            hour += 12
        if prefix == "中午" and hour < 11:
            hour += 12
        minute = 30 if tm.group(3) == "半" else chinese_number(tm.group(4) or "0")

    start = datetime.combine(start_date, datetime.min.time(), TZ).replace(hour=hour, minute=minute)
    title = re.sub(r"(今天|明天|后天|上午|中午|下午|晚上|晚|\d{1,2}月\d{1,2}日|[零一二三四五六七八九十两\d]{1,3}\s*点半?|[零一二三四五六七八九十两\d]{1,3}\s*点[零一二三四五六七八九十两\d]{1,3}分?)", "", content)
    title = re.sub(r"\s+", " ", title).strip(" ，,。.")
    if not title:
        title = content[:40]
    return {
        "title": title[:80],
        "start_at": start.replace(microsecond=0).isoformat(),
        "end_at": (start + timedelta(hours=1)).replace(microsecond=0).isoformat(),
        "location": "",
        "note": f"来源日记：{content[:180]}",
        "reminder_offset_minutes": 15,
    }


def chinese_number(text: str) -> int:
    if text.isdigit():
        return int(text)
    digits = {"零": 0, "一": 1, "二": 2, "两": 2, "三": 3, "四": 4, "五": 5, "六": 6, "七": 7, "八": 8, "九": 9}
    if text == "十":
        return 10
    if text.startswith("十"):
        return 10 + digits.get(text[-1], 0)
    if "十" in text:
        left, _, right = text.partition("十")
        return digits.get(left, 1) * 10 + (digits.get(right, 0) if right else 0)
    return digits.get(text, 0)


def openai_analysis(content: str) -> dict[str, Any] | None:
    api_key = os.getenv("OPENAI_API_KEY")
    model = os.getenv("OPENAI_MODEL")
    if not api_key or not model:
        return None

    prompt = {
        "instruction": "Analyze a Chinese diary entry. Return only compact JSON with event_tags, emotion_label, personality_label, values_label, happiness_label, schedule_candidate.",
        "schema": {
            "event_tags": ["string"],
            "emotion_label": "string",
            "personality_label": "string",
            "values_label": "string",
            "happiness_label": "string",
            "schedule_candidate": "null or object with title,start_at,end_at,location,note,reminder_offset_minutes",
        },
        "entry": content,
        "timezone": str(TZ),
    }
    req = urllib.request.Request(
        "https://api.openai.com/v1/responses",
        data=json.dumps({"model": model, "input": json.dumps(prompt, ensure_ascii=False)}).encode("utf-8"),
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        payload = json.loads(resp.read().decode("utf-8"))
    text = payload.get("output_text")
    if not text:
        chunks = []
        for item in payload.get("output", []):
            for part in item.get("content", []):
                if part.get("type") in {"output_text", "text"}:
                    chunks.append(part.get("text", ""))
        text = "".join(chunks)
    result = json.loads(text)
    result["model_version"] = model
    return result


def analyze_entry(content: str) -> tuple[dict[str, Any] | None, str | None]:
    try:
        result = openai_analysis(content)
        if result:
            result.setdefault("schedule_candidate", detect_schedule_candidate(content))
            return result, None
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError, KeyError, ValueError) as exc:
        return None, str(exc)
    return local_analysis(content), None


def row_to_dict(row: sqlite3.Row) -> dict[str, Any]:
    return {key: row[key] for key in row.keys()}


def entry_payload(conn: sqlite3.Connection, entry_id: int) -> dict[str, Any]:
    entry = conn.execute("SELECT * FROM diary_entries WHERE id = ?", (entry_id,)).fetchone()
    tags = conn.execute(
        """
        SELECT tags.name, tags.category
        FROM tags
        JOIN diary_entry_tags ON diary_entry_tags.tag_id = tags.id
        WHERE diary_entry_tags.diary_entry_id = ?
        ORDER BY tags.category, tags.name
        """,
        (entry_id,),
    ).fetchall()
    analysis = conn.execute("SELECT * FROM analysis_results WHERE diary_entry_id = ?", (entry_id,)).fetchone()
    payload = row_to_dict(entry)
    payload["tags"] = [row_to_dict(tag) for tag in tags]
    payload["analysis"] = row_to_dict(analysis) if analysis else None
    if payload["analysis"]:
        payload["analysis"]["event_tags"] = json.loads(payload["analysis"]["event_tags"])
        payload["analysis"]["raw_json"] = json.loads(payload["analysis"]["raw_json"])
        payload["analysis"]["schedule_candidate"] = json.loads(payload["analysis"]["schedule_candidate"]) if payload["analysis"]["schedule_candidate"] else None
    return payload


def save_analysis(conn: sqlite3.Connection, entry_id: int, analysis: dict[str, Any]) -> None:
    tag_items = [(name, "event") for name in analysis["event_tags"]]
    tag_items.extend(
        [
            (analysis["emotion_label"], "emotion"),
            (analysis["personality_label"], "personality"),
            (analysis["values_label"], "values"),
            (analysis["happiness_label"], "happiness"),
        ]
    )
    for name, category in tag_items:
        conn.execute(
            "INSERT OR IGNORE INTO tags(name, category, is_system) VALUES (?, ?, 1)",
            (name, category),
        )
        tag_id = conn.execute("SELECT id FROM tags WHERE name = ? AND category = ?", (name, category)).fetchone()["id"]
        conn.execute(
            "INSERT OR IGNORE INTO diary_entry_tags(diary_entry_id, tag_id) VALUES (?, ?)",
            (entry_id, tag_id),
        )
    conn.execute(
        """
        INSERT INTO analysis_results(
            diary_entry_id, event_tags, emotion_label, personality_label, values_label,
            happiness_label, schedule_candidate, raw_json, model_version, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            entry_id,
            json.dumps(analysis["event_tags"], ensure_ascii=False),
            analysis["emotion_label"],
            analysis["personality_label"],
            analysis["values_label"],
            analysis["happiness_label"],
            json.dumps(analysis.get("schedule_candidate"), ensure_ascii=False) if analysis.get("schedule_candidate") else None,
            json.dumps(analysis, ensure_ascii=False),
            analysis.get("model_version", "unknown"),
            now_iso(),
        ),
    )
    conn.execute("UPDATE diary_entries SET analysis_status = 'completed' WHERE id = ?", (entry_id,))


class Handler(SimpleHTTPRequestHandler):
    server_version = "AIDiary/0.1"

    def translate_path(self, path: str) -> str:
        if path.startswith("/api/"):
            return str(STATIC_DIR / "index.html")
        target = path.split("?", 1)[0].split("#", 1)[0]
        if target == "/":
            target = "/index.html"
        return str(STATIC_DIR / target.lstrip("/"))

    def do_GET(self) -> None:
        if self.path.startswith("/api/"):
            self.handle_api("GET")
        else:
            super().do_GET()

    def do_POST(self) -> None:
        self.handle_api("POST")

    def do_DELETE(self) -> None:
        self.handle_api("DELETE")

    def read_json(self) -> dict[str, Any]:
        length = int(self.headers.get("Content-Length", "0"))
        if length <= 0:
            return {}
        return json.loads(self.rfile.read(length).decode("utf-8"))

    def write_json(self, data: Any, status: int = 200) -> None:
        payload = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def get_user(self, conn: sqlite3.Connection) -> sqlite3.Row | None:
        cookie = SimpleCookie(self.headers.get("Cookie", ""))
        token = cookie.get(SESSION_COOKIE)
        if not token:
            return None
        return conn.execute(
            """
            SELECT users.* FROM users
            JOIN sessions ON sessions.user_id = users.id
            WHERE sessions.token = ?
            """,
            (token.value,),
        ).fetchone()

    def require_user(self, conn: sqlite3.Connection) -> sqlite3.Row | None:
        user = self.get_user(conn)
        if not user:
            self.write_json({"error": "未登录"}, HTTPStatus.UNAUTHORIZED)
            return None
        return user

    def set_session(self, conn: sqlite3.Connection, user_id: int) -> None:
        token = secrets.token_urlsafe(32)
        conn.execute("INSERT INTO sessions(token, user_id, created_at) VALUES (?, ?, ?)", (token, user_id, now_iso()))
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Set-Cookie", f"{SESSION_COOKIE}={token}; HttpOnly; SameSite=Lax; Path=/")
        body = b'{"ok":true}'
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def clear_session(self, conn: sqlite3.Connection) -> None:
        cookie = SimpleCookie(self.headers.get("Cookie", ""))
        token = cookie.get(SESSION_COOKIE)
        if token:
            conn.execute("DELETE FROM sessions WHERE token = ?", (token.value,))
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Set-Cookie", f"{SESSION_COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0")
        body = b'{"ok":true}'
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def handle_api(self, method: str) -> None:
        try:
            with db() as conn:
                path = self.path.split("?", 1)[0]
                if path == "/api/auth/register" and method == "POST":
                    return self.register(conn)
                if path == "/api/auth/login" and method == "POST":
                    return self.login(conn)
                if path == "/api/auth/logout" and method == "POST":
                    return self.clear_session(conn)
                if path == "/api/auth/me" and method == "GET":
                    user = self.get_user(conn)
                    return self.write_json({"user": public_user(user) if user else None})
                user = self.require_user(conn)
                if not user:
                    return
                if path == "/api/entries" and method == "GET":
                    return self.list_entries(conn, user)
                if path == "/api/entries" and method == "POST":
                    return self.create_entry(conn, user)
                if path == "/api/tags" and method == "GET":
                    return self.list_tags(conn, user)
                if path == "/api/schedules" and method == "GET":
                    return self.list_schedules(conn, user)
                if path == "/api/schedules" and method == "POST":
                    return self.create_schedule(conn, user)
                if path == "/api/admin/analysis-jobs" and method == "GET":
                    return self.list_analysis_jobs(conn, user)
                self.write_json({"error": "接口不存在"}, HTTPStatus.NOT_FOUND)
        except json.JSONDecodeError:
            self.write_json({"error": "JSON 格式错误"}, HTTPStatus.BAD_REQUEST)
        except Exception as exc:
            self.write_json({"error": f"服务器错误：{exc}"}, HTTPStatus.INTERNAL_SERVER_ERROR)

    def register(self, conn: sqlite3.Connection) -> None:
        data = self.read_json()
        email = str(data.get("email", "")).strip().lower()
        password = str(data.get("password", ""))
        if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", email):
            return self.write_json({"error": "请输入有效邮箱"}, HTTPStatus.BAD_REQUEST)
        if len(password) < 8:
            return self.write_json({"error": "密码至少 8 位"}, HTTPStatus.BAD_REQUEST)
        role = "admin" if conn.execute("SELECT COUNT(*) AS c FROM users").fetchone()["c"] == 0 else "user"
        try:
            cur = conn.execute(
                "INSERT INTO users(email, password_hash, role, created_at) VALUES (?, ?, ?, ?)",
                (email, hash_password(password), role, now_iso()),
            )
        except sqlite3.IntegrityError:
            return self.write_json({"error": "邮箱已注册"}, HTTPStatus.CONFLICT)
        self.set_session(conn, cur.lastrowid)

    def login(self, conn: sqlite3.Connection) -> None:
        data = self.read_json()
        user = conn.execute("SELECT * FROM users WHERE email = ?", (str(data.get("email", "")).strip().lower(),)).fetchone()
        if not user or not verify_password(str(data.get("password", "")), user["password_hash"]):
            return self.write_json({"error": "邮箱或密码错误"}, HTTPStatus.UNAUTHORIZED)
        self.set_session(conn, user["id"])

    def create_entry(self, conn: sqlite3.Connection, user: sqlite3.Row) -> None:
        data = self.read_json()
        content = str(data.get("content", ""))
        error = validate_diary_text(content)
        if error:
            return self.write_json({"error": error}, HTTPStatus.BAD_REQUEST)
        created = datetime.now(TZ).replace(microsecond=0)
        cur = conn.execute(
            "INSERT INTO diary_entries(user_id, content, entry_date, time_period, analysis_status, created_at) VALUES (?, ?, ?, ?, 'pending', ?)",
            (user["id"], content, created.date().isoformat(), time_period(created), created.isoformat()),
        )
        entry_id = cur.lastrowid
        analysis, ai_error = analyze_entry(content)
        if analysis:
            save_analysis(conn, entry_id, analysis)
        else:
            conn.execute(
                "INSERT INTO analysis_jobs(diary_entry_id, status, retry_count, error_message, created_at, updated_at) VALUES (?, 'failed', 0, ?, ?, ?)",
                (entry_id, ai_error or "AI 分析不可用", now_iso(), now_iso()),
            )
        self.write_json({"entry": entry_payload(conn, entry_id)}, HTTPStatus.CREATED)

    def list_entries(self, conn: sqlite3.Connection, user: sqlite3.Row) -> None:
        query = self.path.split("?", 1)[1] if "?" in self.path else ""
        params = urllib.parse.parse_qs(query)
        date_filter = params.get("date", [""])[0]
        tag_filter = params.get("tag", [""])[0]
        sql = "SELECT DISTINCT diary_entries.id FROM diary_entries"
        values: list[Any] = []
        if tag_filter:
            sql += " JOIN diary_entry_tags det ON det.diary_entry_id = diary_entries.id JOIN tags ON tags.id = det.tag_id"
        sql += " WHERE diary_entries.user_id = ?"
        values.append(user["id"])
        if date_filter:
            sql += " AND diary_entries.entry_date = ?"
            values.append(date_filter)
        if tag_filter:
            sql += " AND tags.name = ?"
            values.append(tag_filter)
        sql += " ORDER BY diary_entries.created_at DESC"
        ids = [row["id"] for row in conn.execute(sql, values).fetchall()]
        self.write_json({"entries": [entry_payload(conn, entry_id) for entry_id in ids]})

    def list_tags(self, conn: sqlite3.Connection, user: sqlite3.Row) -> None:
        rows = conn.execute(
            """
            SELECT DISTINCT tags.name, tags.category
            FROM tags
            JOIN diary_entry_tags det ON det.tag_id = tags.id
            JOIN diary_entries de ON de.id = det.diary_entry_id
            WHERE de.user_id = ?
            ORDER BY tags.category, tags.name
            """,
            (user["id"],),
        ).fetchall()
        self.write_json({"tags": [row_to_dict(row) for row in rows]})

    def create_schedule(self, conn: sqlite3.Connection, user: sqlite3.Row) -> None:
        data = self.read_json()
        title = str(data.get("title", "")).strip()
        if not title:
            return self.write_json({"error": "日程标题不能为空"}, HTTPStatus.BAD_REQUEST)
        offset = int(data.get("reminder_offset_minutes", 15))
        if offset not in [0, 5, 15, 30, 60, 120, 1440]:
            return self.write_json({"error": "提醒选项无效"}, HTTPStatus.BAD_REQUEST)
        start_at = str(data.get("start_at"))
        try:
            start_dt = datetime.fromisoformat(start_at)
        except ValueError:
            return self.write_json({"error": "开始时间格式无效"}, HTTPStatus.BAD_REQUEST)
        diary_entry_id = data.get("diary_entry_id")
        if diary_entry_id:
            owner = conn.execute("SELECT user_id FROM diary_entries WHERE id = ?", (diary_entry_id,)).fetchone()
            if not owner or owner["user_id"] != user["id"]:
                return self.write_json({"error": "日记不存在"}, HTTPStatus.NOT_FOUND)
        cur = conn.execute(
            """
            INSERT INTO schedules(user_id, diary_entry_id, title, start_at, end_at, location, note, source, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'diary', ?)
            """,
            (
                user["id"],
                diary_entry_id,
                title,
                start_at,
                data.get("end_at"),
                str(data.get("location", "")),
                str(data.get("note", "")),
                now_iso(),
            ),
        )
        schedule_id = cur.lastrowid
        reminder_at = (start_dt - timedelta(minutes=offset)).replace(microsecond=0).isoformat()
        conn.execute(
            "INSERT INTO schedule_reminders(schedule_id, reminder_at, offset_minutes, status) VALUES (?, ?, ?, 'pending')",
            (schedule_id, reminder_at, offset),
        )
        self.write_json({"schedule": schedule_payload(conn, schedule_id)}, HTTPStatus.CREATED)

    def list_schedules(self, conn: sqlite3.Connection, user: sqlite3.Row) -> None:
        rows = conn.execute("SELECT id FROM schedules WHERE user_id = ? ORDER BY start_at ASC", (user["id"],)).fetchall()
        self.write_json({"schedules": [schedule_payload(conn, row["id"]) for row in rows]})

    def list_analysis_jobs(self, conn: sqlite3.Connection, user: sqlite3.Row) -> None:
        if user["role"] != "admin":
            return self.write_json({"error": "无管理员权限"}, HTTPStatus.FORBIDDEN)
        rows = conn.execute(
            """
            SELECT analysis_jobs.*, diary_entries.content
            FROM analysis_jobs
            JOIN diary_entries ON diary_entries.id = analysis_jobs.diary_entry_id
            ORDER BY analysis_jobs.updated_at DESC
            LIMIT 100
            """
        ).fetchall()
        self.write_json({"jobs": [row_to_dict(row) for row in rows]})


def public_user(user: sqlite3.Row | None) -> dict[str, Any] | None:
    if not user:
        return None
    return {"id": user["id"], "email": user["email"], "role": user["role"]}


def schedule_payload(conn: sqlite3.Connection, schedule_id: int) -> dict[str, Any]:
    schedule = row_to_dict(conn.execute("SELECT * FROM schedules WHERE id = ?", (schedule_id,)).fetchone())
    reminders = conn.execute("SELECT * FROM schedule_reminders WHERE schedule_id = ?", (schedule_id,)).fetchall()
    schedule["reminders"] = [row_to_dict(row) for row in reminders]
    return schedule


if __name__ == "__main__":
    init_db()
    port = int(os.getenv("PORT", "8000"))
    os.chdir(STATIC_DIR)
    print(f"AI Diary app running at http://127.0.0.1:{port}")
    ThreadingHTTPServer(("127.0.0.1", port), Handler).serve_forever()
