"""
Orchestrator tool definitions (Anthropic tool_use schema) and their
backing Python implementations.
"""

import json

# ─────────────────────────────────────────────────────────────────────
# Tool JSON schemas — passed to the Anthropic messages API
# ─────────────────────────────────────────────────────────────────────

ORCHESTRATOR_TOOLS = [
    {
        "name": "ask_clarifying_question",
        "description": (
            "Use this when the user's intent is vague, ambiguous, or missing "
            "critical information needed to build a marketing strategy. Ask ONE "
            "focused question — never a list. Prefer action over clarification."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "question": {
                    "type": "string",
                    "description": "A single, direct clarifying question to ask the user.",
                },
            },
            "required": ["question"],
        },
    },
    {
        "name": "search_market_competitors",
        "description": (
            "Research the competitive landscape for the client's industry and "
            "target location. Returns a list of top competitors with their "
            "estimated strengths and weaknesses. Use this to enrich the client's "
            "context before proposing strategy — embodies the 'Trust but Verify' rule."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "industry": {
                    "type": "string",
                    "description": "The client's industry or market category.",
                },
                "city": {
                    "type": "string",
                    "description": "The client's target city or region.",
                },
                "client_brand": {
                    "type": "string",
                    "description": "The client's brand name, so we can exclude it from results.",
                },
            },
            "required": ["industry", "city"],
        },
    },
    {
        "name": "route_to_narrative_agent",
        "description": (
            "Route the approved marketing strategy to the Narrative Agent for "
            "script and copy generation. ONLY call this after the user has "
            "explicitly approved the strategic direction. Include the full "
            "creative brief so the Narrative Agent can work autonomously."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "campaign_name": {
                    "type": "string",
                    "description": "Short, memorable name for this campaign.",
                },
                "marketing_angle": {
                    "type": "string",
                    "description": "The core persuasion angle or hook the campaign is built around.",
                },
                "target_audience": {
                    "type": "string",
                    "description": "Specific audience segment this campaign targets.",
                },
                "tone": {
                    "type": "string",
                    "description": "Desired voice/tone for the creative output (e.g. bold, aspirational, urgent).",
                },
                "key_messages": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "2-4 key messages or talking points the creative must hit.",
                },
                "deliverables": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "What the Narrative Agent should produce (e.g. 'video script', '3 ad captions').",
                },
            },
            "required": [
                "campaign_name",
                "marketing_angle",
                "target_audience",
                "tone",
                "key_messages",
                "deliverables",
            ],
        },
    },
]


# ─────────────────────────────────────────────────────────────────────
# Tool implementations — execute locally when Claude invokes a tool
# ─────────────────────────────────────────────────────────────────────

def execute_search_market_competitors(
    industry: str,
    city: str,
    client_brand: str = "",
) -> str:
    """
    Dummy competitor research.  In production this calls a real data
    provider (SimilarWeb, SEMrush, Apify scraper, etc.).  Returns a
    JSON string so it can be passed directly as a tool_result content.
    """
    try:
        competitors = [
        {
            "name": f"{city} {industry} Co.",
            "estimated_revenue": "$2.4M/yr",
            "strengths": [
                "Strong local SEO presence",
                "Active TikTok account with 45K followers",
                "Aggressive discount-based acquisition",
            ],
            "weaknesses": [
                "No email nurture funnel",
                "Brand feels generic — no clear differentiator",
                "Website conversion rate likely below 1.5%",
            ],
        },
        {
            "name": f"Prime {industry} Hub",
            "estimated_revenue": "$1.1M/yr",
            "strengths": [
                "Premium positioning with high AOV",
                "Strong Google Ads spend (~$8K/mo estimated)",
                "Professional video content on YouTube",
            ],
            "weaknesses": [
                "Low social engagement despite ad spend",
                "No community or loyalty program visible",
                "Slow website — 4.2s LCP on mobile",
            ],
        },
        {
            "name": f"Elite {industry} {city[:3].upper()}",
            "estimated_revenue": "$800K/yr",
            "strengths": [
                "Niche micro-influencer partnerships",
                "Strong word-of-mouth / review velocity",
                "Clean, mobile-first web experience",
            ],
            "weaknesses": [
                "Very small paid media footprint",
                "No retargeting pixel detected",
                "Content cadence is inconsistent (2-3 posts/month)",
            ],
        },
    ]

        return json.dumps({"competitors": competitors, "market": f"{industry} in {city}"})
    except Exception as e:
        return json.dumps({"error": str(e), "competitors": [], "market": f"{industry} in {city}"})


# Map tool names → handler functions.
# Tools that don't need local execution (ask_clarifying_question,
# route_to_narrative_agent) are handled purely by the orchestrator's
# response parsing — they never hit a Python function.
TOOL_EXECUTORS = {
    "search_market_competitors": execute_search_market_competitors,
}
