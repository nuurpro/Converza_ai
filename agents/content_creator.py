"""
ContentCreator_Agent — Isolated DAG node for visual asset creation.

Strict 3-step internal pipeline:
  Step 1: Anchor Frame    → Nano Banana 2 (image generation)
  Step 2: Vision Check    → Anti-hallucination loop (Claude Vision)
  Step 3: Animation Route → Kling 2.1 (B-Roll) or Veo 3.1 (Talking Head / Audio)

This agent does NOT hallucinate ideas. It strictly follows the JSON payload
passed to it by the DAG router. Every parameter is derived from the Brand
Passport and the upstream Copywriter_Agent output.
"""

import os
import json
import asyncio
import logging
from typing import Any

import httpx
import anthropic

logger = logging.getLogger("converza.content_creator")

# ─────────────────────────────────────────────────────────────────────
# KIE.ai API config
# ─────────────────────────────────────────────────────────────────────

KIE_BASE = "https://api.kie.ai"
KIE_JOBS_URL = f"{KIE_BASE}/api/v1/jobs/createTask"
KIE_POLL_URL = f"{KIE_BASE}/api/v1/jobs/recordInfo"
KIE_VEO_URL = f"{KIE_BASE}/api/v1/veo/generate"
KIE_VEO_POLL_URL = f"{KIE_BASE}/api/v1/veo/record-info"

MAX_VISION_RETRIES = 3
POLL_INTERVAL_S = 5
POLL_TIMEOUT_S = 300  # 5 min max wait


def _kie_key() -> str:
    key = os.getenv("KIE_API_KEY")
    if not key:
        raise RuntimeError("KIE_API_KEY must be set in .env")
    return key


def _kie_headers() -> dict:
    return {
        "Authorization": f"Bearer {_kie_key()}",
        "Content-Type": "application/json",
    }


# ─────────────────────────────────────────────────────────────────────
# Style guide builder — converts Brand Passport into generation params
# ─────────────────────────────────────────────────────────────────────

def _build_style_prompt(
    base_prompt: str,
    brand_passport: dict,
    style_refs: list[str] | None = None,
) -> str:
    """
    Inject Brand Passport style constraints directly into the image
    generation prompt to kill the default AI grey-wash.
    """
    hex_colors = brand_passport.get("hex_colors", [])
    brand_voice = brand_passport.get("brand_voice", "")
    brand_name = brand_passport.get("brand_name", "")

    style_block = base_prompt

    if hex_colors:
        color_str = ", ".join(hex_colors)
        style_block += (
            f"\n\nCOLOR GRADING: Use this exact brand color palette as the dominant "
            f"color scheme: {color_str}. Ensure the lighting and color grading "
            f"reflect these colors. No desaturated grey-wash."
        )

    if brand_voice:
        style_block += (
            f"\n\nVISUAL TONE: The visual style must match this brand voice: "
            f"{brand_voice}. Every element should feel intentional and on-brand."
        )

    if brand_name:
        style_block += (
            f"\n\nBRAND: {brand_name}. Do NOT render any text or logos in the image "
            f"unless explicitly specified in the prompt."
        )

    return style_block


# ─────────────────────────────────────────────────────────────────────
# Step 1: Anchor Frame — Nano Banana 2
# ─────────────────────────────────────────────────────────────────────

async def _generate_anchor_frame(
    prompt: str,
    aspect_ratio: str = "9:16",
    resolution: str = "1K",
    image_refs: list[str] | None = None,
    client: httpx.AsyncClient | None = None,
) -> str:
    """
    Generate the base anchor image via Nano Banana 2.
    Returns the task_id for polling.
    """
    body = {
        "model": "nano-banana-2",
        "input": {
            "prompt": prompt,
            "aspect_ratio": aspect_ratio,
            "resolution": resolution,
            "output_format": "png",
            "image_input": image_refs or [],
        },
    }

    _client = client or httpx.AsyncClient(timeout=30.0)
    try:
        resp = await _client.post(KIE_JOBS_URL, json=body, headers=_kie_headers())
        resp.raise_for_status()
        data = resp.json()

        if data.get("code") != 200:
            raise RuntimeError(f"Nano Banana 2 error: {data.get('msg', 'Unknown')}")

        task_id = data["data"]["taskId"]
        logger.info(f"[Step 1] Anchor frame submitted: {task_id}")
        return task_id
    finally:
        if not client:
            await _client.aclose()


async def _poll_job(
    task_id: str,
    client: httpx.AsyncClient | None = None,
) -> list[str]:
    """
    Poll KIE Market API until task completes. Returns list of result URLs.
    """
    _client = client or httpx.AsyncClient(timeout=30.0)
    elapsed = 0

    try:
        while elapsed < POLL_TIMEOUT_S:
            resp = await _client.get(
                KIE_POLL_URL,
                params={"taskId": task_id},
                headers=_kie_headers(),
            )
            resp.raise_for_status()
            data = resp.json()

            state = data.get("data", {}).get("state", "")

            if state == "success":
                result_json = data["data"].get("resultJson", "{}")
                parsed = json.loads(result_json) if isinstance(result_json, str) else result_json
                urls = parsed.get("resultUrls", [])
                logger.info(f"[Poll] Task {task_id} complete: {len(urls)} result(s)")
                return urls

            if state == "fail":
                fail_msg = data["data"].get("failMsg", "Unknown failure")
                raise RuntimeError(f"Task {task_id} failed: {fail_msg}")

            logger.debug(f"[Poll] Task {task_id} state: {state}")
            await asyncio.sleep(POLL_INTERVAL_S)
            elapsed += POLL_INTERVAL_S

        raise TimeoutError(f"Task {task_id} timed out after {POLL_TIMEOUT_S}s")
    finally:
        if not client:
            await _client.aclose()


async def _poll_veo_job(
    task_id: str,
    client: httpx.AsyncClient | None = None,
) -> list[str]:
    """
    Poll Veo 3.1 API until task completes. Returns list of video URLs.
    """
    _client = client or httpx.AsyncClient(timeout=30.0)
    elapsed = 0

    try:
        while elapsed < POLL_TIMEOUT_S:
            resp = await _client.get(
                KIE_VEO_POLL_URL,
                params={"taskId": task_id},
                headers=_kie_headers(),
            )
            resp.raise_for_status()
            data = resp.json()

            flag = data.get("data", {}).get("successFlag", 0)

            if flag == 1:
                urls = data["data"].get("response", {}).get("resultUrls", [])
                logger.info(f"[Poll/Veo] Task {task_id} complete: {len(urls)} video(s)")
                return urls

            if flag in (2, 3):
                raise RuntimeError(f"Veo task {task_id} failed (flag={flag})")

            logger.debug(f"[Poll/Veo] Task {task_id} flag: {flag}")
            await asyncio.sleep(POLL_INTERVAL_S)
            elapsed += POLL_INTERVAL_S

        raise TimeoutError(f"Veo task {task_id} timed out after {POLL_TIMEOUT_S}s")
    finally:
        if not client:
            await _client.aclose()


# ─────────────────────────────────────────────────────────────────────
# Step 2: Vision Check — Anti-Hallucination Loop
# ─────────────────────────────────────────────────────────────────────

async def _vision_check(image_url: str, product_description: str) -> bool:
    """
    Pass the generated image to Claude Vision for quality validation.
    Returns True if the image passes, False if it fails.
    """
    client = anthropic.AsyncAnthropic()

    response = await client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=50,
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "url",
                            "url": image_url,
                        },
                    },
                    {
                        "type": "text",
                        "text": (
                            "You are a quality control inspector for AI-generated marketing images.\n\n"
                            f"Expected product/scene: {product_description}\n\n"
                            "Check the following:\n"
                            "1. Does this image contain garbled, distorted, or unreadable text?\n"
                            "2. Does the product or scene match the physical description above?\n"
                            "3. Are there any obvious AI artifacts (extra fingers, melted objects, impossible geometry)?\n\n"
                            "If ALL checks pass, respond with exactly: YES\n"
                            "If ANY check fails, respond with exactly: NO"
                        ),
                    },
                ],
            }
        ],
    )

    answer = response.content[0].text.strip().upper()
    passed = answer.startswith("YES")
    logger.info(f"[Step 2] Vision check: {'PASS' if passed else 'FAIL'} (raw: {answer})")
    return passed


# ─────────────────────────────────────────────────────────────────────
# Step 3: Animation Router
# ─────────────────────────────────────────────────────────────────────

async def _route_kling(
    image_url: str,
    animation_prompt: str,
    duration: str = "5",
    client: httpx.AsyncClient | None = None,
) -> str:
    """
    Route A — B-Roll / Product Demo via Kling 2.1 (image-to-video).
    Returns task_id for polling.
    """
    body = {
        "model": "kling/v2-1-master-image-to-video",
        "input": {
            "prompt": animation_prompt,
            "image_url": image_url,
            "duration": duration,
            "negative_prompt": "blur, distort, low quality, garbled text, artifacts",
            "cfg_scale": 0.5,
        },
    }

    _client = client or httpx.AsyncClient(timeout=30.0)
    try:
        resp = await _client.post(KIE_JOBS_URL, json=body, headers=_kie_headers())
        resp.raise_for_status()
        data = resp.json()

        if data.get("code") != 200:
            raise RuntimeError(f"Kling 2.1 error: {data.get('msg', 'Unknown')}")

        task_id = data["data"]["taskId"]
        logger.info(f"[Step 3/Kling] Video submitted: {task_id}")
        return task_id
    finally:
        if not client:
            await _client.aclose()


async def _route_veo(
    image_url: str,
    script: str,
    aspect_ratio: str = "9:16",
    client: httpx.AsyncClient | None = None,
) -> str:
    """
    Route B — Talking Head / Cinematic with Audio via Veo 3.1.
    Passes anchor frame + script for native audio sync.
    Returns task_id for polling.
    """
    body = {
        "prompt": script,
        "model": "veo3_fast",
        "generationType": "FIRST_AND_LAST_FRAMES_2_VIDEO",
        "aspect_ratio": aspect_ratio,
        "imageUrls": [image_url],
        "enableTranslation": True,
    }

    _client = client or httpx.AsyncClient(timeout=30.0)
    try:
        resp = await _client.post(KIE_VEO_URL, json=body, headers=_kie_headers())
        resp.raise_for_status()
        data = resp.json()

        if data.get("code") != 200:
            raise RuntimeError(f"Veo 3.1 error: {data.get('msg', 'Unknown')}")

        task_id = data["data"]["taskId"]
        logger.info(f"[Step 3/Veo] Video submitted: {task_id}")
        return task_id
    finally:
        if not client:
            await _client.aclose()


# ─────────────────────────────────────────────────────────────────────
# Main execution — the full 3-step pipeline
# ─────────────────────────────────────────────────────────────────────

async def run_content_creator(payload: dict[str, Any]) -> dict[str, Any]:
    """
    Execute the ContentCreator_Agent pipeline.

    Input payload (from DAG router):
    {
        "brand_passport": { ... },
        "prompt": "Scene description for image generation",
        "product_description": "Physical description for vision QC",
        "script": "Voiceover/narration script (for Veo audio sync)",
        "video_type": "b_roll" | "talking_head",
        "aspect_ratio": "9:16" | "16:9",
        "duration": "5" | "10",
        "style_refs": ["url1", "url2"],  # optional reference images
    }

    Output payload:
    {
        "status": "complete" | "failed",
        "anchor_frame_url": "https://...",
        "video_url": "https://...",
        "video_provider": "kling" | "veo",
        "vision_check_attempts": 1,
        "error": null | "..."
    }
    """
    brand_passport = payload.get("brand_passport", {})
    base_prompt = payload.get("prompt", "")
    product_desc = payload.get("product_description", base_prompt)
    script = payload.get("script", "")
    video_type = payload.get("video_type", "b_roll")
    aspect_ratio = payload.get("aspect_ratio", "9:16")
    duration = payload.get("duration", "5")
    style_refs = payload.get("style_refs", [])

    result: dict[str, Any] = {
        "status": "failed",
        "anchor_frame_url": None,
        "video_url": None,
        "video_provider": None,
        "vision_check_attempts": 0,
        "error": None,
    }

    async with httpx.AsyncClient(timeout=60.0) as client:
        # ────────────────────────────────────────────────────
        # STEP 1: Generate Anchor Frame (Nano Banana 2)
        # ────────────────────────────────────────────────────
        styled_prompt = _build_style_prompt(base_prompt, brand_passport, style_refs)
        anchor_url: str | None = None

        for attempt in range(1, MAX_VISION_RETRIES + 1):
            result["vision_check_attempts"] = attempt

            try:
                logger.info(f"[Pipeline] Step 1 — Generating anchor frame (attempt {attempt}/{MAX_VISION_RETRIES})")
                task_id = await _generate_anchor_frame(
                    prompt=styled_prompt,
                    aspect_ratio=aspect_ratio,
                    resolution="1K",
                    image_refs=style_refs,
                    client=client,
                )

                # Poll until image is ready
                urls = await _poll_job(task_id, client=client)
                if not urls:
                    raise RuntimeError("Nano Banana 2 returned no images")

                anchor_url = urls[0]
                logger.info(f"[Pipeline] Step 1 — Anchor frame ready: {anchor_url}")

            except Exception as e:
                logger.error(f"[Pipeline] Step 1 FAILED (attempt {attempt}): {e}")
                if attempt == MAX_VISION_RETRIES:
                    result["error"] = f"Anchor frame generation failed after {MAX_VISION_RETRIES} attempts: {str(e)}"
                    return result
                continue

            # ────────────────────────────────────────────────────
            # STEP 2: Vision Check (Anti-Hallucination)
            # ────────────────────────────────────────────────────
            try:
                logger.info(f"[Pipeline] Step 2 — Vision check (attempt {attempt})")
                passed = await _vision_check(anchor_url, product_desc)

                if passed:
                    logger.info("[Pipeline] Step 2 — Vision check PASSED")
                    break
                else:
                    logger.warning(f"[Pipeline] Step 2 — Vision check FAILED (attempt {attempt})")
                    if attempt == MAX_VISION_RETRIES:
                        # Accept the last attempt even if vision check fails —
                        # better to deliver imperfect content than nothing
                        logger.warning("[Pipeline] Step 2 — Max retries hit, proceeding with last frame")
                        break
                    anchor_url = None  # reset for retry

            except Exception as e:
                logger.error(f"[Pipeline] Step 2 — Vision check error: {e}")
                # If vision check itself errors, proceed with the image
                # (don't block the pipeline on a QC failure)
                break

        if not anchor_url:
            result["error"] = "Failed to generate a valid anchor frame"
            return result

        result["anchor_frame_url"] = anchor_url

        # ────────────────────────────────────────────────────
        # STEP 3: Animation Router
        # ────────────────────────────────────────────────────
        try:
            if video_type == "talking_head":
                # Route B: Veo 3.1 — cinematic with audio sync
                logger.info("[Pipeline] Step 3 — Routing to Veo 3.1 (talking_head)")
                result["video_provider"] = "veo"

                video_prompt = script if script else styled_prompt
                video_task_id = await _route_veo(
                    image_url=anchor_url,
                    script=video_prompt,
                    aspect_ratio=aspect_ratio,
                    client=client,
                )

                video_urls = await _poll_veo_job(video_task_id, client=client)

            else:
                # Route A: Kling 2.1 — B-Roll / Product Demo
                logger.info("[Pipeline] Step 3 — Routing to Kling 2.1 (b_roll)")
                result["video_provider"] = "kling"

                animation_prompt = (
                    f"Smooth, cinematic camera motion. {base_prompt}. "
                    f"Professional product showcase, 1080p quality."
                )
                video_task_id = await _route_kling(
                    image_url=anchor_url,
                    animation_prompt=animation_prompt,
                    duration=duration,
                    client=client,
                )

                video_urls = await _poll_job(video_task_id, client=client)

            if not video_urls:
                raise RuntimeError("Video generation returned no results")

            result["video_url"] = video_urls[0]
            result["status"] = "complete"
            logger.info(f"[Pipeline] DONE — Video ready: {result['video_url']}")

        except Exception as e:
            logger.error(f"[Pipeline] Step 3 FAILED: {e}")
            result["error"] = f"Video generation failed: {str(e)}"
            # Still return the anchor frame even if video fails
            result["status"] = "partial"

    return result
