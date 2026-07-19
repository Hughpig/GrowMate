import fs from "fs";
import path from "path";
import { EMOJI_RE, MAX_DIARY_LENGTH } from "@/lib/diary-constants";

export { MAX_DIARY_LENGTH } from "@/lib/diary-constants";

function loadSensitiveRules(): Array<{ type: "plain" | "re"; value: string | RegExp }> {
  const candidates = [
    path.join(process.cwd(), "config", "sensitive_words.txt"),
    path.join(process.cwd(), "apps", "web", "config", "sensitive_words.txt"),
  ];
  const file = candidates.find((p) => fs.existsSync(p));
  if (!file) return [];
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
  const rules: Array<{ type: "plain" | "re"; value: string | RegExp }> = [];
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    if (line.startsWith("re:")) {
      try {
        rules.push({ type: "re", value: new RegExp(line.slice(3), "i") });
      } catch {
        // skip
      }
    } else {
      rules.push({ type: "plain", value: line.toLowerCase() });
    }
  }
  return rules;
}

let cachedRules: ReturnType<typeof loadSensitiveRules> | null = null;
function getRules() {
  if (!cachedRules) cachedRules = loadSensitiveRules();
  return cachedRules;
}

export function containsEmoji(text: string) {
  return EMOJI_RE.test(text);
}

export function containsImagePayload(text: string) {
  return /data:image\/|!\[.*\]\(|<img[\s>]|\[image\]/i.test(text);
}

export function findSensitiveMatch(text: string): string | null {
  const lower = text.toLowerCase();
  for (const rule of getRules()) {
    if (rule.type === "plain") {
      if (lower.includes(rule.value as string)) return rule.value as string;
    } else if ((rule.value as RegExp).test(text)) {
      return (rule.value as RegExp).source;
    }
  }
  return null;
}

export function validateDiaryText(text: string): string | null {
  if (typeof text !== "string" || !text.trim()) return "内容不能为空";
  if (text.length > MAX_DIARY_LENGTH) return "单条日记不能超过 " + MAX_DIARY_LENGTH + " 字";
  if (containsEmoji(text) || containsImagePayload(text)) {
    return "仅允许纯文字输入，不能包含图片或表情";
  }
  if (findSensitiveMatch(text)) {
    return "内容包含敏感词或敏感表达，请修改后再提交";
  }
  const visible = [...text].filter((ch) => !/\s/.test(ch));
  if (!visible.length) return "内容不能为空";
  const meaningful = visible.filter((ch) => /[\w\u4e00-\u9fff]/u.test(ch)).length;
  if (meaningful / Math.max(visible.length, 1) < 0.35) {
    return "内容像乱码，请输入可读纯文字";
  }
  return null;
}

export function timePeriodFromDate(date = new Date()): string {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return "上午";
  if (hour >= 12 && hour < 18) return "下午";
  if (hour >= 18 && hour < 23) return "晚上";
  return "深夜";
}
