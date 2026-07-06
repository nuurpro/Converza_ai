export type AgentId = "milo" | "sleyz" | "vea";

export interface WorkspaceAgent {
  id: AgentId | string;
  name: string;
  role: string;
  roleLabel: string;
  color: string;
  dimColor: string;
  voice: string;
  statusLabel: string;
  metricText: string;
}

export interface DashboardStat {
  value: string;
  label: string;
}

export interface ActivityFeedItem {
  id: string;
  agentId?: AgentId;
  color: string;
  text: string;
  timestamp: string;
}

export interface ChatMetric {
  value: string;
  label: string;
}

export interface AgentChatConfig {
  agentId: AgentId;
  eyebrow: string;
  headline: string;
  accentWord: string;
  description: string;
  placeholder: string;
  suggestions: string[];
  metrics: ChatMetric[];
  cannedReply: string;
}

export type MessageRole = "user" | "assistant" | "human_edit";
export type DraftStatus = "pending" | "approved" | "edited" | "rejected";

export interface HitlCardData {
  id: string;
  label: string;
  content: string;
  status: DraftStatus;
}

export interface SquadMessageData {
  id: string;
  role: MessageRole;
  sender: "Converza" | "Milo" | "Sleyz" | "Vea" | "Owner";
  senderColor: string;
  mark: string;
  timestamp: string;
  text: string;
  hitlCard?: HitlCardData;
}

export interface CompetitorData {
  id: string;
  name: string;
  platform: string;
  lastChecked: string;
  badgeText: string;
  badgeTone: "green" | "amber" | "gray";
}

export interface WorkspaceNavItem {
  id: "dashboard" | "agents" | "squad" | "competitors" | "office" | "settings";
  label: string;
  href: string;
  badge?: string;
  placement: "main" | "footer";
}

export const workspaceTokens = {
  blue: "#0070F3",
  milo: "#D97706",
  miloDim: "rgba(217,119,6,0.1)",
  sleyz: "#16A34A",
  sleyzDim: "rgba(22,163,74,0.1)",
  vea: "#7C3AED",
  veaDim: "rgba(124,58,237,0.1)",
  black: "#000000",
};

const agents: WorkspaceAgent[] = [
  {
    id: "milo",
    name: "Milo",
    role: "Marketing",
    roleLabel: "Marketing",
    color: workspaceTokens.milo,
    dimColor: workspaceTokens.miloDim,
    voice: "Confident, trend-aware, strategic",
    statusLabel: "Active",
    metricText: "Drafted 5 hooks today",
  },
  {
    id: "sleyz",
    name: "Sleyz",
    role: "Sales",
    roleLabel: "Sales",
    color: workspaceTokens.sleyz,
    dimColor: workspaceTokens.sleyzDim,
    voice: "Direct, warm, closer energy",
    statusLabel: "Active",
    metricText: "Closed 1 sale today",
  },
  {
    id: "vea",
    name: "Vea",
    role: "Video",
    roleLabel: "Video",
    color: workspaceTokens.vea,
    dimColor: workspaceTokens.veaDim,
    voice: "Concise, technical, craft-focused",
    statusLabel: "Active",
    metricText: "Rendered 3 videos today",
  },
];

const soonAgents: WorkspaceAgent[] = [
  {
    id: "bao",
    name: "Bao",
    role: "Supply Chain & Purchasing Buyer",
    roleLabel: "Supply chain",
    color: "#111111",
    dimColor: "rgba(0,0,0,0.06)",
    voice: "Practical, vendor-aware, margin-focused",
    statusLabel: "Soon",
    metricText: "Purchasing, supplier follow-ups, inventory timing",
  },
  {
    id: "clara",
    name: "Clara",
    role: "Revenue Recovery & Support Lead",
    roleLabel: "Recovery support",
    color: "#111111",
    dimColor: "rgba(0,0,0,0.06)",
    voice: "Calm, helpful, retention-focused",
    statusLabel: "Soon",
    metricText: "Failed payments, refunds, support recovery",
  },
  {
    id: "arthur",
    name: "Arthur",
    role: "Pricing & Competitor Analyst",
    roleLabel: "Pricing analyst",
    color: "#111111",
    dimColor: "rgba(0,0,0,0.06)",
    voice: "Precise, analytical, market-aware",
    statusLabel: "Soon",
    metricText: "Pricing tests, competitor shifts, margin alerts",
  },
];

const agentChatConfigs: Record<AgentId, AgentChatConfig> = {
  milo: {
    agentId: "milo",
    eyebrow: "Milo · Marketing",
    headline: "What are we shipping",
    accentWord: "today?",
    description: "Trends, hooks, campaign angles, content calendars. Ask anything marketing.",
    placeholder: "Reply to Milo...",
    suggestions: [
      "Analyze our competitors and suggest 3 campaign angles.",
      "Draft a 30-day content calendar for Instagram.",
      "What is trending in skincare right now?",
      "Write a hook for a video ad targeting cold audiences.",
    ],
    metrics: [
      { value: "18", label: "Hooks this week" },
      { value: "4.2%", label: "Avg engagement" },
      { value: "3", label: "Campaigns live" },
    ],
    cannedReply:
      "Give me a moment. I am pulling trend data and brand passport context so the angle lands right.",
  },
  sleyz: {
    agentId: "sleyz",
    eyebrow: "Sleyz · Sales",
    headline: "Who do we close",
    accentWord: "today?",
    description: "Leads, objections, deal status, invoices. Ask anything about your pipeline.",
    placeholder: "Reply to Sleyz...",
    suggestions: [
      "How many leads came in this week?",
      "Who is our hottest lead right now?",
      "Draft a follow-up for a customer who went cold.",
      "Send an invoice to our last closed customer.",
    ],
    metrics: [
      { value: "42", label: "Leads this week" },
      { value: "9", label: "Deals closed" },
      { value: "21%", label: "Close rate" },
    ],
    cannedReply:
      "Checking the pipeline now. I will separate hot leads from curious replies and bring you the qualified numbers.",
  },
  vea: {
    agentId: "vea",
    eyebrow: "Vea · Video",
    headline: "What are we cutting",
    accentWord: "today?",
    description: "Scripts, renders, edits, variants. Hand Vea a hook and get a video back.",
    placeholder: "Reply to Vea...",
    suggestions: [
      "Render a 15-second ad from Milo's latest hook.",
      "Cut 3 variants of our best performing video.",
      "What is the status of my last render?",
      "Add captions to the serum launch video.",
    ],
    metrics: [
      { value: "14", label: "Videos this month" },
      { value: "68s", label: "Avg render time" },
      { value: "2", label: "Awaiting approval" },
    ],
    cannedReply:
      "Understood. I am queuing that render and will report back in Squad chat when the cut is ready.",
  },
};

const dashboardStats: DashboardStat[] = [
  { value: "42", label: "Leads this week" },
  { value: "7", label: "Drafts pending" },
  { value: "3", label: "Videos rendered" },
  { value: "$1,240", label: "Revenue closed this month" },
];

const activityFeed: ActivityFeedItem[] = [
  {
    id: "sale-closed",
    agentId: "sleyz",
    color: workspaceTokens.sleyz,
    text: "Sleyz closed a sale with a warm lead — $89",
    timestamp: "4m ago",
  },
  {
    id: "hooks-drafted",
    agentId: "milo",
    color: workspaceTokens.milo,
    text: "Milo drafted 5 hooks for the winter collection",
    timestamp: "22m ago",
  },
  {
    id: "video-rendered",
    agentId: "vea",
    color: workspaceTokens.vea,
    text: "Vea finished rendering Cold Plunge Serum ad — awaiting approval",
    timestamp: "1h ago",
  },
  {
    id: "leads-qualified",
    agentId: "sleyz",
    color: workspaceTokens.sleyz,
    text: "Sleyz qualified 3 new leads as warm",
    timestamp: "2h ago",
  },
  {
    id: "passport-updated",
    color: workspaceTokens.blue,
    text: "Converza updated the brand passport with new pricing",
    timestamp: "Yesterday",
  },
];

const squadMessages: SquadMessageData[] = [
  {
    id: "msg-1",
    role: "assistant",
    sender: "Converza",
    senderColor: workspaceTokens.black,
    mark: "C",
    timestamp: "9:02 AM",
    text: "@Milo the owner wants a push for the new cold plunge serum. Pull trends and draft hooks.",
  },
  {
    id: "msg-2",
    role: "assistant",
    sender: "Milo",
    senderColor: workspaceTokens.milo,
    mark: "M",
    timestamp: "9:03 AM",
    text: "On it. Cold plunge and skin barrier content is trending up 18% this week. Drafting 5 hooks now.",
  },
  {
    id: "msg-3",
    role: "assistant",
    sender: "Milo",
    senderColor: workspaceTokens.milo,
    mark: "M",
    timestamp: "9:06 AM",
    text: "Done. @Vea best hook is ready. Can you cut a 15s video from it?",
  },
  {
    id: "msg-4",
    role: "assistant",
    sender: "Vea",
    senderColor: workspaceTokens.vea,
    mark: "V",
    timestamp: "9:07 AM",
    text: "Got it. Rendering now. Back in about a minute.",
  },
  {
    id: "msg-5",
    role: "assistant",
    sender: "Vea",
    senderColor: workspaceTokens.vea,
    mark: "V",
    timestamp: "9:08 AM",
    text: "Video is ready. @Converza flagging for owner approval before it goes anywhere.",
    hitlCard: {
      id: "draft-1",
      label: "Review before publishing",
      content:
        "\"Your skin does not need more products. It needs one that actually works below the surface.\" — 15s, cold plunge serum, ready for Instagram + TikTok",
      status: "pending",
    },
  },
];

const competitors: CompetitorData[] = [
  {
    id: "glow-theory",
    name: "Glow Theory",
    platform: "Instagram",
    lastChecked: "2h ago",
    badgeText: "New launch",
    badgeTone: "green",
  },
  {
    id: "bare-skin",
    name: "Bare Skin Co",
    platform: "TikTok",
    lastChecked: "5h ago",
    badgeText: "No change",
    badgeTone: "gray",
  },
  {
    id: "northwell",
    name: "Northwell Beauty",
    platform: "Instagram",
    lastChecked: "1d ago",
    badgeText: "Price drop",
    badgeTone: "amber",
  },
  {
    id: "vernal",
    name: "Vernal Labs",
    platform: "TikTok",
    lastChecked: "1d ago",
    badgeText: "No change",
    badgeTone: "gray",
  },
];

const workspaceNavItems: WorkspaceNavItem[] = [
  { id: "dashboard", label: "Dashboard", href: "/", placement: "main" },
  { id: "agents", label: "Agents", href: "/agents", placement: "main" },
  { id: "squad", label: "Squad chat", href: "/squad", placement: "main" },
  { id: "competitors", label: "Competitors", href: "/competitors", placement: "main" },
  { id: "office", label: "Virtual office", href: "/office", badge: "Soon", placement: "main" },
  { id: "settings", label: "Settings", href: "/settings", placement: "footer" },
];

export function getAgents() {
  return agents;
}

export function getSoonAgents() {
  return soonAgents;
}

export function getAgentById(id: string) {
  return agents.find((agent) => agent.id === id);
}

export function getAgentChatConfig(id: AgentId) {
  return agentChatConfigs[id];
}

export function getDashboardStats() {
  return dashboardStats;
}

export function getActivityFeed() {
  return activityFeed;
}

export function getSquadMessages() {
  return squadMessages;
}

export function getCompetitors() {
  return competitors;
}

export function getWorkspaceNavItems() {
  return workspaceNavItems;
}
