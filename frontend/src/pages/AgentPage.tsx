import React, { useState } from "react";
import { AgentChat } from "@/components/AgentChat";
import { useAgent } from "@/hooks/useAgent";
import { Agent } from "@/types";
import {
  Bot,
  Settings,
  Users,
  GraduationCap,
  BookOpen,
  Brain,
} from "lucide-react";

const availableAgents: Agent[] = [
  {
    id: "1",
    name: "Study Buddy",
    description:
      "Your personal learning assistant that explains concepts, answers questions, and helps you study effectively.",
    systemPrompt:
      "You are an expert educational AI tutor called Study Buddy. Help students learn by explaining concepts clearly, providing examples, and asking thought-provoking questions. Be encouraging and patient. Use analogies when helpful. Format your responses with clear structure.",
  },
  {
    id: "2",
    name: "Code Coach",
    description:
      "Programming mentor that writes, explains, and debugs code across multiple languages.",
    systemPrompt:
      "You are Code Coach, an expert programming tutor. Help students learn to code by explaining concepts, writing clean annotated code, debugging issues, and teaching best practices. Always explain your reasoning step by step.",
  },
  {
    id: "3",
    name: "Essay Reviewer",
    description:
      "Academic writing assistant that reviews, critiques, and improves essays and papers.",
    systemPrompt:
      "You are Essay Reviewer, an academic writing expert. Help students improve their writing by providing constructive feedback on structure, argumentation, clarity, and style. Suggest specific improvements with examples.",
  },
];

export const AgentPage: React.FC = () => {
  const [selectedAgent, setSelectedAgent] = useState<Agent>(availableAgents[0]);
  const { messages, isProcessing, processTask, selectAgent } =
    useAgent(selectedAgent);

  const handleAgentChange = (agent: Agent) => {
    setSelectedAgent(agent);
    selectAgent(agent);
  };

  const agentIcons: Record<string, React.ReactNode> = {
    "1": <GraduationCap className="w-4 h-4" />,
    "2": <BookOpen className="w-4 h-4" />,
    "3": <Brain className="w-4 h-4" />,
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white">AI Tutor</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Chat with specialized learning agents powered by GPT-4o
        </p>
      </div>

      {/* Agent Selection */}
      <div className="bg-surface-card border border-border-subtle rounded-lg p-3">
        <div className="flex items-center gap-2 overflow-x-auto">
          {availableAgents.map((agent) => (
            <button
              key={agent.id}
              onClick={() => handleAgentChange(agent)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-md transition-all text-sm font-medium shrink-0 ${
                selectedAgent.id === agent.id
                  ? "bg-accent text-white"
                  : "text-slate-400 hover:bg-surface-hover hover:text-slate-200"
              }`}
            >
              {agentIcons[agent.id] || <Bot className="w-4 h-4" />}
              <span>{agent.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="h-[560px]">
        <AgentChat
          messages={messages}
          onSendMessage={processTask}
          isProcessing={isProcessing}
          agentName={selectedAgent.name}
        />
      </div>

      {/* Agent Info */}
      <div className="bg-surface-card border border-border-subtle rounded-lg p-5">
        <h2 className="text-sm font-semibold text-white mb-2">
          About {selectedAgent.name}
        </h2>
        <p className="text-[13px] text-slate-400 mb-3">
          {selectedAgent.description}
        </p>
        <div className="flex items-center gap-5 text-[12px]">
          <div className="flex items-center gap-1.5 text-slate-500">
            <Settings className="w-3.5 h-3.5" />
            <span>Model: GPT-4o</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-500">
            <Users className="w-3.5 h-3.5" />
            <span>Context-aware responses</span>
          </div>
        </div>
      </div>
    </div>
  );
};
