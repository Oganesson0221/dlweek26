import { useState, useCallback } from "react";
import { Message, Agent } from "@/types";

export function useAgent(initialAgent?: Agent) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentAgent, setCurrentAgent] = useState<Agent | undefined>(
    initialAgent,
  );
  const [isProcessing, setIsProcessing] = useState(false);

  const addMessage = useCallback(
    (role: Message["role"], content: string, toolsUsed?: string[]) => {
      const newMessage: Message = {
        id: Date.now().toString(),
        role,
        content,
        timestamp: new Date(),
        toolsUsed,
      };
      setMessages((prev) => [...prev, newMessage]);
      return newMessage;
    },
    [],
  );

  const processTask = useCallback(
    async (task: string) => {
      if (!currentAgent) {
        throw new Error("No agent selected");
      }

      setIsProcessing(true);
      addMessage("user", task);

      try {
        const apiKey = localStorage.getItem("openai_api_key");
        const orgId = localStorage.getItem("openai_org_id");

        if (!apiKey) {
          addMessage(
            "system",
            "⚠️ No API key configured. Please go to Settings and add your OpenAI API key.",
          );
          return;
        }

        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        };
        if (orgId) headers["OpenAI-Organization"] = orgId;

        const res = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers,
          body: JSON.stringify({
            model: "gpt-4o",
            messages: [
              {
                role: "system",
                content: currentAgent.systemPrompt,
              },
              ...messages
                .filter((m) => m.role !== "system")
                .map((m) => ({ role: m.role, content: m.content })),
              { role: "user", content: task },
            ],
            max_tokens: 1024,
            temperature: 0.7,
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error?.message || `API error: ${res.status}`);
        }

        const data = await res.json();
        const response = data.choices?.[0]?.message?.content || "No response.";
        addMessage("assistant", response, ["openai-chat"]);
        return response;
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Unknown error";
        addMessage("system", `❌ Error: ${msg}`);
        throw error;
      } finally {
        setIsProcessing(false);
      }
    },
    [currentAgent, addMessage, messages],
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const selectAgent = useCallback(
    (agent: Agent) => {
      setCurrentAgent(agent);
      addMessage("system", `Switched to ${agent.name} agent`);
    },
    [addMessage],
  );

  return {
    messages,
    currentAgent,
    isProcessing,
    processTask,
    clearMessages,
    selectAgent,
    addMessage,
  };
}
