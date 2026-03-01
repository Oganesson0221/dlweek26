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
        // Simulate API call - replace with actual API
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const response = `I've processed your task: "${task}" using ${currentAgent.name}`;
        addMessage("assistant", response, ["default-tool"]);

        return response;
      } catch (error) {
        addMessage(
          "system",
          `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
        throw error;
      } finally {
        setIsProcessing(false);
      }
    },
    [currentAgent, addMessage],
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
