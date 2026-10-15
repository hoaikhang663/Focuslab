"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { createPlan } = require("../study-session.js");

function assertPlanWithinBudget(plan, totalMinutes) {
  assert.ok(plan.stages.length > 0);
  assert.ok(plan.stages.every((stage) => Number.isInteger(stage.minutes) && stage.minutes > 0));
  assert.ok(plan.plannedMinutes <= totalMinutes);
  assert.equal(plan.plannedMinutes, plan.stages.reduce((total, stage) => total + stage.minutes, 0));
  assert.equal(plan.focusMinutes + plan.breakMinutes, plan.plannedMinutes);
}

test("Pomodoro uses short and long breaks within a 120-minute plan", () => {
  const plan = createPlan("pomodoro", 120);
  assertPlanWithinBudget(plan, 120);
  assert.equal(plan.plannedMinutes, 120);
  assert.equal(plan.focusBlockCount, 4);
  assert.equal(plan.stages.filter((stage) => stage.type === "short-break").length, 3);
  assert.equal(plan.stages.at(-1).type, "long-break");
  assert.equal(plan.stages.at(-1).minutes, 5);
});

test("Pomodoro 25-minute plan ends without an unnecessary break", () => {
  const plan = createPlan("pomodoro", 25);
  assertPlanWithinBudget(plan, 25);
  assert.deepEqual(plan.stages.map((stage) => [stage.type, stage.minutes]), [["focus", 25]]);
});

test("short plans produce a partial focus block without empty stages", () => {
  const plan = createPlan("pomodoro", 3);
  assertPlanWithinBudget(plan, 3);
  assert.deepEqual(plan.stages.map((stage) => [stage.type, stage.minutes]), [["focus", 3]]);
});

test("Deep Work and Custom plans obey the selected total duration", () => {
  const deepWork = createPlan("deep-work", 60);
  assertPlanWithinBudget(deepWork, 60);
  assert.deepEqual(deepWork.stages.map((stage) => [stage.type, stage.minutes]), [
    ["focus", 50],
    ["short-break", 10]
  ]);

  const custom = createPlan("custom", 75, {
    focusMinutes: 30,
    shortBreakMinutes: 5,
    longBreakMinutes: 15,
    longBreakEvery: 2
  });
  assertPlanWithinBudget(custom, 75);
  assert.deepEqual(custom.stages.map((stage) => [stage.type, stage.minutes]), [
    ["focus", 30],
    ["short-break", 5],
    ["focus", 30],
    ["long-break", 10]
  ]);
});

test("Active Recall and Spaced Repetition preview review steps within this session", () => {
  const activeRecall = createPlan("active-recall", 25);
  assertPlanWithinBudget(activeRecall, 25);
  assert.deepEqual(activeRecall.stages.map((stage) => [stage.type, stage.minutes]), [
    ["focus", 20],
    ["review", 5]
  ]);

  const spacedRepetition = createPlan("spaced-repetition", 22);
  assertPlanWithinBudget(spacedRepetition, 22);
  assert.equal(spacedRepetition.stages.at(-1).type, "short-break");
  assert.equal(spacedRepetition.stages.at(-1).minutes, 2);
});

test("other existing Explore methods receive a usable Pomodoro-style preview", () => {
  for (const methodId of ["interleaving", "feynman-technique", "practice-testing"]) {
    const plan = createPlan(methodId, 45);
    assertPlanWithinBudget(plan, 45);
    assert.equal(plan.methodId, methodId);
    assert.equal(plan.stages[0].minutes, 25);
  }
});

test("invalid durations and custom settings are rejected", () => {
  assert.throws(() => createPlan("pomodoro", 0), RangeError);
  assert.throws(() => createPlan("custom", 30, { focusMinutes: 0 }), RangeError);
  assert.throws(() => createPlan("unknown", 30), RangeError);
});
