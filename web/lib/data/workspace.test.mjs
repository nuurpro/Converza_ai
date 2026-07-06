import test from "node:test";
import assert from "node:assert/strict";

import {
  getAgents,
  getAgentChatConfig,
  getDashboardStats,
  getSquadMessages,
  getCompetitors,
  getWorkspaceNavItems,
  getSoonAgents,
} from "./workspace.ts";

test("workspace mock data exposes the three named agents with locked identity colors", () => {
  const agents = getAgents();

  assert.deepEqual(
    agents.map((agent) => [agent.id, agent.name, agent.color]),
    [
      ["milo", "Milo", "#D97706"],
      ["sleyz", "Sleyz", "#16A34A"],
      ["vea", "Vea", "#7C3AED"],
    ],
  );
});

test("each agent chat has distinct copy and four suggestions", () => {
  const configs = getAgents().map((agent) => getAgentChatConfig(agent.id));

  assert.equal(new Set(configs.map((config) => config.headline)).size, 3);
  for (const config of configs) {
    assert.equal(config.suggestions.length, 4);
    assert.equal(config.metrics.length, 3);
  }
});

test("dashboard, squad, and competitors mock data match the v1 workspace shape", () => {
  assert.deepEqual(
    getDashboardStats().map((stat) => stat.label),
    [
      "Leads this week",
      "Drafts pending",
      "Videos rendered",
      "Revenue closed this month",
    ],
  );
  assert.ok(getSquadMessages().some((message) => message.hitlCard?.status === "pending"));
  assert.equal(getCompetitors().length, 4);
});

test("workspace navigation follows the approved v1 information architecture", () => {
  const items = getWorkspaceNavItems();

  assert.deepEqual(
    items.map((item) => item.label),
    ["Dashboard", "Agents", "Squad chat", "Competitors", "Virtual office", "Settings"],
  );
  assert.equal(items.find((item) => item.id === "office")?.badge, "Soon");
  assert.equal(items.find((item) => item.id === "settings")?.placement, "footer");
  assert.equal(items.some((item) => item.label === "Strategy"), false);
  assert.equal(items.some((item) => item.label === "Co-Pilot chat"), false);
});

test("future agents are exposed as soon teasers, not active chat agents", () => {
  const activeNames = getAgents().map((agent) => agent.name);
  const soonAgents = getSoonAgents();

  assert.deepEqual(activeNames, ["Milo", "Sleyz", "Vea"]);
  assert.deepEqual(
    soonAgents.map((agent) => agent.name),
    ["Bao", "Clara", "Arthur"],
  );
  assert.ok(soonAgents.every((agent) => agent.statusLabel === "Soon"));
});
