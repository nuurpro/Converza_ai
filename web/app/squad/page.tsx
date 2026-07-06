"use client";

import { useEffect, useState } from "react";
import {
  ChatInputBar,
  SquadMessage,
  WorkspaceHeader,
} from "@/components/workspace/AgentWorkspace";
import {
  type DraftStatus,
  type SquadMessageData,
} from "@/lib/data/workspace";
import {
  createSquadEventSource,
  isHitlDecisionMessage,
  mapSquadMessage,
  parseSquadStreamEvent,
  resolveHitlDraft,
  sendSquadMessage,
} from "@/lib/api/workspace";

function upsertMessage(messages: SquadMessageData[], next: SquadMessageData) {
  if (messages.some((message) => message.id === next.id)) return messages;
  return [...messages, next];
}

function actionForStatus(status: DraftStatus) {
  if (status === "approved") return "approve";
  if (status === "rejected") return "reject";
  return "edit";
}

export default function SquadChatPage() {
  const [messages, setMessages] = useState<SquadMessageData[]>([]);
  const [hitlStatuses, setHitlStatuses] = useState<Record<string, DraftStatus>>({});
  const [isSending, setIsSending] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);

  useEffect(() => {
    const source = createSquadEventSource();

    source.onmessage = (event) => {
      const payload = parseSquadStreamEvent(event.data);
      if (!payload) return;

      if (payload.type === "error") {
        setStreamError(payload.error);
        return;
      }

      if (payload.type !== "squad_message") return;

      const message = mapSquadMessage(payload.row);
      setMessages((current) => upsertMessage(current, message));

      if (isHitlDecisionMessage(message) && message.hitlCard) {
        setHitlStatuses((current) => ({
          ...current,
          [message.hitlCard!.id]: message.hitlCard!.status,
        }));
      }
    };

    source.onerror = () => {
      setStreamError("Live squad stream disconnected. Retrying...");
    };

    return () => source.close();
  }, []);

  async function handleHitlAction(cardId: string, status: DraftStatus) {
    setHitlStatuses((current) => ({ ...current, [cardId]: status }));

    try {
      const updated = await resolveHitlDraft(cardId, actionForStatus(status));
      setHitlStatuses((current) => ({ ...current, [cardId]: updated.status }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Approval request failed";
      setStreamError(message);
      setHitlStatuses((current) => ({ ...current, [cardId]: "pending" }));
    }
  }

  async function sendMessage(text: string) {
    setIsSending(true);
    setStreamError(null);

    try {
      const result = await sendSquadMessage(text);
      setMessages((current) => upsertMessage(current, mapSquadMessage(result.message)));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Squad message failed";
      setStreamError(message);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="flex h-full flex-col bg-white">
      <WorkspaceHeader title="Squad chat" subtitle="everyone, in one room" />
      <main className="flex min-h-0 flex-1 flex-col px-5 py-5 md:px-10">
        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          <div className="mx-auto flex max-w-4xl flex-col gap-4">
            {streamError && (
              <div className="rounded-xl border border-[#e5e5e5] bg-[#fafafa] px-4 py-3 font-workspace-sans text-[12px] text-[#666666]">
                {streamError}
              </div>
            )}
            {messages.map((message) => (
              <SquadMessage
                key={message.id}
                message={message}
                hitlStatus={
                  message.hitlCard
                    ? hitlStatuses[message.hitlCard.id] ?? message.hitlCard.status
                    : undefined
                }
                onHitlAction={
                  message.hitlCard
                    ? (status) => handleHitlAction(message.hitlCard!.id, status)
                    : undefined
                }
              />
            ))}
          </div>
        </div>
      </main>
      <ChatInputBar
        placeholder="Message the squad..."
        showTaskToggle
        isSending={isSending}
        onSend={sendMessage}
      />
    </div>
  );
}
