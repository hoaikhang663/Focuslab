"use strict";

(() => {
  const STORAGE_KEY = "focusforge.data.v1";
  const TIMER_KEY = "focusforge.timer.v1";
  const MIN_FOCUS_MINUTES = 15;
  const HABIT_COLORS = ["#ff8a3d", "#77c69d", "#7da5e8", "#b39bdd", "#df8f9a"];
  const DATA_VERSION = 2;
  const PAGE_NAMES = {
    overview: "Tổng quan",
    focus: "Focus",
    habits: "Thói quen",
    statistics: "Thống kê",
    achievements: "Thành tích",
    settings: "Cài đặt"
  };
  const DAY_NAMES = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
  const ACHIEVEMENTS = [
    { id: "first-focus", title: "Bước đầu tiên", description: "Hoàn thành phiên Focus hợp lệ đầu tiên.", icon: "01", test: (data) => data.focusSessions.some((item) => item.valid) },
    { id: "three-day-streak", title: "Giữ nhịp 3 ngày", description: "Đạt mục tiêu Focus trong 3 ngày liên tiếp.", icon: "03", test: (data) => streakStats(data).best >= 3 },
    { id: "seven-day-streak", title: "Một tuần bền bỉ", description: "Đạt mục tiêu Focus trong 7 ngày liên tiếp.", icon: "07", test: (data) => streakStats(data).best >= 7 },
    { id: "focus-master", title: "Mười giờ tập trung", description: "Tích lũy 10 giờ Focus hợp lệ.", icon: "10", test: (data) => validFocusMs(data) >= 600 * 60000 },
    { id: "habit-builder", title: "Người xây thói quen", description: "Hoàn thành thói quen trong 7 ngày khác nhau.", icon: "H", test: (data) => new Set(data.xpEvents.filter((event) => event.type === "habit").map((event) => event.date)).size >= 7 }
  ];
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => Array.from(document.querySelectorAll(selector));
  const state = {
    data: null,
    timer: null,
    toastTimeout: 0,
    tickHandle: 0,
    editingHabitId: null,
    confirmAction: null,
    storageReadFailed: false,
    observedDate: "",
    clockWarningShown: false,
    clockSample: null
  };

  function localDate(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function shiftDate(dateKey, offset) {
    const [year, month, day] = dateKey.split("-").map(Number);
    const date = new Date(year, month - 1, day + offset, 12);
    return localDate(date);
  }

  function dateFromKey(dateKey) {
    const [year, month, day] = dateKey.split("-").map(Number);
    return new Date(year, month - 1, day, 12);
  }

  function newId() {
    return window.crypto && typeof window.crypto.randomUUID === "function"
      ? window.crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  }

  function createDefaultData() {
    const today = localDate();
    return {
      version: DATA_VERSION,
      createdAt: new Date().toISOString(),
      dateCheckpoint: { date: today, observedAt: new Date().toISOString() },
      settings: { dailyGoalMinutes: 60, defaultDurationMinutes: 25 },
      dailyTargets: { [today]: 60 },
      focusSessions: [],
      habits: [],
      habitArchive: [],
      xpEvents: [],
      achievements: []
    };
  }

  function showToast(message, error = false) {
    const toast = $("#toast");
    toast.textContent = message;
    toast.classList.toggle("error", error);
    toast.classList.add("show");
    window.clearTimeout(state.toastTimeout);
    state.toastTimeout = window.setTimeout(() => toast.classList.remove("show"), 4000);
  }

  function saveData() {
    if (state.storageReadFailed) {
      showToast("Dữ liệu hiện có không đọc được nên FocusForge không ghi đè lên đó. Hãy nhập bản sao hợp lệ hoặc xác nhận xóa dữ liệu trong Cài đặt.", true);
      return false;
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.data));
      return true;
    } catch (error) {
      showToast(`Không thể lưu dữ liệu trên thiết bị: ${error.message}`, true);
      return false;
    }
  }

  function saveTimer() {
    try {
      if (state.timer) localStorage.setItem(TIMER_KEY, JSON.stringify(state.timer));
      else localStorage.removeItem(TIMER_KEY);
      return true;
    } catch (error) {
      showToast(`Không thể lưu trạng thái Focus: ${error.message}`, true);
      return false;
    }
  }

  function isPlainObject(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
  }

  function isDateKey(value) {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    return localDate(dateFromKey(value)) === value;
  }

  function migrateData(data) {
    if (!isPlainObject(data) || data.version !== 1) return { data, migrated: false };
    const migrated = { ...data, version: DATA_VERSION };
    if (!isPlainObject(migrated.dateCheckpoint)) {
      migrated.dateCheckpoint = { date: localDate(), observedAt: new Date().toISOString() };
    }
    if (!Array.isArray(migrated.habits)) migrated.habits = [];
    if (!Array.isArray(migrated.habitArchive)) migrated.habitArchive = [];
    if (!Array.isArray(migrated.xpEvents)) migrated.xpEvents = [];
    for (const habit of [...migrated.habits, ...migrated.habitArchive]) {
      habit.color = HABIT_COLORS.includes(habit.color) ? habit.color : HABIT_COLORS[0];
      habit.completions = Array.isArray(habit.completions) ? habit.completions : [];
      const earned = Array.isArray(habit.earnedDates) ? habit.earnedDates : [...habit.completions];
      migrated.xpEvents.forEach((event) => {
        if (event.type === "habit" && typeof event.refId === "string") {
          const separator = event.refId.lastIndexOf(":");
          if (event.refId.slice(0, separator) === habit.id && isDateKey(event.refId.slice(separator + 1))) {
            earned.push(event.refId.slice(separator + 1));
          }
        }
      });
      habit.earnedDates = Array.from(new Set(earned));
    }
    const knownHabits = new Set([...migrated.habits, ...migrated.habitArchive].map((habit) => habit.id));
    const deletedHistory = new Map();
    migrated.xpEvents.forEach((event) => {
      if (event.type !== "habit" || typeof event.refId !== "string") return;
      const separator = event.refId.lastIndexOf(":");
      const id = event.refId.slice(0, separator);
      const date = event.refId.slice(separator + 1);
      if (separator < 1 || knownHabits.has(id) || !isDateKey(date)) return;
      if (!deletedHistory.has(id)) deletedHistory.set(id, { id, name: "Thói quen đã xóa", icon: "✓", color: HABIT_COLORS[0], createdAt: dateFromKey(date).toISOString(), completions: [], earnedDates: [] });
      deletedHistory.get(id).earnedDates.push(date);
    });
    migrated.habitArchive.push(...deletedHistory.values());
    return { data: migrated, migrated: true };
  }

  function validateData(data) {
    if (!isPlainObject(data) || data.version !== DATA_VERSION || !isPlainObject(data.settings)
      || !Array.isArray(data.focusSessions) || !Array.isArray(data.habits) || !Array.isArray(data.habitArchive)
      || !Array.isArray(data.xpEvents) || !Array.isArray(data.achievements)
      || !isPlainObject(data.dailyTargets)) return "Cấu trúc dữ liệu không đúng phiên bản FocusForge.";
    const { dailyGoalMinutes, defaultDurationMinutes } = data.settings;
    if (!Number.isInteger(dailyGoalMinutes) || dailyGoalMinutes < 15 || dailyGoalMinutes > 600
      || !Number.isInteger(defaultDurationMinutes) || defaultDurationMinutes < 1 || defaultDurationMinutes > 180) {
      return "Thiết lập Focus trong tệp nhập không hợp lệ.";
    }
    const sessionIds = new Set();
    for (const session of data.focusSessions) {
      if (!isPlainObject(session) || typeof session.id !== "string" || !session.id || sessionIds.has(session.id)
        || typeof session.task !== "string" || !session.task.trim() || session.task.length > 100 || !Number.isInteger(session.expectedMinutes)
        || session.expectedMinutes < 1 || session.expectedMinutes > 180
        || !Number.isFinite(session.actualMs) || session.actualMs < 0
        || typeof session.startedAt !== "string" || Number.isNaN(Date.parse(session.startedAt))
        || typeof session.endedAt !== "string" || Number.isNaN(Date.parse(session.endedAt))
        || Date.parse(session.endedAt) < Date.parse(session.startedAt)
        || session.actualMs > session.expectedMinutes * 60000
        || !["completed", "interrupted"].includes(session.status)
        || typeof session.valid !== "boolean"
        || session.valid !== (session.actualMs >= MIN_FOCUS_MINUTES * 60000)) return "Một phiên Focus trong tệp nhập không hợp lệ.";
      sessionIds.add(session.id);
    }
    const habitIds = new Set();
    for (const habit of [...data.habits, ...data.habitArchive]) {
      if (!isPlainObject(habit) || typeof habit.id !== "string" || habitIds.has(habit.id)
        || typeof habit.name !== "string" || !habit.name.trim() || habit.name.length > 70
        || typeof habit.icon !== "string" || typeof habit.createdAt !== "string" || Number.isNaN(Date.parse(habit.createdAt))
        || !HABIT_COLORS.includes(habit.color)
        || !Array.isArray(habit.completions) || !habit.completions.every(isDateKey)
        || new Set(habit.completions).size !== habit.completions.length
        || !Array.isArray(habit.earnedDates) || !habit.earnedDates.every(isDateKey)
        || new Set(habit.earnedDates).size !== habit.earnedDates.length
        || habit.completions.some((date) => !habit.earnedDates.includes(date))) return "Một thói quen trong tệp nhập không hợp lệ.";
      habitIds.add(habit.id);
    }
    if (typeof data.createdAt !== "string" || Number.isNaN(Date.parse(data.createdAt))) return "Thời điểm tạo dữ liệu không hợp lệ.";
    if (data.dateCheckpoint !== undefined && (!isPlainObject(data.dateCheckpoint)
      || !isDateKey(data.dateCheckpoint.date) || typeof data.dateCheckpoint.observedAt !== "string"
      || Number.isNaN(Date.parse(data.dateCheckpoint.observedAt)))) return "Mốc kiểm tra ngày trong dữ liệu không hợp lệ.";
    for (const [date, target] of Object.entries(data.dailyTargets)) {
      if (!isDateKey(date) || !Number.isInteger(target) || target < 15 || target > 600) return "Có mục tiêu ngày không hợp lệ trong tệp nhập.";
    }
    const xpIds = new Set();
    for (const event of data.xpEvents) {
      if (!isPlainObject(event) || typeof event.id !== "string" || xpIds.has(event.id)
        || !Number.isInteger(event.points) || event.points <= 0 || !isDateKey(event.date)
        || typeof event.type !== "string" || typeof event.refId !== "string"
        || !["focus", "habit", "daily-goal"].includes(event.type)
        || event.points !== ({ focus: 10, habit: 5, "daily-goal": 15 })[event.type]
        || event.id !== `${event.type === "daily-goal" ? "goal" : event.type}:${event.refId}`) return "Một sự kiện XP trong tệp nhập không hợp lệ.";
      if (event.type === "focus") {
        const session = data.focusSessions.find((item) => item.id === event.refId && item.valid);
        if (!session || localDate(new Date(session.endedAt)) !== event.date) return "XP phiên Focus không khớp lịch sử phiên.";
      } else if (event.type === "habit") {
        const separator = event.refId.lastIndexOf(":");
        const habitId = event.refId.slice(0, separator);
        const date = event.refId.slice(separator + 1);
        const habit = [...data.habits, ...data.habitArchive].find((item) => item.id === habitId);
        if (separator < 1 || date !== event.date || !habit || !habit.earnedDates.includes(date)) return "XP thói quen không khớp lịch sử hoàn thành.";
      } else {
        const minutes = data.focusSessions
          .filter((item) => item.valid && localDate(new Date(item.endedAt)) === event.date)
          .reduce((sum, item) => sum + item.actualMs / 60000, 0);
        const target = data.dailyTargets[event.date] || data.settings.dailyGoalMinutes;
        if (event.refId !== event.date || minutes < target) return "XP mục tiêu ngày không khớp dữ liệu Focus.";
      }
      xpIds.add(event.id);
    }
    const achievementIds = new Set();
    for (const achievement of data.achievements) {
      const definition = isPlainObject(achievement) && ACHIEVEMENTS.find((item) => item.id === achievement.id);
      if (!isPlainObject(achievement) || !ACHIEVEMENTS.some((item) => item.id === achievement.id)
        || achievementIds.has(achievement.id) || typeof achievement.unlockedAt !== "string"
        || Number.isNaN(Date.parse(achievement.unlockedAt))
        || !definition.test(data)) return "Một thành tích trong tệp nhập không hợp lệ hoặc chưa đủ điều kiện.";
      achievementIds.add(achievement.id);
    }
    return "";
  }

  function validTimer(timer) {
    return isPlainObject(timer) && typeof timer.id === "string" && typeof timer.task === "string"
      && Number.isInteger(timer.expectedMinutes) && timer.expectedMinutes >= 1 && timer.expectedMinutes <= 180
      && ["running", "paused", "pending-save"].includes(timer.status)
      && Number.isFinite(timer.accumulatedMs) && timer.accumulatedMs >= 0
      && timer.accumulatedMs <= timer.expectedMinutes * 60000
      && typeof timer.startedAt === "string" && !Number.isNaN(Date.parse(timer.startedAt))
      && Number.isFinite(timer.phaseStartedAt) && Number.isFinite(timer.phaseEndsAt)
      && timer.phaseEndsAt >= timer.phaseStartedAt
      && (timer.status !== "paused" || (Number.isFinite(timer.remainingMs) && timer.remainingMs >= 0))
      && (timer.status !== "pending-save" || (Number.isFinite(timer.actualMs) && timer.actualMs >= 0
        && timer.actualMs <= timer.expectedMinutes * 60000 && typeof timer.endedAt === "string"
        && !Number.isNaN(Date.parse(timer.endedAt)) && ["completed", "interrupted"].includes(timer.completionType)));
  }

  function loadData() {
    state.data = createDefaultData();
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw !== null) {
        const imported = migrateData(JSON.parse(raw));
        const issue = validateData(imported.data);
        if (issue) throw new Error(issue);
        state.data = imported.data;
        if (imported.migrated && saveData()) showToast("Đã nâng cấp và giữ lại dữ liệu FocusForge.");
      }
      const today = localDate();
      if (!Object.hasOwn(state.data.dailyTargets, today)) {
        state.data.dailyTargets[today] = state.data.settings.dailyGoalMinutes;
        saveData();
      }
    } catch (error) {
      state.storageReadFailed = true;
      showToast(`Không thể đọc dữ liệu FocusForge. Đang dùng bộ nhớ phiên này; dữ liệu cũ chưa bị ghi đè. ${error.message}`, true);
    }
    try {
      const rawTimer = localStorage.getItem(TIMER_KEY);
      if (!rawTimer) return;
      const timer = JSON.parse(rawTimer);
      if (!validTimer(timer)) throw new Error("Trạng thái bộ đếm không hợp lệ.");
      state.timer = timer;
      if (timer.status === "running" && Date.now() >= timer.phaseEndsAt) completeTimer();
    } catch (error) {
      showToast(`Không thể khôi phục phiên Focus đang chạy: ${error.message}`, true);
      state.timer = null;
    }
  }

  function dayOrdinal(dateKey) {
    const [year, month, day] = dateKey.split("-").map(Number);
    return Math.floor(Date.UTC(year, month - 1, day) / 86400000);
  }

  function clockLooksChanged(now = Date.now()) {
    const checkpoint = state.data.dateCheckpoint;
    if (!checkpoint) return false;
    const today = localDate(new Date(now));
    const daysPassed = dayOrdinal(today) - dayOrdinal(checkpoint.date);
    const elapsed = now - Date.parse(checkpoint.observedAt);
    if (daysPassed < 0 || elapsed < -120000) return true;
    if (daysPassed > Math.max(2, Math.floor(elapsed / 86400000) + 1)) return true;
    if (daysPassed === 1 && elapsed >= 0 && elapsed < 120000
      && Math.abs(new Date(now).getHours() * 60 + new Date(now).getMinutes()
        - (new Date(checkpoint.observedAt).getHours() * 60 + new Date(checkpoint.observedAt).getMinutes())) < 120) return true;
    return false;
  }

  function warnClockChange() {
    if (state.clockWarningShown) return;
    state.clockWarningShown = true;
    showToast("Ngày hoặc giờ thiết bị có vẻ đã thay đổi. Streak và XP dùng ngày địa phương nên kết quả có thể không chính xác; hãy tránh chỉnh đồng hồ để nhận tiến độ.", true);
  }

  function validFocusMs(data = state.data) {
    return data.focusSessions.filter((session) => session.valid).reduce((total, session) => total + session.actualMs, 0);
  }

  function focusMinutesForDate(dateKey) {
    return state.data.focusSessions
      .filter((session) => session.valid && localDate(new Date(session.endedAt)) === dateKey)
      .reduce((total, session) => total + session.actualMs / 60000, 0);
  }

  function dailyTarget(dateKey) {
    return state.data.dailyTargets[dateKey] || state.data.settings.dailyGoalMinutes;
  }

  function goalMet(dateKey) {
    return focusMinutesForDate(dateKey) >= dailyTarget(dateKey);
  }

  function streakStats(data = state.data) {
    const previousData = state.data;
    if (data !== state.data) state.data = data;
    const achieved = new Set();
    const dates = new Set(data.focusSessions.filter((session) => session.valid).map((session) => localDate(new Date(session.endedAt))));
    for (const date of dates) {
      if (focusMinutesForDate(date) >= dailyTarget(date)) achieved.add(date);
    }
    const sorted = Array.from(achieved).sort();
    let best = 0;
    let run = 0;
    let previous = "";
    sorted.forEach((date) => {
      run = previous && shiftDate(previous, 1) === date ? run + 1 : 1;
      best = Math.max(best, run);
      previous = date;
    });
    const today = localDate();
    const anchor = achieved.has(today) ? today : shiftDate(today, -1);
    let current = 0;
    if (achieved.has(anchor)) {
      let cursor = anchor;
      while (achieved.has(cursor)) {
        current += 1;
        cursor = shiftDate(cursor, -1);
      }
    }
    if (data !== previousData) state.data = previousData;
    return { current, best, achieved };
  }

  function totalXp() {
    return state.data.xpEvents.reduce((sum, event) => sum + event.points, 0);
  }

  function addXpEvent(id, type, refId, date, points) {
    if (state.data.xpEvents.some((event) => event.id === id)) return false;
    state.data.xpEvents.push({ id, type, refId, date, points });
    return true;
  }

  function recomputeAchievements() {
    const unlocked = new Set(state.data.achievements.map((item) => item.id));
    ACHIEVEMENTS.forEach((achievement) => {
      if (!unlocked.has(achievement.id) && achievement.test(state.data)) {
        state.data.achievements.push({ id: achievement.id, unlockedAt: new Date().toISOString() });
      }
    });
  }

  function reconcileXp() {
    let changed = false;
    state.data.focusSessions.filter((session) => session.valid).forEach((session) => {
      changed = addXpEvent(`focus:${session.id}`, "focus", session.id, localDate(new Date(session.endedAt)), 10) || changed;
    });
    [...state.data.habits, ...state.data.habitArchive].forEach((habit) => {
      habit.completions.forEach((date) => {
        changed = addXpEvent(`habit:${habit.id}:${date}`, "habit", `${habit.id}:${date}`, date, 5) || changed;
      });
    });
    const achievedDates = streakStats().achieved;
    achievedDates.forEach((date) => {
      changed = addXpEvent(`goal:${date}`, "daily-goal", date, date, 15) || changed;
    });
    const before = state.data.achievements.length;
    recomputeAchievements();
    changed = state.data.achievements.length !== before || changed;
    return changed;
  }

  function formatMinutes(milliseconds, decimals = false) {
    const minutes = milliseconds / 60000;
    return decimals ? `${minutes.toFixed(1)} phút` : `${Math.floor(minutes)} phút`;
  }

  function formatDateTime(iso) {
    return new Intl.DateTimeFormat("vi-VN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
  }

  function formatLongDate(dateKey) {
    return new Intl.DateTimeFormat("vi-VN", { weekday: "short", day: "numeric", month: "short" }).format(dateFromKey(dateKey));
  }

  function addClass(parent, className, text) {
    const node = document.createElement("span");
    node.className = className;
    node.textContent = text;
    parent.append(node);
    return node;
  }

  function renderOverview() {
    const today = localDate();
    const goal = dailyTarget(today);
    const minutes = focusMinutesForDate(today);
    const habits = state.data.habits;
    const completedHabits = habits.filter((habit) => habit.completions.includes(today)).length;
    const streak = streakStats();
    const level = Math.floor(totalXp() / 100) + 1;
    $("#overview-streak").innerHTML = `${streak.current} <small>ngày</small>`;
    $("#overview-streak-foot").textContent = streak.current ? `Kỷ lục cá nhân: ${streak.best} ngày` : "Đạt mục tiêu Focus mỗi ngày";
    $("#overview-focus").innerHTML = `${Math.floor(minutes)} <small>phút</small>`;
    $("#overview-focus-foot").textContent = `Mục tiêu ${goal} phút · ${goalMet(today) ? "đã đạt" : `${Math.max(0, Math.ceil(goal - minutes))} phút còn lại`}`;
    $("#overview-habits").innerHTML = `${completedHabits} <small>/ ${habits.length}</small>`;
    const disciplineTotal = habits.length + 1;
    const disciplineDone = (goalMet(today) ? 1 : 0) + completedHabits;
    $("#overview-discipline").innerHTML = `${disciplineTotal ? Math.floor(disciplineDone / disciplineTotal * 100) : 0} <small>%</small>`;
    $("#overview-xp").textContent = `${totalXp()} XP · Level ${level}`;
    $("#overview-default-duration").innerHTML = `${state.data.settings.defaultDurationMinutes} <small>phút</small>`;
    const week = $("#overview-week");
    week.replaceChildren();
    for (let offset = 6; offset >= 0; offset -= 1) {
      const date = shiftDate(today, -offset);
      const item = document.createElement("span");
      item.className = goalMet(date) ? "day-achieved" : date === today ? "day-current" : "day-missed";
      addClass(item, "", DAY_NAMES[dateFromKey(date).getDay()]);
      const mark = document.createElement("b");
      mark.textContent = goalMet(date) ? "✓" : "·";
      item.append(mark);
      week.append(item);
    }
    $("#streak-caption").textContent = `Streak hiện tại ${streak.current} ngày · kỷ lục ${streak.best} ngày.`;
    renderOverviewChart();
    renderOverviewHabits();
  }

  function renderOverviewChart() {
    const container = $("#overview-chart");
    const today = localDate();
    const values = Array.from({ length: 7 }, (_, index) => {
      const date = shiftDate(today, index - 6);
      return { date, minutes: focusMinutesForDate(date) };
    });
    const maximum = Math.max(...values.map((item) => item.minutes), 0);
    if (!maximum) {
      container.className = "chart-empty";
      container.innerHTML = '<span class="empty-chart-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19V12m5 7V5m5 14v-9m5 9V3"/></svg></span><strong>Chưa có phiên Focus được ghi nhận</strong><span>Hoàn thành phiên Focus đầu tiên để bắt đầu theo dõi.</span>';
      return;
    }
    container.className = "focus-week-chart";
    container.replaceChildren();
    values.forEach(({ date, minutes }) => {
      const column = document.createElement("div");
      column.className = "focus-chart-column";
      const value = document.createElement("span");
      value.textContent = minutes ? `${Math.round(minutes)}` : "";
      const area = document.createElement("div");
      area.className = "focus-chart-area";
      const bar = document.createElement("i");
      bar.style.height = `${minutes ? Math.max(3, minutes / maximum * 84) : 0}px`;
      area.append(bar);
      const label = document.createElement("small");
      label.textContent = DAY_NAMES[dateFromKey(date).getDay()];
      column.append(value, area, label);
      container.append(column);
    });
  }

  function renderOverviewHabits() {
    const list = $("#overview-habits-list");
    const habits = state.data.habits;
    if (!habits.length) {
      list.className = "empty-habits";
      list.innerHTML = '<span class="habit-check" aria-hidden="true"><svg viewBox="0 0 20 20"><path d="m4 10 4 4 8-8"/></svg></span><strong>Chưa có thói quen nào</strong><span>Tạo một thói quen nhỏ để bắt đầu xây dựng nhịp độ.</span><a href="#habits" data-page-link="habits" class="subtle-link">Đến mục Thói quen <span aria-hidden="true">→</span></a>';
      return;
    }
    list.className = "overview-habit-rows";
    list.replaceChildren();
    habits.slice(0, 4).forEach((habit) => {
      const row = document.createElement("div");
      row.className = "overview-habit-row";
      const icon = document.createElement("span");
      icon.className = "habit-mini-icon";
      icon.textContent = habit.icon;
      icon.style.color = habit.color;
      icon.style.borderColor = habit.color;
      const name = document.createElement("strong");
      name.textContent = habit.name;
      const status = document.createElement("span");
      status.className = habit.completions.includes(localDate()) ? "habit-status complete" : "habit-status";
      status.textContent = habit.completions.includes(localDate()) ? "Hoàn thành" : "Đang chờ";
      row.append(icon, name, status);
      list.append(row);
    });
  }

  function timerElapsed(now = Date.now()) {
    if (!state.timer) return 0;
    return state.timer.accumulatedMs + (state.timer.status === "running" ? Math.min(now, state.timer.phaseEndsAt) - state.timer.phaseStartedAt : 0);
  }

  function timerRemaining(now = Date.now()) {
    if (!state.timer) return 0;
    if (state.timer.status === "paused") return state.timer.remainingMs;
    if (state.timer.status === "pending-save") return 0;
    return Math.max(0, state.timer.phaseEndsAt - now);
  }

  function setTimerState(status, remainingMs) {
    const timer = state.timer;
    if (!timer) return;
    const now = Date.now();
    if (status === "paused" && timer.status === "running") {
      timer.accumulatedMs += Math.max(0, Math.min(now, timer.phaseEndsAt) - timer.phaseStartedAt);
      timer.remainingMs = Math.max(0, timer.phaseEndsAt - now);
      timer.status = "paused";
    } else if (status === "running" && timer.status === "paused") {
      timer.status = "running";
      timer.phaseStartedAt = now;
      timer.phaseEndsAt = now + (remainingMs ?? timer.remainingMs);
      delete timer.remainingMs;
    }
    saveTimer();
    renderTimer();
  }

  function startFocus(event) {
    event.preventDefault();
    const form = $("#focus-form");
    if (!form.reportValidity()) return;
    if (state.timer) {
      showToast("Đã có một phiên Focus đang hoạt động.", true);
      return;
    }
    const task = $("#focus-task").value.trim();
    const choice = $('input[name="focus-duration"]:checked').value;
    const minutes = choice === "custom" ? Number($("#custom-duration").value) : Number(choice);
    if (!task || !Number.isInteger(minutes) || minutes < 1 || minutes > 180) {
      showToast("Nhập nhiệm vụ và thời lượng từ 1 đến 180 phút.", true);
      return;
    }
    const now = Date.now();
    state.timer = {
      id: newId(),
      task,
      expectedMinutes: minutes,
      status: "running",
      accumulatedMs: 0,
      startedAt: new Date(now).toISOString(),
      phaseStartedAt: now,
      phaseEndsAt: now + minutes * 60000
    };
    if (!saveTimer()) {
      state.timer = null;
      renderTimer();
      return;
    }
    renderTimer();
    showToast("Đã bắt đầu phiên Focus. Hãy dành sự chú ý cho nhiệm vụ này.");
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch((error) => showToast(`Không thể bật thông báo: ${error instanceof Error ? error.message : String(error)}`, true));
    }
  }

  function completeTimer() {
    if (!state.timer || state.timer.status === "pending-save") return;
    const timer = state.timer;
    timer.accumulatedMs += Math.max(0, timer.phaseEndsAt - timer.phaseStartedAt);
    timer.status = "pending-save";
    timer.actualMs = Math.min(timer.accumulatedMs, timer.expectedMinutes * 60000);
    timer.endedAt = new Date(timer.phaseEndsAt).toISOString();
    timer.completionType = "completed";
    saveTimer();
    renderTimer();
    notifyFocusComplete();
    openConfirm({
      title: "Phiên Focus đã hoàn thành",
      message: `Bạn đã tập trung "${timer.task}" trong ${formatMinutes(timer.actualMs)}. Lưu phiên vào lịch sử?`,
      accept: "Lưu phiên",
      cancel: "Bỏ phiên",
      onAccept: savePendingSession,
      onCancel: discardPendingSession
    });
  }

  function notifyFocusComplete() {
    showToast("Hoàn thành phiên Focus. Hãy ghi nhận kết quả.");
    if ("Notification" in window && Notification.permission === "granted") {
      try {
        new Notification("FocusForge", { body: `Bạn đã hoàn thành: ${state.timer.task}` });
      } catch (error) {
        showToast(`Phiên đã hoàn thành nhưng không thể hiển thị thông báo: ${error instanceof Error ? error.message : String(error)}`, true);
      }
    }
  }

  function endFocusEarly() {
    if (!state.timer || state.timer.status === "pending-save") return;
    const timer = state.timer;
    openConfirm({
      title: "Kết thúc phiên sớm?",
      message: `Thời gian Focus thực tế là ${formatMinutes(timerElapsed())}. Bạn có thể lưu phiên này vào lịch sử; phiên dưới 15 phút không tính vào streak, XP hay thành tích.`,
      accept: "Kết thúc & lưu",
      cancel: timer.status === "paused" ? "Tiếp tục phiên" : "Tiếp tục Focus",
      onCancel: () => {
        if (timer.status === "paused") setTimerState("running");
      },
      onAccept: () => {
        const now = Date.now();
        timer.actualMs = Math.max(0, Math.floor(timerElapsed(now)));
        timer.endedAt = new Date(now).toISOString();
        timer.status = "pending-save";
        timer.completionType = "interrupted";
        saveTimer();
        savePendingSession();
      }
    });
  }

  function savePendingSession() {
    if (!state.timer || state.timer.status !== "pending-save") return;
    const timer = state.timer;
    if (state.data.focusSessions.some((session) => session.id === timer.id)) {
      state.timer = null;
      saveTimer();
      renderAll();
      showToast("Phiên Focus này đã được lưu trước đó; không ghi trùng.");
      return;
    }
    const valid = timer.actualMs >= MIN_FOCUS_MINUTES * 60000;
    const session = {
      id: timer.id,
      task: timer.task,
      expectedMinutes: timer.expectedMinutes,
      actualMs: Math.max(0, timer.actualMs),
      startedAt: timer.startedAt,
      endedAt: timer.endedAt,
      status: timer.completionType === "completed" ? "completed" : "interrupted",
      valid
    };
    state.data.focusSessions.push(session);
    const startDay = localDate(new Date(session.startedAt));
    if (!Object.hasOwn(state.data.dailyTargets, startDay)) state.data.dailyTargets[startDay] = state.data.settings.dailyGoalMinutes;
    const stored = saveData();
    if (!stored) {
      state.data.focusSessions.pop();
      return;
    }
    reconcileXp();
    saveData();
    showToast(valid ? "Đã lưu phiên Focus. XP và tiến độ đã được cập nhật." : "Đã lưu phiên ngắn vào lịch sử; phiên chưa đạt ngưỡng hợp lệ 15 phút.");
    state.timer = null;
    saveTimer();
    $("#focus-form").reset();
    applyDefaultDurationChoice();
    renderAll();
  }

  function discardPendingSession() {
    state.timer = null;
    saveTimer();
    renderAll();
    showToast("Phiên Focus không được lưu.");
  }

  function renderTimer() {
    const timer = state.timer;
    const setup = $("#timer-setup");
    const stateLabel = $("#timer-state");
    const stateDot = $("#timer-state-dot");
    const primary = $("#timer-main-action");
    const controls = $("#timer-controls");
    setup.hidden = Boolean(timer);

    if (!timer) {
      const choice = $('input[name="focus-duration"]:checked')?.value || String(state.data.settings.defaultDurationMinutes);
      const shownMinutes = choice === "custom" ? Number($("#custom-duration").value) || state.data.settings.defaultDurationMinutes : Number(choice);
      $("#custom-duration-wrap").hidden = choice !== "custom";
      stateLabel.textContent = "SẴN SÀNG";
      stateDot.className = "timer-state-dot";
      $("#timer-task-label").textContent = "CHỌN NHIỆM VỤ";
      $("#timer-display").textContent = `${String(shownMinutes).padStart(2, "0")}:00`;
      $("#timer-progress-label").textContent = "0% hoàn thành";
      $("#timer-task").textContent = "Tập trung vào điều quan trọng nhất.";
      $("#timer-help").textContent = `Mục tiêu ngày ${state.data.settings.dailyGoalMinutes} phút · Phiên hợp lệ từ ${MIN_FOCUS_MINUTES} phút.`;
      $("#timer-progress").style.setProperty("--timer-progress", "0deg");
      controls.replaceChildren();
      primary.disabled = true;
      primary.textContent = "Bắt đầu";
      controls.append(primary);
      return;
    }

    $("#timer-task-label").textContent = timer.task.toLocaleUpperCase("vi").slice(0, 28);
    $("#timer-task").textContent = timer.task;
    const remaining = timerRemaining();
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor(remaining % 60000 / 1000);
    $("#timer-display").textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    const percent = timer.status === "pending-save" ? 100 : Math.min(100, timerElapsed() / (timer.expectedMinutes * 60000) * 100);
    $("#timer-progress").style.setProperty("--timer-progress", `${percent * 3.6}deg`);
    $("#timer-progress-label").textContent = `${Math.floor(percent)}% hoàn thành`;
    $("#timer-help").textContent = timer.status === "pending-save"
      ? `Thời gian thực tế: ${formatMinutes(timer.actualMs)} · Xác nhận lưu để ghi nhận.`
      : timer.status === "paused" ? "Đồng hồ đã tạm dừng; thời gian tạm dừng không được tính."
        : `Đã tập trung ${formatMinutes(timerElapsed())} · Dự kiến ${timer.expectedMinutes} phút`;
    stateLabel.textContent = timer.status === "running" ? "ĐANG TẬP TRUNG" : timer.status === "paused" ? "ĐÃ TẠM DỪNG" : "CHỜ XÁC NHẬN";
    stateDot.className = `timer-state-dot ${timer.status}`;
    controls.replaceChildren();
    if (timer.status === "pending-save") {
      primary.disabled = false;
      primary.textContent = "Lưu phiên";
      primary.onclick = savePendingSession;
      const discard = document.createElement("button");
      discard.type = "button";
      discard.className = "button button-outline";
      discard.textContent = "Bỏ phiên";
      discard.addEventListener("click", () => openConfirm({
        title: "Bỏ phiên Focus?",
        message: "Phiên này sẽ không được thêm vào lịch sử và sẽ không nhận XP.",
        accept: "Bỏ phiên",
        onAccept: discardPendingSession
      }));
      controls.append(primary, discard);
    } else {
      primary.disabled = false;
      primary.className = "button button-primary";
      primary.textContent = timer.status === "running" ? "Tạm dừng" : "Tiếp tục";
      primary.onclick = () => {
        if (timer.status === "running" && Date.now() >= timer.phaseEndsAt) completeTimer();
        else setTimerState(timer.status === "running" ? "paused" : "running");
      };
      const end = document.createElement("button");
      end.type = "button";
      end.className = "button button-outline";
      end.textContent = "Kết thúc sớm";
      end.addEventListener("click", endFocusEarly);
      controls.append(primary, end);
    }
  }

  function updateDurationChoice() {
    const custom = $('input[name="focus-duration"]:checked')?.value === "custom";
    $("#custom-duration-wrap").hidden = !custom;
    if (!state.timer) renderTimer();
  }

  function applyDefaultDurationChoice() {
    const minutes = state.data.settings.defaultDurationMinutes;
    const value = minutes === 25 || minutes === 50 ? String(minutes) : "custom";
    const radio = $(`input[name="focus-duration"][value="${value}"]`);
    if (radio) radio.checked = true;
    $("#custom-duration").value = String(minutes);
    $("#custom-duration-wrap").hidden = value !== "custom";
  }

  function renderFocusHistory() {
    const list = $("#focus-history");
    const sessions = [...state.data.focusSessions].sort((a, b) => Date.parse(b.endedAt) - Date.parse(a.endedAt));
    $("#focus-session-count").textContent = `${sessions.length} ${sessions.length === 1 ? "phiên" : "phiên"}`;
    if (!sessions.length) {
      list.className = "history-list empty-list";
      list.textContent = "Chưa có phiên Focus. Lịch sử sẽ xuất hiện sau khi bạn lưu phiên đầu tiên.";
      return;
    }
    list.className = "history-list";
    list.replaceChildren();
    sessions.slice(0, 8).forEach((session) => {
      const row = document.createElement("div");
      row.className = "history-row";
      const detail = document.createElement("div");
      detail.className = "history-detail";
      const title = document.createElement("strong");
      title.textContent = session.task;
      const meta = document.createElement("small");
      meta.textContent = `${formatDateTime(session.startedAt)} · ${session.status === "completed" ? "Hoàn thành" : "Kết thúc sớm"}`;
      detail.append(title, meta);
      const duration = document.createElement("span");
      duration.textContent = formatMinutes(session.actualMs);
      const valid = document.createElement("span");
      valid.className = session.valid ? "session-badge valid" : "session-badge";
      valid.textContent = session.valid ? "Hợp lệ" : "Dưới 15 phút";
      row.append(detail, duration, valid);
      list.append(row);
    });
  }

  function renderHabits() {
    const today = localDate();
    const list = $("#habit-list");
    $("#habit-progress-label").textContent = `${state.data.habits.filter((habit) => habit.completions.includes(today)).length} / ${state.data.habits.length}`;
    if (!state.data.habits.length) {
      list.className = "habit-list empty-list";
      list.textContent = "Chưa có thói quen. Tạo thói quen đầu tiên bằng biểu mẫu bên cạnh.";
      return;
    }
    list.className = "habit-list";
    list.replaceChildren();
    state.data.habits.forEach((habit) => {
      const done = habit.completions.includes(today);
      const row = document.createElement("article");
      row.className = `habit-item ${done ? "is-done" : ""}`;
      const mark = document.createElement("button");
      mark.type = "button";
      mark.className = "habit-complete";
      mark.dataset.habitToggle = habit.id;
      mark.setAttribute("aria-label", done ? `Bỏ hoàn thành ${habit.name}` : `Hoàn thành ${habit.name}`);
      mark.setAttribute("aria-pressed", String(done));
      mark.textContent = done ? "✓" : "";
      const identity = document.createElement("span");
      identity.className = "habit-item-icon";
      identity.textContent = habit.icon;
      identity.style.color = habit.color;
      identity.style.borderColor = habit.color;
      const name = document.createElement("div");
      name.className = "habit-item-name";
      const title = document.createElement("strong");
      title.textContent = habit.name;
      const subtitle = document.createElement("small");
      subtitle.textContent = done ? "Hoàn thành hôm nay · +5 XP" : "Một lần mỗi ngày · +5 XP";
      const history = document.createElement("span");
      history.className = "habit-history";
      for (let offset = 6; offset >= 0; offset -= 1) {
        const date = shiftDate(today, -offset);
        const day = document.createElement("span");
        const completed = habit.completions.includes(date);
        day.className = completed ? "history-day done" : "history-day";
        day.textContent = DAY_NAMES[dateFromKey(date).getDay()];
        day.title = `${formatLongDate(date)}${completed ? " · Hoàn thành" : ""}`;
        day.setAttribute("aria-label", day.title);
        history.append(day);
      }
      name.append(title, subtitle, history);
      const actions = document.createElement("div");
      actions.className = "habit-actions";
      const edit = document.createElement("button");
      edit.type = "button";
      edit.className = "small-action";
      edit.textContent = "Sửa";
      edit.dataset.habitEdit = habit.id;
      edit.setAttribute("aria-label", `Sửa ${habit.name}`);
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "small-action danger-text";
      remove.textContent = "Xóa";
      remove.dataset.habitDelete = habit.id;
      remove.setAttribute("aria-label", `Xóa ${habit.name}`);
      actions.append(edit, remove);
      row.append(mark, identity, name, actions);
      list.append(row);
    });
  }

  function renderStreak() {
    const stats = streakStats();
    $("#streak-current").textContent = `${stats.current} ${stats.current === 1 ? "ngày liên tiếp" : "ngày liên tiếp"}`;
    $("#streak-best").textContent = `Kỷ lục: ${stats.best} ngày`;
    const today = localDate();
    const week = $("#habit-week");
    week.replaceChildren();
    for (let offset = 6; offset >= 0; offset -= 1) {
      const date = shiftDate(today, -offset);
      const item = document.createElement("span");
      item.className = stats.achieved.has(date) ? "day-achieved" : date === today ? "day-current" : "day-missed";
      addClass(item, "", DAY_NAMES[dateFromKey(date).getDay()]);
      const mark = document.createElement("b");
      mark.textContent = stats.achieved.has(date) ? "✓" : "·";
      item.append(mark);
      week.append(item);
    }
    $("#streak-message").textContent = goalMet(today)
      ? `Mục tiêu hôm nay đã đạt (${Math.floor(focusMinutesForDate(today))}/${dailyTarget(today)} phút).`
      : `Mục tiêu hôm nay: ${dailyTarget(today)} phút Focus hợp lệ. Đã tích lũy ${Math.floor(focusMinutesForDate(today))} phút.`;
  }

  function renderStatistics() {
    const validSessions = state.data.focusSessions.filter((session) => session.valid);
    const total = validFocusMs();
    const avg = validSessions.length ? total / validSessions.length / 60000 : 0;
    let planned = 0;
    let completed = 0;
    const today = localDate();
    const weekly = [];
    for (let offset = 6; offset >= 0; offset -= 1) {
      const date = shiftDate(today, -offset);
      const minutes = focusMinutesForDate(date);
      const sessions = validSessions.filter((session) => localDate(new Date(session.endedAt)) === date).length;
      const activeHabits = state.data.habits.filter((habit) => localDate(new Date(habit.createdAt)) <= date);
      const done = activeHabits.filter((habit) => habit.completions.includes(date)).length;
      planned += activeHabits.length;
      completed += done;
      weekly.push({ date, minutes, sessions, done, planned: activeHabits.length, goal: goalMet(date) });
    }
    $("#analytics-valid-count").textContent = String(validSessions.length);
    $("#analytics-total-time").innerHTML = `${Math.floor(total / 60000)} <small>phút</small>`;
    $("#analytics-average").innerHTML = `${avg.toFixed(1).replace(".", ",")} <small>phút</small>`;
    $("#analytics-habit-rate").innerHTML = `${planned ? Math.round(completed / planned * 100) : "—"} <small>%</small>`;
    const streak = streakStats();
    $("#statistics-streak").textContent = `Streak ${streak.current} · Kỷ lục ${streak.best}`;
    const chart = $("#statistics-chart");
    if (!total) {
      chart.className = "statistics-chart chart-no-data";
      chart.textContent = "Chưa có phiên Focus hợp lệ trong dữ liệu.";
    } else {
      chart.className = "statistics-chart";
      chart.replaceChildren();
      const max = Math.max(...weekly.map((item) => item.minutes), 1);
      weekly.forEach(({ date, minutes }) => {
        const column = document.createElement("div");
        column.className = "statistics-column";
        const amount = document.createElement("span");
        amount.textContent = minutes ? `${Math.round(minutes)}m` : "";
        const barArea = document.createElement("div");
        barArea.className = "statistics-bar-area";
        const bar = document.createElement("i");
        bar.style.height = `${minutes ? Math.max(4, minutes / max * 115) : 0}px`;
        barArea.append(bar);
        const label = document.createElement("small");
        label.textContent = DAY_NAMES[dateFromKey(date).getDay()];
        column.append(amount, barArea, label);
        chart.append(column);
      });
    }
    const body = $("#statistics-table");
    body.replaceChildren();
    weekly.slice().reverse().forEach((item) => {
      const row = document.createElement("tr");
      [formatLongDate(item.date), `${Math.floor(item.minutes)} phút`, String(item.sessions), `${item.done} / ${item.planned}`, item.goal ? "Đạt" : "Chưa đạt"].forEach((value, index) => {
        const cell = document.createElement("td");
        cell.textContent = value;
        if (index === 4) cell.className = item.goal ? "goal-cell achieved" : "goal-cell";
        row.append(cell);
      });
      body.append(row);
    });
  }

  function renderAchievements() {
    const xp = totalXp();
    const level = Math.floor(xp / 100) + 1;
    const intoLevel = xp % 100;
    $("#level-value").textContent = `Level ${level}`;
    $("#xp-total").textContent = `${xp} XP`;
    $("#achievement-xp").textContent = `${xp} XP`;
    $("#level-progress").style.width = `${intoLevel}%`;
    $("#level-next").textContent = `${intoLevel} / 100 XP đến Level ${level + 1}`;
    const unlocked = new Map(state.data.achievements.map((item) => [item.id, item]));
    $("#achievement-count").textContent = `${unlocked.size} / ${ACHIEVEMENTS.length} đã mở khóa`;
    const list = $("#achievement-list");
    list.replaceChildren();
    ACHIEVEMENTS.forEach((achievement) => {
      const achieved = unlocked.has(achievement.id);
      const card = document.createElement("article");
      card.className = `achievement-item ${achieved ? "unlocked" : "locked"}`;
      const mark = document.createElement("span");
      mark.className = "achievement-icon";
      mark.textContent = achievement.icon;
      const copy = document.createElement("div");
      copy.className = "achievement-copy";
      const title = document.createElement("strong");
      title.textContent = achievement.title;
      const description = document.createElement("small");
      description.textContent = achievement.description;
      copy.append(title, description);
      const status = document.createElement("span");
      status.className = "achievement-status";
      status.textContent = achieved ? `Mở khóa ${formatDateTime(unlocked.get(achievement.id).unlockedAt)}` : "Chưa mở khóa";
      card.append(mark, copy, status);
      list.append(card);
    });
  }

  function renderAll() {
    renderOverview();
    renderTimer();
    renderFocusHistory();
    renderHabits();
    renderStreak();
    renderStatistics();
    renderAchievements();
    $("#daily-goal").value = state.data.settings.dailyGoalMinutes;
    $("#default-duration").value = state.data.settings.defaultDurationMinutes;
  }

  function navigate(pageName) {
    if (!Object.hasOwn(PAGE_NAMES, pageName)) return;
    $$(".page").forEach((page) => {
      const active = page.id === `page-${pageName}`;
      page.hidden = !active;
      page.classList.toggle("active", active);
    });
    $$("[data-page-link]").forEach((link) => {
      const active = link.dataset.pageLink === pageName;
      link.classList.toggle("active", active);
      if (link.classList.contains("nav-link")) {
        if (active) link.setAttribute("aria-current", "page");
        else link.removeAttribute("aria-current");
      }
    });
    $("#current-page-label").textContent = PAGE_NAMES[pageName];
    if (location.hash !== `#${pageName}`) history.replaceState(null, "", `#${pageName}`);
    $("#sidebar").classList.remove("open");
    $("#menu-toggle").setAttribute("aria-expanded", "false");
    $("#menu-toggle").setAttribute("aria-label", "Mở điều hướng");
  }

  function openConfirm({ title, message, accept = "Xác nhận", cancel = "Hủy", onAccept, onCancel }) {
    state.confirmAction = { onAccept, onCancel };
    $("#confirm-title").textContent = title;
    $("#confirm-message").textContent = message;
    $("#confirm-accept").textContent = accept;
    $("#confirm-cancel").textContent = cancel;
    $("#confirm-modal").hidden = false;
    $("#confirm-cancel").focus();
  }

  function closeConfirm(accepted) {
    const action = state.confirmAction;
    state.confirmAction = null;
    $("#confirm-modal").hidden = true;
    if (accepted && action?.onAccept) action.onAccept();
    if (!accepted && action?.onCancel) action.onCancel();
  }

  function resetHabitForm() {
    state.editingHabitId = null;
    $("#habit-form").reset();
    $("#habit-form-title").textContent = "Tạo thói quen";
    $("#habit-form-kicker").textContent = "THÊM VÀO NHỊP ĐỘ";
    $("#habit-submit").textContent = "Thêm thói quen";
    $("#habit-cancel-edit").hidden = true;
  }

  function submitHabit(event) {
    event.preventDefault();
    if (!$("#habit-form").reportValidity()) return;
    const name = $("#habit-name").value.trim();
    if (!name) return;
    let oldValue = null;
    let createdHabit = null;
    if (state.editingHabitId) {
      const habit = state.data.habits.find((item) => item.id === state.editingHabitId);
      if (!habit) {
        showToast("Không tìm thấy thói quen cần sửa.", true);
        resetHabitForm();
        return;
      }
      oldValue = { name: habit.name, icon: habit.icon, color: habit.color };
      habit.name = name;
      habit.icon = $("#habit-icon").value;
      habit.color = $("#habit-color").value;
    } else {
      createdHabit = { id: newId(), name, icon: $("#habit-icon").value, color: $("#habit-color").value, createdAt: new Date().toISOString(), completions: [], earnedDates: [] };
      state.data.habits.push(createdHabit);
    }
    const saved = saveData();
    if (!saved) {
      if (createdHabit) state.data.habits = state.data.habits.filter((item) => item.id !== createdHabit.id);
      else {
        const habit = state.data.habits.find((item) => item.id === state.editingHabitId);
        if (habit && oldValue) Object.assign(habit, oldValue);
      }
      return;
    }
    reconcileXp();
    saveData();
    showToast(createdHabit ? "Đã thêm thói quen." : "Đã cập nhật thói quen; lịch sử hoàn thành vẫn được giữ.");
    resetHabitForm();
    renderAll();
  }

  function toggleHabit(id) {
    const habit = state.data.habits.find((item) => item.id === id);
    if (!habit) {
      showToast("Không tìm thấy thói quen.", true);
      return;
    }
    const today = localDate();
    const index = habit.completions.indexOf(today);
    if (index >= 0) {
      habit.completions.splice(index, 1);
      showToast("Đã bỏ đánh dấu. XP đã trao trước đó không bị cộng lại.");
    } else {
      habit.completions.push(today);
      habit.completions.sort();
      if (!habit.earnedDates.includes(today)) habit.earnedDates.push(today);
      showToast("Đã hoàn thành thói quen hôm nay · +5 XP.");
    }
    reconcileXp();
    saveData();
    renderAll();
  }

  function editHabit(id) {
    const habit = state.data.habits.find((item) => item.id === id);
    if (!habit) return showToast("Không tìm thấy thói quen cần sửa.", true);
    state.editingHabitId = id;
    $("#habit-name").value = habit.name;
    $("#habit-icon").value = habit.icon;
    $("#habit-color").value = habit.color;
    $("#habit-form-title").textContent = "Chỉnh sửa thói quen";
    $("#habit-form-kicker").textContent = "GIỮ NGUYÊN LỊCH SỬ";
    $("#habit-submit").textContent = "Lưu thay đổi";
    $("#habit-cancel-edit").hidden = false;
    $("#habit-name").focus();
  }

  function deleteHabit(id) {
    const habit = state.data.habits.find((item) => item.id === id);
    if (!habit) return showToast("Không tìm thấy thói quen cần xóa.", true);
    openConfirm({
      title: "Xóa thói quen?",
      message: `Xóa "${habit.name}" khỏi danh sách? Lịch sử XP đã ghi nhận sẽ không bị cộng lại.`,
      accept: "Xóa thói quen",
      onAccept: () => {
        const archived = state.data.habits.find((item) => item.id === id);
        state.data.habits = state.data.habits.filter((item) => item.id !== id);
        if (archived) state.data.habitArchive.push(archived);
        const saved = saveData();
        renderAll();
        if (saved) showToast("Đã xóa thói quen. Lịch sử XP được giữ trong kho lưu trữ.");
      }
    });
  }

  function saveSettings(event) {
    event.preventDefault();
    if (!$("#settings-form").reportValidity()) return;
    const dailyGoal = Number($("#daily-goal").value);
    const defaultDuration = Number($("#default-duration").value);
    if (!Number.isInteger(dailyGoal) || dailyGoal < 15 || dailyGoal > 600
      || !Number.isInteger(defaultDuration) || defaultDuration < 1 || defaultDuration > 180) {
      showToast("Mục tiêu phải từ 15 đến 600 phút; phiên mặc định từ 1 đến 180 phút.", true);
      return;
    }
    const previousSettings = { ...state.data.settings };
    state.data.settings.dailyGoalMinutes = dailyGoal;
    state.data.settings.defaultDurationMinutes = defaultDuration;
    if (!Object.hasOwn(state.data.dailyTargets, localDate())) state.data.dailyTargets[localDate()] = dailyGoal;
    if (!saveData()) {
      state.data.settings = previousSettings;
      renderAll();
      return;
    }
    reconcileXp();
    saveData();
    applyDefaultDurationChoice();
    renderAll();
    showToast("Đã lưu cài đặt. Mục tiêu ngày hiện tại đã được chốt từ đầu ngày.");
  }

  function exportData() {
    const exportObject = { ...state.data, exportFormat: "FocusForge", exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(exportObject, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `focusforge-backup-${localDate()}.json`;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showToast("Đã xuất bản sao dữ liệu FocusForge.");
  }

  async function importData(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > 2_000_000) return showToast("Tệp nhập vượt quá giới hạn 2 MB.", true);
    try {
      const parsed = JSON.parse(await file.text());
      if (parsed.exportFormat !== "FocusForge") throw new Error("Tệp không được nhận diện là bản sao FocusForge.");
      delete parsed.exportFormat;
      delete parsed.exportedAt;
      const issue = validateData(parsed);
      if (issue) throw new Error(issue);
      if (!Object.hasOwn(parsed.dailyTargets, localDate())) {
        parsed.dailyTargets[localDate()] = parsed.settings.dailyGoalMinutes;
      }
      openConfirm({
        title: "Thay thế dữ liệu hiện tại?",
        message: `Tệp đã vượt qua kiểm tra cấu trúc. Toàn bộ dữ liệu hiện tại${state.timer ? " và phiên Focus đang chạy" : ""} sẽ được thay bằng nội dung trong bản sao.`,
        accept: "Nhập và thay thế",
        onAccept: () => {
          const previous = state.data;
          const previousReadFailed = state.storageReadFailed;
          state.data = parsed;
          state.storageReadFailed = false;
          if (!saveData()) {
            state.data = previous;
            state.storageReadFailed = previousReadFailed;
            return;
          }
          state.timer = null;
          saveTimer();
          reconcileXp();
          saveData();
          applyDefaultDurationChoice();
          renderAll();
          showToast("Đã nhập dữ liệu FocusForge.");
        }
      });
    } catch (error) {
      showToast(`Không thể nhập dữ liệu: ${error.message}`, true);
    }
  }

  function clearAllData() {
    openConfirm({
      title: "Xóa toàn bộ dữ liệu?",
      message: `Toàn bộ phiên Focus, thói quen, XP, thành tích và cài đặt tùy chỉnh${state.timer ? " cùng phiên Focus đang chạy" : ""} sẽ bị xóa khỏi thiết bị này. Không thể hoàn tác.`,
      accept: "Xóa toàn bộ",
      onAccept: () => {
        try {
          localStorage.removeItem(STORAGE_KEY);
          localStorage.removeItem(TIMER_KEY);
          state.storageReadFailed = false;
          state.data = createDefaultData();
          state.timer = null;
          saveData();
          applyDefaultDurationChoice();
          renderAll();
          showToast("Đã xóa dữ liệu FocusForge.");
        } catch (error) {
          showToast(`Không thể xóa dữ liệu: ${error.message}`, true);
        }
      }
    });
  }

  function bindEvents() {
    $$("[data-page-link]").forEach((link) => link.addEventListener("click", (event) => {
      event.preventDefault();
      navigate(link.dataset.pageLink);
    }));
    $("#menu-toggle").addEventListener("click", () => {
      const open = $("#sidebar").classList.toggle("open");
      $("#menu-toggle").setAttribute("aria-expanded", String(open));
    });
    window.addEventListener("hashchange", () => {
      const requested = location.hash.slice(1);
      navigate(Object.hasOwn(PAGE_NAMES, requested) ? requested : "overview");
    });
    $("#focus-form").addEventListener("submit", startFocus);
    $$('input[name="focus-duration"]').forEach((radio) => radio.addEventListener("change", updateDurationChoice));
    $("#habit-form").addEventListener("submit", submitHabit);
    $("#habit-cancel-edit").addEventListener("click", resetHabitForm);
    $("#habit-list").addEventListener("click", (event) => {
      const target = event.target.closest("[data-habit-toggle], [data-habit-edit], [data-habit-delete]");
      if (!target) return;
      if (target.dataset.habitToggle) toggleHabit(target.dataset.habitToggle);
      else if (target.dataset.habitEdit) editHabit(target.dataset.habitEdit);
      else if (target.dataset.habitDelete) deleteHabit(target.dataset.habitDelete);
    });
    $("#settings-form").addEventListener("submit", saveSettings);
    $("#export-data").addEventListener("click", exportData);
    $("#import-data").addEventListener("change", importData);
    $("#clear-data").addEventListener("click", clearAllData);
    $("#confirm-accept").addEventListener("click", () => closeConfirm(true));
    $("#confirm-cancel").addEventListener("click", () => closeConfirm(false));
    $("#confirm-modal").addEventListener("click", (event) => {
      if (event.target === $("#confirm-modal")) closeConfirm(false);
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !$("#confirm-modal").hidden) closeConfirm(false);
    });
  }

  function init() {
    $("#today-label").textContent = new Intl.DateTimeFormat("vi-VN", { weekday: "short", day: "numeric", month: "short" }).format(new Date());
    loadData();
    state.observedDate = localDate();
    if (clockLooksChanged()) warnClockChange();
    state.data.dateCheckpoint = { date: state.observedDate, observedAt: new Date().toISOString() };
    saveData();
    const monotonicNow = window.performance?.now?.();
    state.clockSample = { wall: Date.now(), monotonic: Number.isFinite(monotonicNow) ? monotonicNow : null };
    applyDefaultDurationChoice();
    const requested = location.hash.slice(1);
    navigate(Object.hasOwn(PAGE_NAMES, requested) ? requested : "overview");
    if (reconcileXp()) saveData();
    bindEvents();
    renderAll();
    if (state.timer?.status === "pending-save") {
      openConfirm({
        title: state.timer.completionType === "completed" ? "Phiên Focus đã hoàn thành" : "Xác nhận phiên Focus",
        message: `Phiên "${state.timer.task}" có ${formatMinutes(state.timer.actualMs)} thời gian tập trung. Lưu phiên vào lịch sử?`,
        accept: "Lưu phiên",
        cancel: "Bỏ phiên",
        onAccept: savePendingSession,
        onCancel: discardPendingSession
      });
    }
    state.tickHandle = window.setInterval(() => {
      const today = localDate();
      if (today !== state.observedDate) {
        if (clockLooksChanged()) warnClockChange();
        state.observedDate = today;
        if (!Object.hasOwn(state.data.dailyTargets, today)) {
          state.data.dailyTargets[today] = state.data.settings.dailyGoalMinutes;
        }
        state.data.dateCheckpoint = { date: today, observedAt: new Date().toISOString() };
        saveData();
        $("#today-label").textContent = new Intl.DateTimeFormat("vi-VN", { weekday: "short", day: "numeric", month: "short" }).format(new Date());
        renderAll();
      }
      const wallNow = Date.now();
      const monotonicCurrent = window.performance?.now?.();
      if (state.clockSample?.monotonic !== null && Number.isFinite(monotonicCurrent)
        && Math.abs((wallNow - state.clockSample.wall) - (monotonicCurrent - state.clockSample.monotonic)) > 120000) warnClockChange();
      state.clockSample = { wall: wallNow, monotonic: Number.isFinite(monotonicCurrent) ? monotonicCurrent : null };
      if (state.timer?.status === "running") {
        if (Date.now() >= state.timer.phaseEndsAt) completeTimer();
        else renderTimer();
      }
    }, 500);
    window.addEventListener("beforeunload", () => {
      if (state.timer) saveTimer();
    });
  }

  document.addEventListener("DOMContentLoaded", init, { once: true });
})();
