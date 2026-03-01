export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  toolsUsed?: string[];
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
}

export interface VisionAnalysis {
  description: string;
  objects: string[];
  text?: string;
  confidence?: number;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  loading: boolean;
}

export interface AgentTask {
  task: string;
  agentName: string;
  useTools?: boolean;
}

export interface UploadedFile {
  file: File;
  preview: string;
  type: string;
  name: string;
}
