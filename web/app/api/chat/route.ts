import { NextRequest } from "next/server";

// ---------------------------------------------------------------------------
// OpenClaw SSE Translation Proxy
// Accepts Converza ChatRequest → calls OpenClaw /v1/chat/completions → emits
// Converza-format SSE events ({token, done, error, approval_request}) back to
// the frontend.
//
// Permission modes:
//   ask    — agent yields APPROVAL_REQUIRED blocks for high-cost actions
//   auto   — agent executes everything without pausing
//   plan   — agent only outlines plans, never executes
//   bypass — agent executes with zero safety checks
// ---------------------------------------------------------------------------

const OPENCLAW_URL =
  process.env.OPENCLAW_URL ?? "http://127.0.0.1:18789";
const OPENCLAW_TOKEN = process.env.OPENCLAW_BEARER_TOKEN ?? "";

type PermissionMode = "ask" | "auto" | "plan" | "bypass";

interface ClientContext {
  brand_name?: string;
  industry?: string;
  target_location?: string;
  hex_colors?: string[];
  target_audience?: string;
  core_offer?: string;
}

interface ApprovalRequest {
  action_id: string;
  action_type: "generate" | "scrape" | "publish" | "api_call" | "other";
  title: string;
  description: string;
  estimated_cost?: string;
  platforms?: string[];
  reversible: boolean;
}

function buildContextBlock(ctx: ClientContext, role: string): string {
  const hexStr =
    ctx.hex_colors && ctx.hex_colors.length > 0
      ? ctx.hex_colors.join(", ")
      : "Not provided";
  return (
    `[CLIENT CONTEXT]\n` +
    `Brand Name: ${ctx.brand_name ?? "Unknown Brand"}\n` +
    `Industry: ${ctx.industry ?? "General Business"}\n` +
    `Target Location: ${ctx.target_location ?? "Not specified"}\n` +
    `Brand Colors (hex): ${hexStr}\n` +
    `Target Audience: ${ctx.target_audience ?? "Not specified"}\n` +
    `Core Offer: ${ctx.core_offer ?? "Not specified"}\n` +
    `User Role: ${role}\n` +
    `[END CLIENT CONTEXT]\n\n`
  );
}

function buildPermissionInstruction(mode: PermissionMode): string {
  switch (mode) {
    case "ask":
      return (
        `[PERMISSION MODE: ASK]\n` +
        `You MUST request explicit user approval before executing any high-cost or irreversible action.\n` +
        `When you are about to execute an action (generate video, scrape data, publish content, call a paid API), ` +
        `you MUST output an approval block in EXACTLY this format:\n\n` +
        `\`\`\`approval_required\n` +
        `{\n` +
        `  "action_id": "<unique_uuid>",\n` +
        `  "action_type": "generate|scrape|publish|api_call|other",\n` +
        `  "title": "Short action title",\n` +
        `  "description": "What you are about to do and why",\n` +
        `  "estimated_cost": "$0.05 per generation",\n` +
        `  "platforms": ["TikTok", "Instagram"],\n` +
        `  "reversible": false\n` +
        `}\n` +
        `\`\`\`\n\n` +
        `After outputting this block, STOP and wait for the user to respond with [APPROVED: <action_id>] or [REJECTED: <action_id>].\n` +
        `Do NOT proceed with the action until approved. Continue the conversation naturally while waiting.\n` +
        `[END PERMISSION MODE]\n\n`
      );

    case "auto":
      return (
        `[PERMISSION MODE: AUTO]\n` +
        `Execute all actions automatically without requesting approval. ` +
        `Inform the user what you are doing as you proceed.\n` +
        `[END PERMISSION MODE]\n\n`
      );

    case "plan":
      return (
        `[PERMISSION MODE: PLAN]\n` +
        `You are in plan-only mode. Do NOT execute any actions. ` +
        `Instead, outline a detailed step-by-step plan of exactly what you WOULD do, ` +
        `including estimated costs, platforms involved, and expected outcomes. ` +
        `Present plans as numbered lists with clear action items.\n` +
        `[END PERMISSION MODE]\n\n`
      );

    case "bypass":
      return (
        `[PERMISSION MODE: BYPASS]\n` +
        `Execute all actions immediately with zero safety checks or pauses. ` +
        `Maximum speed, minimum friction. The user accepts all risks.\n` +
        `[END PERMISSION MODE]\n\n`
      );
  }
}

// ---------------------------------------------------------------------------
// Approval block parser — detects ```approval_required ... ``` in the stream
// ---------------------------------------------------------------------------

const APPROVAL_OPEN = "```approval_required";
const APPROVAL_CLOSE = "```";

function tryParseApprovalBlock(text: string): ApprovalRequest | null {
  const startIdx = text.indexOf(APPROVAL_OPEN);
  if (startIdx === -1) return null;

  const jsonStart = startIdx + APPROVAL_OPEN.length;
  // Find the closing ``` after the opening marker
  const closeIdx = text.indexOf(APPROVAL_CLOSE, jsonStart);
  if (closeIdx === -1) return null;

  const jsonStr = text.slice(jsonStart, closeIdx).trim();
  try {
    const parsed = JSON.parse(jsonStr);
    // Validate required fields
    if (!parsed.action_id || !parsed.title || !parsed.description) return null;
    return {
      action_id: parsed.action_id,
      action_type: parsed.action_type ?? "other",
      title: parsed.title,
      description: parsed.description,
      estimated_cost: parsed.estimated_cost,
      platforms: parsed.platforms,
      reversible: parsed.reversible ?? true,
    };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// SSE helper
// ---------------------------------------------------------------------------

function sseHeaders() {
  return {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  };
}

function ssePayload(encoder: TextEncoder, data: Record<string, unknown>): Uint8Array {
  return encoder.encode(`data: ${JSON.stringify(data)}\n\n`);
}

function errorStream(message: string): Response {
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      controller.enqueue(ssePayload(encoder, { error: message }));
      controller.close();
    },
  });
  return new Response(stream, { headers: sseHeaders() });
}

// ---------------------------------------------------------------------------
// POST /api/chat
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  const body = await request.json();
  const {
    message,
    client_context = {} as ClientContext,
    user_role = "Owner",
    permission_mode = "ask" as PermissionMode,
    conversation_history = [],
  } = body;

  const conversationId = crypto.randomUUID();
  const contextBlock = buildContextBlock(client_context, user_role);
  const permissionBlock = buildPermissionInstruction(permission_mode);

  // Build OpenAI-format messages array
  const messages: { role: string; content: string }[] = [];

  // System-level permission instruction goes first as a system message
  messages.push({
    role: "system",
    content: permissionBlock,
  });

  if (conversation_history.length > 0) {
    const history = [...conversation_history];
    // Inject context into first user message
    const firstContent = history[0]?.content ?? "";
    if (!firstContent.includes("[CLIENT CONTEXT]")) {
      history[0] = { ...history[0], content: contextBlock + firstContent };
    }
    messages.push(...history);
    messages.push({ role: "user", content: message });
  } else {
    messages.push({ role: "user", content: contextBlock + message });
  }

  // Call OpenClaw /v1/chat/completions with streaming
  let upstreamResponse: Response;
  try {
    upstreamResponse = await fetch(
      `${OPENCLAW_URL}/v1/chat/completions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(OPENCLAW_TOKEN
            ? { Authorization: `Bearer ${OPENCLAW_TOKEN}` }
            : {}),
        },
        body: JSON.stringify({
          model: "openclaw",
          messages,
          stream: true,
        }),
      }
    );
  } catch {
    return errorStream(
      `Failed to connect to OpenClaw at ${OPENCLAW_URL}. Is the engine running?`
    );
  }

  if (!upstreamResponse.ok) {
    const errText = await upstreamResponse.text().catch(() => "Unknown error");
    return errorStream(
      `OpenClaw returned ${upstreamResponse.status}: ${errText.slice(0, 200)}`
    );
  }

  // Transform OpenAI SSE → Converza SSE with approval block detection
  const encoder = new TextEncoder();
  const transformStream = new ReadableStream({
    async start(controller) {
      const reader = upstreamResponse.body?.getReader();
      if (!reader) {
        controller.enqueue(ssePayload(encoder, { error: "No response body from OpenClaw" }));
        controller.close();
        return;
      }

      const decoder = new TextDecoder();
      let buffer = "";
      let fullContent = "";
      // Track if we're inside an approval block to suppress token emission
      let insideApprovalBlock = false;
      let approvalBuffer = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const raw = line.slice(6).trim();
            if (!raw || raw === "[DONE]") continue;

            try {
              const chunk = JSON.parse(raw);
              const content = chunk.choices?.[0]?.delta?.content;
              if (!content) continue;

              fullContent += content;

              // ── Approval block state machine ──
              // Check if we've entered an approval block
              if (!insideApprovalBlock && fullContent.includes(APPROVAL_OPEN)) {
                insideApprovalBlock = true;
                // Extract everything from the approval marker onward
                const markerIdx = fullContent.lastIndexOf(APPROVAL_OPEN);
                approvalBuffer = fullContent.slice(markerIdx);
              }

              if (insideApprovalBlock) {
                approvalBuffer += "";  // fullContent already accumulated
                approvalBuffer = fullContent.slice(
                  fullContent.lastIndexOf(APPROVAL_OPEN)
                );

                // Check if the block is complete
                const afterOpen = approvalBuffer.slice(APPROVAL_OPEN.length);
                const closeIdx = afterOpen.indexOf(APPROVAL_CLOSE);

                if (closeIdx !== -1) {
                  // Block complete — try to parse
                  const fullBlock =
                    approvalBuffer.slice(0, APPROVAL_OPEN.length + closeIdx + APPROVAL_CLOSE.length);
                  const approval = tryParseApprovalBlock(fullBlock);

                  if (approval) {
                    // Emit approval_request event instead of tokens
                    controller.enqueue(
                      ssePayload(encoder, {
                        approval_request: approval,
                        conversation_id: conversationId,
                      })
                    );
                  }

                  insideApprovalBlock = false;
                  approvalBuffer = "";
                }
                // While inside the block, don't emit tokens
                continue;
              }

              // Normal token emission
              controller.enqueue(
                ssePayload(encoder, {
                  token: content,
                  conversation_id: conversationId,
                })
              );
            } catch {
              // Malformed chunk — skip
            }
          }
        }

        // Stream complete
        controller.enqueue(
          ssePayload(encoder, { done: true, conversation_id: conversationId })
        );
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : "Stream error";
        controller.enqueue(ssePayload(encoder, { error: errMsg }));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(transformStream, { headers: sseHeaders() });
}
