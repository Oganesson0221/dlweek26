import React, { useState } from "react";
import { AgentChat } from "@/components/AgentChat";
import { useAgent } from "@/hooks/useAgent";
import { Agent } from "@/types";
import { Bot, Settings, Users } from "lucide-react";

const availableAgents: Agent[] = [
  {
    id: "1",
    name: "Researcher",
    description: "Research assistant who finds and summarizes information",
    systemPrompt: "You are a research assistant...",
  },
  {
    id: "2",
    name: "Coder",
    description: "Programming expert who writes and explains code",
    systemPrompt: "You are a coding expert...",
  },
  {
    id: "3",
    name: "Critic",
    description: "Critical thinker who evaluates ideas",
    systemPrompt: "You are a critical thinker...",
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Agentic AI</h1>
        <p className="text-gray-500 mt-1">
          Interact with specialized AI agents that can use tools and collaborate
        </p>
      </div>

      {/* Agent Selection */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex items-center space-x-4 overflow-x-auto pb-2">
          {availableAgents.map((agent) => (
            <button
              key={agent.id}
              onClick={() => handleAgentChange(agent)}
              className={`flex items-center space-x-3 px-4 py-2 rounded-lg transition-colors flex-shrink-0 ${
                selectedAgent.id === agent.id
                  ? "bg-primary-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <Bot className="w-4 h-4" />
              <span className="text-sm font-medium">{agent.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="h-[600px]">
        <AgentChat
          messages={messages}
          onSendMessage={processTask}
          isProcessing={isProcessing}
          agentName={selectedAgent.name}
        />
      </div>

      {/* Agent Info */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          About {selectedAgent.name}
        </h2>
        <p className="text-gray-600 mb-4">{selectedAgent.description}</p>

        <div className="flex items-center space-x-6 text-sm">
          <div className="flex items-center space-x-2">
            <Settings className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600">
              Tools: Calculator, Search, Code
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600">
              Can collaborate with other agents
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
