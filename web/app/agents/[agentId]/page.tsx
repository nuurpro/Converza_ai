"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  AgentBackLink,
  ChatEmptyState,
  ChatInputBar,
  ChatThread,
  type ChatBubbleMessage,
} from "@/components/workspace/AgentWorkspace";
import {
  type AgentId,
  getAgentById,
  getAgentChatConfig,
} from "@/lib/data/workspace";
import { sendAgentMessage } from "@/lib/api/workspace";

function isAgentId(value: string): value is AgentId {
  return value === "milo" || value === "sleyz" || value === "vea";
}

export default function AgentChatPage() {
  const params = useParams<{ agentId: string }>();
  const agentId = params.agentId;
  const [messages, setMessages] = useState<ChatBubbleMessage[]>([]);
  const [isSending, setIsSending] = useState(false);

  if (!isAgentId(agentId)) {
    return (
      <div className="flex h-full items-center justify-center bg-white px-6 text-center font-workspace-sans">
        <div>
          <h1 className="font-workspace-display text-2xl font-extrabold text-[#111111]">
            Agent not found
          </h1>
          <Link href="/agents" className="mt-3 inline-flex text-[13px] text-converza-blue">
            Back to agents
          </Link>
        </div>
      </div>
    );
  }

  const activeAgentId: AgentId = agentId;
  const agent = getAgentById(activeAgentId);
  const config = getAgentChatConfig(activeAgentId);

  if (!agent) return null;

  async function sendMessage(text: string) {
    const userMessage: ChatBubbleMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
    };
    setMessages((current) => [...current, userMessage]);
    setIsSending(true);

    try {
      const result = await sendAgentMessage(activeAgentId, text);
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "agent",
          content:
            result.response ||
            "Queued. I will post the review item in Squad chat when the work is ready.",
        },
      ]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Agent request failed";
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "agent",
          content: `I could not complete that request.\n\n${message}`,
        },
      ]);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="flex h-full flex-col bg-white">
      <AgentBackLink />
      {messages.length === 0 ? (
        <ChatEmptyState
          eyebrow={config.eyebrow}
          color={agent.color}
          headline={config.headline}
          accentWord={config.accentWord}
          description={config.description}
          suggestions={config.suggestions}
          metrics={config.metrics}
          onSuggestion={sendMessage}
        />
      ) : (
        <ChatThread messages={messages} agentColor={agent.color} />
      )}
      <ChatInputBar
        placeholder={config.placeholder}
        showTaskToggle
        isSending={isSending}
        onSend={sendMessage}
      />
    </div>
  );
}
