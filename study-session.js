"use strict";

((root, factory) => {
  const planner = factory();
  if (typeof module === "object" && module.exports) module.exports = planner;
  if (root) root.FocusForgeStudyPlanner = planner;
})(typeof globalThis === "undefined" ? this : globalThis, () => {
  const DEFAULTS = {
    pomodoro: { focusMinutes: 25, shortBreakMinutes: 5, longBreakMinutes: 15, longBreakEvery: 4 },
    "deep-work": { focusMinutes: 50, shortBreakMinutes: 10, longBreakMinutes: 20, longBreakEvery: 2 },
    custom: { focusMinutes: 25, shortBreakMinutes: 5, longBreakMinutes: 15, longBreakEvery: 4 }
  };
  const POMODORO_STYLE_METHODS = ["interleaving", "feynman-technique", "practice-testing"];

  function positiveInteger(value, maximum) {
    return Number.isInteger(value) && value > 0 && value <= maximum;
  }

  function resolveSettings(methodId, customSettings) {
    if (methodId === "pomodoro" || methodId === "deep-work" || methodId === "custom") {
      const defaults = DEFAULTS[methodId];
      const settings = methodId === "custom" ? { ...defaults, ...customSettings } : defaults;
      if (!positiveInteger(settings.focusMinutes, 180)
        || !positiveInteger(settings.shortBreakMinutes, 60)
        || !positiveInteger(settings.longBreakMinutes, 90)
        || !Number.isInteger(settings.longBreakEvery) || settings.longBreakEvery < 2 || settings.longBreakEvery > 8) {
        throw new RangeError("Cấu hình nhịp học không hợp lệ.");
      }
      return settings;
    }
    if (methodId === "active-recall") return { focusMinutes: 20, reviewMinutes: 5, shortBreakMinutes: 5 };
    if (methodId === "spaced-repetition") return { focusMinutes: 15, reviewMinutes: 5, shortBreakMinutes: 5 };
    if (POMODORO_STYLE_METHODS.includes(methodId)) return DEFAULTS.pomodoro;
    throw new RangeError("Phương pháp học chưa được hỗ trợ lập kế hoạch.");
  }

  function createPlan(methodId, totalMinutes, customSettings = {}) {
    if (!positiveInteger(totalMinutes, 600)) {
      throw new RangeError("Thời lượng kế hoạch phải từ 1 đến 600 phút.");
    }
    const settings = resolveSettings(methodId, customSettings);
    const stages = [];
    let remainingMinutes = totalMinutes;
    let focusBlock = 0;
    let reviewRound = 0;

    function addStage(type, minutes, label) {
      if (minutes <= 0) return;
      stages.push({ type, minutes, label });
      remainingMinutes -= minutes;
    }

    if (methodId === "active-recall" || methodId === "spaced-repetition") {
      while (remainingMinutes > 0) {
        focusBlock += 1;
        reviewRound += 1;
        const focusMinutes = Math.min(settings.focusMinutes, remainingMinutes);
        addStage("focus", focusMinutes, methodId === "active-recall"
          ? `Tự kiểm tra ${focusBlock}`
          : `Lượt ôn ${reviewRound} · tự nhớ lại`);
        if (remainingMinutes > 0) {
          addStage("review", Math.min(settings.reviewMinutes, remainingMinutes), "Xem lại và đối chiếu câu trả lời");
        }
        if (remainingMinutes > 0) {
          addStage("short-break", Math.min(settings.shortBreakMinutes, remainingMinutes), "Nghỉ ngắn");
        }
      }
    } else {
      while (remainingMinutes > 0) {
        focusBlock += 1;
        addStage("focus", Math.min(settings.focusMinutes, remainingMinutes), `Tập trung ${focusBlock}`);
        if (remainingMinutes <= 0) break;
        const isLongBreak = focusBlock % settings.longBreakEvery === 0;
        const breakMinutes = isLongBreak ? settings.longBreakMinutes : settings.shortBreakMinutes;
        addStage(isLongBreak ? "long-break" : "short-break",
          Math.min(breakMinutes, remainingMinutes),
          isLongBreak ? "Nghỉ dài" : "Nghỉ ngắn");
      }
    }

    const plannedMinutes = stages.reduce((total, stage) => total + stage.minutes, 0);
    return {
      methodId,
      totalMinutes,
      plannedMinutes,
      focusBlockCount: stages.filter((stage) => stage.type === "focus").length,
      focusMinutes: stages.filter((stage) => stage.type === "focus" || stage.type === "review")
        .reduce((total, stage) => total + stage.minutes, 0),
      breakMinutes: stages.filter((stage) => stage.type === "short-break" || stage.type === "long-break")
        .reduce((total, stage) => total + stage.minutes, 0),
      stages
    };
  }

  return Object.freeze({ createPlan });
});
