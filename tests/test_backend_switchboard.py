import unittest
from unittest.mock import AsyncMock, patch


class MentionParserTests(unittest.TestCase):
    def test_extract_mentions_returns_unique_agent_slugs_and_ignores_owner(self):
        from lib.mentions import extract_mentions

        text = "Ask @Milo to brief @Vea, then tell @owner. @milo already knows."

        self.assertEqual(extract_mentions(text), ["milo", "vea"])


class SwitchboardTests(unittest.IsolatedAsyncioTestCase):
    async def test_context_assembler_uses_brand_identity_and_agent_scoped_memory(self):
        from lib.context_assembler import assemble_context
        from lib.repository import InMemoryRepository

        repo = InMemoryRepository()
        repo.seed_brand_passport("org-1", {"brand_name": "Osman Skincare"})
        await repo.insert_agent_memory("org-1", "milo", "user", "Milo memory")
        await repo.insert_agent_memory("org-1", "vea", "user", "Vea memory")

        context = await assemble_context("org-1", "milo", repo=repo)

        self.assertEqual(context["brand_passport"]["brand_name"], "Osman Skincare")
        self.assertIn("ROLE:", context["identity"])
        self.assertEqual([row["content"] for row in context["memory"]], ["Milo memory"])

    async def test_narrate_step_writes_started_and_completed_rows_plus_squad_messages(self):
        from lib.narration import narrate_step
        from lib.repository import InMemoryRepository

        repo = InMemoryRepository()
        run_id = await repo.create_agent_run("org-1", "milo", "owner", "Research")

        async with narrate_step(
            repo=repo,
            org_id="org-1",
            agent_slug="milo",
            run_id=run_id,
            step_label="Researching market trends",
            completed_detail="cold plunge content is trending +18%",
        ):
            pass

        self.assertEqual(
            [step["step_status"] for step in repo.agent_run_steps],
            ["started", "completed"],
        )
        self.assertEqual(len(repo.squad_messages), 2)
        self.assertIn("Starting market trends", repo.squad_messages[0]["content"])
        self.assertIn("Finished market trends", repo.squad_messages[1]["content"])

    async def test_owner_squad_message_routes_to_milo_then_delegates_to_vea_and_creates_hitl_draft(self):
        from lib.repository import InMemoryRepository
        from lib.switchboard import handle_squad_owner_message

        repo = InMemoryRepository()
        repo.seed_brand_passport("org-1", {"brand_name": "Osman Skincare"})

        with (
            patch(
                "lib.switchboard.call_engine",
                AsyncMock(
                    side_effect=[
                        "Five strong hooks are ready. @Vea render the best one into a 15s video.",
                        "This serum keeps skin calm after cold weather in one simple daily step.",
                    ]
                ),
            ),
            patch(
                "lib.switchboard.call_moneyprinterturbo",
                AsyncMock(
                    return_value={
                        "task_id": "task-1",
                        "video_url": "http://127.0.0.1:8080/tasks/task-1/final-1.mp4",
                        "output_path": "http://127.0.0.1:8080/tasks/task-1/final-1.mp4",
                    }
                ),
            ),
        ):
            await handle_squad_owner_message(
                org_id="org-1",
                text="Push our new serum, get a video ready",
                repo=repo,
            )

        self.assertEqual(repo.squad_messages[0]["sender_slug"], "owner")
        self.assertEqual(
            [run["agent_slug"] for run in repo.agent_runs],
            ["milo", "vea"],
        )
        self.assertEqual(repo.drafts[0]["agent_slug"], "vea")
        self.assertIsNone(repo.drafts[0]["prospect_id"])
        self.assertEqual(repo.drafts[0]["status"], "pending")
        self.assertEqual(repo.squad_messages[-1]["hitl_draft_id"], repo.drafts[0]["id"])


if __name__ == "__main__":
    unittest.main()
