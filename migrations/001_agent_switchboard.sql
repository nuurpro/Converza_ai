CREATE TABLE IF NOT EXISTS agent_runs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  agent_slug    text NOT NULL CHECK (agent_slug IN ('milo','sleyz','vea')),
  triggered_by  text NOT NULL CHECK (triggered_by IN ('owner','agent','system')),
  input_text    text NOT NULL,
  status        text NOT NULL DEFAULT 'running'
                CHECK (status IN ('running','completed','failed','awaiting_hitl')),
  created_at    timestamptz DEFAULT now(),
  completed_at  timestamptz
);

CREATE TABLE IF NOT EXISTS agent_run_steps (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_run_id  uuid NOT NULL REFERENCES agent_runs(id) ON DELETE CASCADE,
  org_id        uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  agent_slug    text NOT NULL,
  step_label    text NOT NULL,
  step_status   text NOT NULL CHECK (step_status IN ('started','completed','failed')),
  detail        text,
  created_at    timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS squad_messages (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  sender_slug     text NOT NULL,
  content         text NOT NULL,
  mentions        text[] DEFAULT '{}',
  related_run_id  uuid REFERENCES agent_runs(id),
  hitl_draft_id   uuid REFERENCES drafts(id),
  created_at      timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS agent_memory (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  agent_slug    text NOT NULL,
  role          text NOT NULL CHECK (role IN ('user','assistant')),
  content       text NOT NULL,
  created_at    timestamptz DEFAULT now()
);

ALTER TABLE drafts
  ADD COLUMN IF NOT EXISTS agent_slug text;

ALTER TABLE drafts
  ALTER COLUMN prospect_id DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_agent_runs_org ON agent_runs(org_id, agent_slug);
CREATE INDEX IF NOT EXISTS idx_agent_run_steps_run ON agent_run_steps(agent_run_id);
CREATE INDEX IF NOT EXISTS idx_squad_messages_org ON squad_messages(org_id, created_at);
CREATE INDEX IF NOT EXISTS idx_agent_memory_scoped ON agent_memory(org_id, agent_slug, created_at);

ALTER TABLE agent_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_run_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE squad_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_memory ENABLE ROW LEVEL SECURITY;
