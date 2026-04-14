"""
DAG Runner — Topological executor for the Converza agent pipeline.

Takes a compiled DAG plan from the Manager Agent and executes nodes
in dependency order, running independent nodes in parallel.

Each agent node is fully isolated: it receives a JSON payload and
returns a JSON payload. No shared context window.
"""

import asyncio
import logging
from datetime import datetime, timezone
from typing import Any, Callable, Awaitable

from db import get_supabase
from agents.content_creator import run_content_creator

logger = logging.getLogger("converza.dag_runner")

# ─────────────────────────────────────────────────────────────────────
# Agent registry — maps agent_type to executor function
# ─────────────────────────────────────────────────────────────────────

AgentFn = Callable[[dict[str, Any]], Awaitable[dict[str, Any]]]


async def _stub_agent(payload: dict[str, Any]) -> dict[str, Any]:
    """
    Placeholder executor for agents not yet implemented.
    Returns the brief as-is so downstream nodes can reference it.
    """
    agent_type = payload.get("_agent_type", "Unknown")
    logger.info(f"[STUB] {agent_type} — returning brief as output (not yet implemented)")
    return {
        "status": "stub",
        "agent_type": agent_type,
        "output": payload.get("brief", payload),
        "message": f"{agent_type} is not yet implemented. Brief passed through.",
    }


async def _run_intelligence(payload: dict[str, Any]) -> dict[str, Any]:
    """Intelligence_Agent stub — competitor research, trend signals."""
    payload["_agent_type"] = "Intelligence_Agent"
    return await _stub_agent(payload)


async def _run_product_manager(payload: dict[str, Any]) -> dict[str, Any]:
    """ProductManager_Agent stub — campaign brief, angle, channels."""
    payload["_agent_type"] = "ProductManager_Agent"
    return await _stub_agent(payload)


async def _run_copywriter(payload: dict[str, Any]) -> dict[str, Any]:
    """Copywriter_Agent stub — scripts, hooks, captions."""
    payload["_agent_type"] = "Copywriter_Agent"
    return await _stub_agent(payload)


async def _run_ugc_creator(payload: dict[str, Any]) -> dict[str, Any]:
    """UGC_Creator_Agent stub — UGC scripts, casting briefs."""
    payload["_agent_type"] = "UGC_Creator_Agent"
    return await _stub_agent(payload)


# ContentCreator_Agent is LIVE — not a stub
async def _run_content_creator(payload: dict[str, Any]) -> dict[str, Any]:
    """ContentCreator_Agent — full 3-step pipeline (Nano Banana → Vision → Animate)."""
    return await run_content_creator(payload)


AGENT_REGISTRY: dict[str, AgentFn] = {
    "Intelligence_Agent": _run_intelligence,
    "ProductManager_Agent": _run_product_manager,
    "Copywriter_Agent": _run_copywriter,
    "ContentCreator_Agent": _run_content_creator,
    "UGC_Creator_Agent": _run_ugc_creator,
}


# ─────────────────────────────────────────────────────────────────────
# Topological sort
# ─────────────────────────────────────────────────────────────────────

def _topo_layers(nodes: list[dict]) -> list[list[dict]]:
    """
    Group DAG nodes into execution layers by dependency order.
    Nodes in the same layer have all dependencies satisfied and run in parallel.

    Returns: [[layer0_nodes], [layer1_nodes], ...]
    """
    node_map = {n["node_id"]: n for n in nodes}
    completed: set[str] = set()
    layers: list[list[dict]] = []

    remaining = set(node_map.keys())

    while remaining:
        # Find all nodes whose dependencies are fully satisfied
        ready = []
        for nid in remaining:
            deps = set(node_map[nid].get("depends_on", []))
            if deps.issubset(completed):
                ready.append(node_map[nid])

        if not ready:
            # Circular dependency or missing node — force-run remaining
            logger.error(f"[DAG] Unresolvable dependencies: {remaining}")
            ready = [node_map[nid] for nid in remaining]
            remaining.clear()

        for node in ready:
            remaining.discard(node["node_id"])
            completed.add(node["node_id"])

        layers.append(ready)

    return layers


# ─────────────────────────────────────────────────────────────────────
# Single node executor
# ─────────────────────────────────────────────────────────────────────

async def _execute_node(
    node: dict,
    brand_passport: dict,
    upstream_outputs: dict[str, Any],
    run_id: str,
) -> tuple[str, dict[str, Any]]:
    """
    Execute a single DAG node. Returns (node_id, output).

    Merges upstream outputs into the node's brief before execution.
    """
    node_id = node["node_id"]
    agent_type = node["agent_type"]
    brief = dict(node.get("brief", {}))

    # Inject Brand Passport
    brief["brand_passport"] = brand_passport

    # Inject upstream outputs so the agent can reference them
    for dep_id in node.get("depends_on", []):
        if dep_id in upstream_outputs:
            brief[f"upstream_{dep_id}"] = upstream_outputs[dep_id]

    # Get executor
    executor = AGENT_REGISTRY.get(agent_type)
    if not executor:
        logger.error(f"[DAG] Unknown agent: {agent_type}")
        return node_id, {"status": "failed", "error": f"Unknown agent: {agent_type}"}

    # Update Supabase node status → running
    try:
        sb = get_supabase()
        sb.table("dag_node_runs").update({
            "status": "running",
            "started_at": datetime.now(timezone.utc).isoformat(),
        }).eq("run_id", run_id).eq("node_id", node_id).execute()
    except Exception as e:
        logger.warning(f"[DAG] Failed to update node status: {e}")

    # Execute
    try:
        logger.info(f"[DAG] Executing {agent_type} ({node_id})")
        output = await executor(brief)
        status = "complete" if output.get("status") != "failed" else "failed"
    except Exception as e:
        logger.error(f"[DAG] {agent_type} ({node_id}) crashed: {e}")
        output = {"status": "failed", "error": str(e)}
        status = "failed"

    # Update Supabase node status → complete/failed
    try:
        sb = get_supabase()
        sb.table("dag_node_runs").update({
            "status": status,
            "output_payload": output,
            "completed_at": datetime.now(timezone.utc).isoformat(),
        }).eq("run_id", run_id).eq("node_id", node_id).execute()
    except Exception as e:
        logger.warning(f"[DAG] Failed to update node result: {e}")

    return node_id, output


# ─────────────────────────────────────────────────────────────────────
# Full DAG execution
# ─────────────────────────────────────────────────────────────────────

async def execute_dag(
    dag_plan: dict[str, Any],
    brand_passport: dict,
    run_id: str,
) -> dict[str, Any]:
    """
    Execute a full DAG plan produced by the Manager Agent.

    Args:
        dag_plan: { "strategic_thesis": "...", "campaign_name": "...",
                     "target_platforms": [...], "nodes": [...] }
        brand_passport: Full Brand Passport dict from Supabase
        run_id: UUID of the dag_runs row

    Returns:
        { "status": "complete"|"partial"|"failed",
          "results": { "node_id": output, ... },
          "campaign_name": "...",
          "strategic_thesis": "..." }
    """
    nodes = dag_plan.get("nodes", [])
    if not nodes:
        return {"status": "failed", "error": "Empty DAG plan", "results": {}}

    layers = _topo_layers(nodes)
    upstream_outputs: dict[str, Any] = {}
    all_results: dict[str, Any] = {}
    has_failure = False

    logger.info(
        f"[DAG] Executing plan: \"{dag_plan.get('campaign_name', '?')}\" "
        f"— {len(nodes)} nodes in {len(layers)} layers"
    )

    for layer_idx, layer in enumerate(layers):
        logger.info(
            f"[DAG] Layer {layer_idx}: "
            f"{[n['node_id'] + ' (' + n['agent_type'] + ')' for n in layer]}"
        )

        # Execute all nodes in this layer in parallel
        tasks = [
            _execute_node(node, brand_passport, upstream_outputs, run_id)
            for node in layer
        ]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        for res in results:
            if isinstance(res, Exception):
                logger.error(f"[DAG] Layer {layer_idx} exception: {res}")
                has_failure = True
                continue

            node_id, output = res
            upstream_outputs[node_id] = output
            all_results[node_id] = output

            if output.get("status") == "failed":
                has_failure = True

    # Update dag_runs with final status
    final_status = "complete" if not has_failure else "partial"
    try:
        sb = get_supabase()
        sb.table("dag_runs").update({
            "status": final_status,
            "stage": "done",
            "final_output": all_results,
            "completed_at": datetime.now(timezone.utc).isoformat(),
        }).eq("id", run_id).execute()
    except Exception as e:
        logger.warning(f"[DAG] Failed to update run status: {e}")

    logger.info(f"[DAG] Pipeline {final_status}: {len(all_results)} nodes executed")

    return {
        "status": final_status,
        "campaign_name": dag_plan.get("campaign_name", ""),
        "strategic_thesis": dag_plan.get("strategic_thesis", ""),
        "results": all_results,
    }
