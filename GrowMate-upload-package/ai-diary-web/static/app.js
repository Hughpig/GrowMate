const state = {
  user: null,
  selectedTag: "",
  pendingEntryId: null,
};

const $ = (id) => document.getElementById(id);

const authView = $("authView");
const appView = $("appView");
const authForm = $("authForm");
const authError = $("authError");
const registerBtn = $("registerBtn");
const logoutBtn = $("logoutBtn");
const userLine = $("userLine");
const diaryInput = $("diaryInput");
const counter = $("counter");
const inputError = $("inputError");
const saveBtn = $("saveBtn");
const entriesEl = $("entries");
const schedulesEl = $("schedules");
const tagFilters = $("tagFilters");
const dateFilter = $("dateFilter");
const clearFilterBtn = $("clearFilterBtn");
const scheduleDialog = $("scheduleDialog");
const scheduleForm = $("scheduleForm");
const cancelScheduleBtn = $("cancelScheduleBtn");

const api = async (path, options = {}) => {
  const response = await fetch(path, {
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "请求失败");
  return data;
};

const hasEmoji = (text) => /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{200D}]/u.test(text);
const hasImagePayload = (text) => /<\s*img\b|data:image\/|!\[[^\]]*\]\([^)]+\)|\.(png|jpe?g|gif|webp|bmp|svg)\b/i.test(text);
const stripEmoji = (text) => text.replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{200D}]/gu, "");

function validateInput() {
  const text = diaryInput.value;
  counter.textContent = `${text.length} / 2000`;
  inputError.textContent = "";
  if (!text.trim()) {
    saveBtn.disabled = true;
    return;
  }
  if (text.length > 2000) {
    inputError.textContent = "字数超限，单条最多 2000 字";
    saveBtn.disabled = true;
    return;
  }
  if (hasEmoji(text) || hasImagePayload(text)) {
    inputError.textContent = "仅允许纯文字输入，不能包含图片或表情";
    saveBtn.disabled = true;
    return;
  }
  saveBtn.disabled = false;
}

function toLocalInputValue(iso) {
  const date = new Date(iso);
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function showAuth() {
  authView.classList.remove("hidden");
  appView.classList.add("hidden");
}

function showApp() {
  authView.classList.add("hidden");
  appView.classList.remove("hidden");
  userLine.textContent = `${state.user.email} · ${state.user.role}`;
}

async function loadMe() {
  const data = await api("/api/auth/me");
  state.user = data.user;
  if (state.user) {
    showApp();
    await Promise.all([loadEntries(), loadTags(), loadSchedules()]);
  } else {
    showAuth();
  }
}

authForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  authError.textContent = "";
  try {
    await api("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: $("email").value, password: $("password").value }),
    });
    await loadMe();
  } catch (error) {
    authError.textContent = error.message;
  }
});

registerBtn.addEventListener("click", async () => {
  authError.textContent = "";
  try {
    await api("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email: $("email").value, password: $("password").value }),
    });
    await loadMe();
  } catch (error) {
    authError.textContent = error.message;
  }
});

logoutBtn.addEventListener("click", async () => {
  await api("/api/auth/logout", { method: "POST", body: "{}" });
  state.user = null;
  showAuth();
});

diaryInput.addEventListener("beforeinput", (event) => {
  if (event.data && hasEmoji(event.data)) {
    event.preventDefault();
    inputError.textContent = "已拦截表情，仅允许纯文字";
  }
});

diaryInput.addEventListener("paste", (event) => {
  const items = [...(event.clipboardData?.items || [])];
  const html = event.clipboardData?.getData("text/html") || "";
  let text = event.clipboardData?.getData("text/plain") || "";
  if (items.some((item) => item.type.startsWith("image/")) || hasImagePayload(html) || hasImagePayload(text)) {
    event.preventDefault();
    inputError.textContent = "已拦截图文内容，仅允许纯文字";
    return;
  }
  if (hasEmoji(text)) {
    event.preventDefault();
    text = stripEmoji(text);
    document.execCommand("insertText", false, text);
    inputError.textContent = "已过滤表情，仅保留纯文字";
  }
});

diaryInput.addEventListener("input", () => {
  if (hasEmoji(diaryInput.value)) {
    diaryInput.value = stripEmoji(diaryInput.value);
    inputError.textContent = "已过滤表情，仅保留纯文字";
  }
  validateInput();
});

saveBtn.addEventListener("click", async () => {
  const content = diaryInput.value;
  diaryInput.value = "";
  validateInput();
  try {
    const data = await api("/api/entries", {
      method: "POST",
      body: JSON.stringify({ content }),
    });
    await Promise.all([loadEntries(), loadTags()]);
    const candidate = data.entry.analysis?.schedule_candidate;
    if (candidate) openScheduleDialog(data.entry.id, candidate);
  } catch (error) {
    inputError.textContent = error.message;
  }
});

dateFilter.addEventListener("change", loadEntries);
clearFilterBtn.addEventListener("click", () => {
  state.selectedTag = "";
  dateFilter.value = "";
  loadEntries();
  loadTags();
});

async function loadEntries() {
  const params = new URLSearchParams();
  if (dateFilter.value) params.set("date", dateFilter.value);
  if (state.selectedTag) params.set("tag", state.selectedTag);
  const data = await api(`/api/entries?${params.toString()}`);
  entriesEl.innerHTML = data.entries.length ? "" : "<p class='entry-meta'>暂无日记</p>";
  for (const entry of data.entries) {
    entriesEl.append(renderEntry(entry));
  }
}

async function loadTags() {
  const data = await api("/api/tags");
  tagFilters.innerHTML = "";
  for (const tag of data.tags) {
    const button = document.createElement("button");
    button.className = `tag-button ${state.selectedTag === tag.name ? "active" : ""}`;
    button.textContent = `${tag.category} · ${tag.name}`;
    button.addEventListener("click", () => {
      state.selectedTag = state.selectedTag === tag.name ? "" : tag.name;
      loadEntries();
      loadTags();
    });
    tagFilters.append(button);
  }
}

function renderEntry(entry) {
  const card = document.createElement("article");
  card.className = "entry";
  const tags = entry.tags.map((tag) => `<span class="tag">${tag.category} · ${tag.name}</span>`).join("");
  card.innerHTML = `
    <div class="entry-meta">${entry.created_at} · ${entry.time_period} · ${entry.analysis_status}</div>
    <div class="entry-content"></div>
    <div class="tag-row">${tags}</div>
  `;
  card.querySelector(".entry-content").textContent = entry.content;
  return card;
}

function openScheduleDialog(entryId, candidate) {
  state.pendingEntryId = entryId;
  $("scheduleTitle").value = candidate.title || "";
  $("scheduleStart").value = toLocalInputValue(candidate.start_at);
  $("scheduleEnd").value = candidate.end_at ? toLocalInputValue(candidate.end_at) : "";
  $("scheduleLocation").value = candidate.location || "";
  $("scheduleNote").value = candidate.note || "";
  $("reminderOffset").value = String(candidate.reminder_offset_minutes ?? 15);
  scheduleDialog.showModal();
}

cancelScheduleBtn.addEventListener("click", () => {
  state.pendingEntryId = null;
  scheduleDialog.close();
});

scheduleForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await api("/api/schedules", {
    method: "POST",
    body: JSON.stringify({
      diary_entry_id: state.pendingEntryId,
      title: $("scheduleTitle").value,
      start_at: new Date($("scheduleStart").value).toISOString(),
      end_at: $("scheduleEnd").value ? new Date($("scheduleEnd").value).toISOString() : null,
      location: $("scheduleLocation").value,
      note: $("scheduleNote").value,
      reminder_offset_minutes: Number($("reminderOffset").value),
    }),
  });
  state.pendingEntryId = null;
  scheduleDialog.close();
  await loadSchedules();
});

async function loadSchedules() {
  const data = await api("/api/schedules");
  schedulesEl.innerHTML = data.schedules.length ? "" : "<p class='schedule-meta'>暂无日程</p>";
  for (const schedule of data.schedules) {
    const item = document.createElement("article");
    item.className = "schedule";
    const reminder = schedule.reminders?.[0];
    item.innerHTML = `
      <strong></strong>
      <div class="schedule-meta">${schedule.start_at}</div>
      <div class="schedule-meta">提醒：${reminder ? `${reminder.offset_minutes} 分钟前` : "无"}</div>
    `;
    item.querySelector("strong").textContent = schedule.title;
    schedulesEl.append(item);
  }
}

loadMe().catch(() => showAuth());

