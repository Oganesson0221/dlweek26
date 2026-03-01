import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Menu,
  X,
  Bell,
  Upload,
  FileText,
  Mic,
  MicOff,
  MessageCircle,
  Loader2,
  ChevronRight,
  Volume2,
  VolumeX,
  Send,
} from "lucide-react";
import { renderMarkdownBold } from "@/utils/markdownHelpers";

interface ClippyMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
}

interface Assignment {
  id: string;
  title: string;
  courseCode: string;
  daysLeft: number;
}

interface ClippyAssistantProps {
  dismissed: boolean;
  onDismiss: () => void;
  minimized: boolean;
  onToggleMinimize: () => void;
  messages: string[];
  tips: string[];
  currentTip: number;
  onTipChange: (index: number) => void;
  listening: boolean;
  onToggleListening: () => void;
  urgentDeadlines: Assignment[];
  stats: { submitted: number; total: number };
  onUploadOutline: () => void;
  onNewDoc: () => void;
}

// Speech Recognition types
interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

export const ClippyAssistant: React.FC<ClippyAssistantProps> = ({
  dismissed,
  onDismiss,
  minimized,
  onToggleMinimize,
  messages,
  tips,
  currentTip,
  onTipChange,
  listening,
  onToggleListening,
  urgentDeadlines,
  stats,
  onUploadOutline,
  onNewDoc,
}) => {
  // Voice assistant state
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [chatMessages, setChatMessages] = useState<ClippyMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognitionAPI) {
        const recognition = new SpeechRecognitionAPI();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onstart = () => {
          setIsListening(true);
          setError(null);
        };

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          let interim = "";
          let final = "";
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            if (result.isFinal) {
              final += result[0].transcript;
            } else {
              interim += result[0].transcript;
            }
          }
          
          setInterimTranscript(interim);
          if (final) {
            setTranscript(final);
          }
        };

        recognition.onerror = (event: { error: string }) => {
          console.error("Speech recognition error:", event.error);
          setIsListening(false);
          if (event.error === "not-allowed") {
            setError("Microphone access denied. Please allow microphone access.");
          } else if (event.error === "no-speech") {
            setError("No speech detected. Please try again.");
          }
        };

        recognition.onend = () => {
          setIsListening(false);
          setInterimTranscript("");
        };

        recognitionRef.current = recognition;
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Process transcript when complete
  useEffect(() => {
    if (transcript && !isListening && !isProcessing) {
      handleSendMessage(transcript);
      setTranscript("");
    }
  }, [transcript, isListening, isProcessing]);

  // Auto-scroll chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Start/stop listening
  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) {
      setError("Speech recognition not supported in this browser.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setTranscript("");
      setInterimTranscript("");
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error("Error starting recognition:", e);
      }
    }
    onToggleListening();
  }, [isListening, onToggleListening]);

  // Text-to-speech - strips emojis for cleaner speech
  const speakText = useCallback((text: string) => {
    if (!voiceEnabled || !window.speechSynthesis) return;

    window.speechSynthesis.cancel();
    
    // Remove emojis and special unicode characters for cleaner speech
    const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F000}-\u{1F02F}]|[\u{1F0A0}-\u{1F0FF}]|[\u{1F100}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F910}-\u{1F96B}]|[\u{1F980}-\u{1F9E0}]|[\u{200D}]|[\u{FE0F}]|[\u{20E3}]|[\u{E0020}-\u{E007F}]|[\u{2300}-\u{23FF}]|[\u{2B50}]|[\u{2934}-\u{2935}]|[\u{25AA}-\u{25AB}]|[\u{25B6}]|[\u{25C0}]|[\u{25FB}-\u{25FE}]|[\u{2614}-\u{2615}]|[\u{2648}-\u{2653}]|[\u{267F}]|[\u{2693}]|[\u{26A1}]|[\u{26AA}-\u{26AB}]|[\u{26BD}-\u{26BE}]|[\u{26C4}-\u{26C5}]|[\u{26CE}]|[\u{26D4}]|[\u{26EA}]|[\u{26F2}-\u{26F3}]|[\u{26F5}]|[\u{26FA}]|[\u{26FD}]|[\u{2702}]|[\u{2705}]|[\u{2708}-\u{270D}]|[\u{270F}]|[\u{2712}]|[\u{2714}]|[\u{2716}]|[\u{271D}]|[\u{2721}]|[\u{2728}]|[\u{2733}-\u{2734}]|[\u{2744}]|[\u{2747}]|[\u{274C}]|[\u{274E}]|[\u{2753}-\u{2755}]|[\u{2757}]|[\u{2763}-\u{2764}]|[\u{2795}-\u{2797}]|[\u{27A1}]|[\u{27B0}]|[\u{27BF}]|[\u{2B05}-\u{2B07}]|[\u{2B1B}-\u{2B1C}]|[\u{2B55}]|[\u{3030}]|[\u{303D}]|[\u{3297}]|[\u{3299}]|[\u{23E9}-\u{23F3}]|[\u{23F8}-\u{23FA}]/gu;
    
    const cleanText = text
      .replace(emojiRegex, '')
      .replace(/\s+/g, ' ')  // Normalize whitespace
      .trim();
    
    if (!cleanText) return; // Don't speak if only emojis
    
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 0.8;
    
    // Try to use a natural voice
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => 
      v.name.includes("Samantha") || 
      v.name.includes("Google") || 
      v.name.includes("Microsoft") ||
      v.lang.startsWith("en")
    );
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    synthRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [voiceEnabled]);

  // Stop speaking
  const stopSpeaking = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  // Send message to OpenAI
  const handleSendMessage = async (message: string) => {
    if (!message.trim() || isProcessing) return;

    const userMessage: ClippyMessage = {
      id: Date.now().toString(),
      role: "user",
      text: message.trim(),
    };

    setChatMessages(prev => [...prev, userMessage]);
    setIsProcessing(true);
    setError(null);

    try {
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
      const orgId = import.meta.env.VITE_OPENAI_ORG_ID || import.meta.env.OPENAI_ORG_ID;

      if (!apiKey) {
        throw new Error("OpenAI API key not configured");
      }

      // Build context about assignments
      const assignmentContext = urgentDeadlines.length > 0 
        ? `Current urgent assignments: ${urgentDeadlines.map(a => `${a.title} (${a.courseCode}) - ${a.daysLeft} days left`).join(", ")}`
        : "No urgent deadlines at the moment.";

      const progressContext = `Student progress: ${stats.submitted}/${stats.total} assignments submitted (${Math.round((stats.submitted / stats.total) * 100)}% completion rate).`;

      const systemPrompt = `You are Clippy, a friendly and helpful academic assistant for students. You help with:
- Study tips and strategies
- Assignment planning and time management
- Understanding course materials and concepts
- Motivation and encouragement
- Answering academic questions

Current context:
${assignmentContext}
${progressContext}

Keep responses concise (2-3 sentences max), friendly, and helpful. Use a warm, encouraging tone. If asked about specific assignments, use the context provided.`;

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      };
      
      if (orgId) {
        headers["OpenAI-Organization"] = orgId;
      }

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers,
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            ...chatMessages.slice(-6).map(m => ({
              role: m.role,
              content: m.text,
            })),
            { role: "user", content: message },
          ],
          max_tokens: 150,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `API error: ${response.status}`);
      }

      const data = await response.json();
      const assistantText = data.choices?.[0]?.message?.content || "I'm not sure how to help with that. Could you rephrase your question?";

      const assistantMessage: ClippyMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        text: assistantText,
      };

      setChatMessages(prev => [...prev, assistantMessage]);
      
      // Speak the response
      speakText(assistantText);

    } catch (err) {
      console.error("Error calling OpenAI:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to get response";
      setError(errorMessage);
      
      const fallbackMessage: ClippyMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        text: "Sorry, I'm having trouble connecting right now. Please try again in a moment!",
      };
      setChatMessages(prev => [...prev, fallbackMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle text input submit
  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (textInput.trim()) {
      handleSendMessage(textInput);
      setTextInput("");
    }
  };

  if (dismissed) return null;

  return (
    <div
      className={`w-[320px] shrink-0 transition-all duration-300 ${minimized ? "w-[60px]" : ""}`}
    >
      <div
        className={`bg-white border border-neutral-200 rounded-lg overflow-hidden sticky top-20 shadow-md hover:shadow-lg transition-all ${minimized ? "w-[60px]" : ""}`}
      >
        {/* Header */}
        <div
          className={`px-4 py-3 border-b border-neutral-200 flex items-center ${minimized ? "justify-center" : "justify-between"} bg-gradient-to-r from-[#0078d4]/5 to-[#50e6ff]/5`}
        >
          {!minimized ? (
            <>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src="/clippy.png"
                    alt="Clippy"
                    className="w-12 h-12 object-contain"
                  />
                  <span className={`absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white ${isListening ? "bg-red-500 animate-pulse" : isSpeaking ? "bg-blue-500 animate-pulse" : "bg-green-500"}`}></span>
                </div>
                <div>
                  <span className="text-[14px] font-semibold text-neutral-800 flex items-center gap-1">
                    Clippy Assistant
                  </span>
                  <p className="text-[10px] text-neutral-500">
                    {isListening ? "Listening..." : isSpeaking ? "Speaking..." : "Voice-enabled helper"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setVoiceEnabled(!voiceEnabled)}
                  className={`p-1.5 rounded transition-colors ${voiceEnabled ? "text-[#0078d4] bg-[#0078d4]/10" : "text-neutral-400 hover:text-neutral-600"}`}
                  title={voiceEnabled ? "Disable voice" : "Enable voice"}
                >
                  {voiceEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={onToggleMinimize}
                  className="p-1 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-200 rounded"
                  title="Minimize"
                >
                  <Menu className="w-3 h-3" />
                </button>
                <button
                  onClick={onDismiss}
                  className="p-1 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-200 rounded"
                  title="Close"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </>
          ) : (
            <button
              onClick={onToggleMinimize}
              className="p-2 text-neutral-400 hover:text-neutral-600"
              title="Expand"
            >
              <img src="/clippy.png" alt="Clippy" className="w-8 h-8" />
            </button>
          )}
        </div>

        {!minimized && (
          <>
            {/* Chat Messages */}
            {chatMessages.length > 0 && (
              <div 
                ref={chatContainerRef}
                className="max-h-[200px] overflow-y-auto p-3 border-b border-neutral-200 bg-neutral-50/50 space-y-2"
              >
                {chatMessages.slice(-6).map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] px-3 py-2 rounded-xl text-[12px] ${
                        msg.role === "user"
                          ? "bg-gradient-to-r from-[#0078d4] to-[#50e6ff] text-white rounded-br-sm"
                          : "bg-white border border-neutral-200 text-neutral-700 rounded-bl-sm shadow-sm"
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
                {isProcessing && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-neutral-200 px-3 py-2 rounded-xl rounded-bl-sm shadow-sm">
                      <Loader2 className="w-4 h-4 animate-spin text-[#0078d4]" />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Voice Input Section */}
            <div className="p-3 border-b border-neutral-200">
              {/* Voice Button */}
              <button
                onClick={toggleListening}
                disabled={isProcessing}
                className={`w-full flex items-center justify-center gap-2 p-3 rounded-xl transition-all ${
                  isListening
                    ? "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg animate-pulse"
                    : isProcessing
                      ? "bg-neutral-100 text-neutral-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-[#0078d4] to-[#50e6ff] text-white hover:shadow-lg"
                }`}
              >
                {isListening ? (
                  <>
                    <MicOff className="w-4 h-4" />
                    <span className="text-[12px] font-medium">Tap to stop</span>
                  </>
                ) : isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-[12px] font-medium">Processing...</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4" />
                    <span className="text-[12px] font-medium">Ask Clippy</span>
                  </>
                )}
              </button>

              {/* Interim transcript display */}
              {(interimTranscript || isListening) && (
                <div className="mt-2 p-2 bg-neutral-50 rounded-lg border border-neutral-200">
                  <p className="text-[11px] text-neutral-600 italic">
                    {interimTranscript || "Listening..."}
                  </p>
                </div>
              )}

              {/* Text input fallback */}
              <form onSubmit={handleTextSubmit} className="mt-2 flex gap-2">
                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Or type your question..."
                  disabled={isProcessing || isListening}
                  className="flex-1 px-3 py-2 text-[11px] border border-neutral-200 rounded-lg focus:ring-2 focus:ring-[#0078d4]/30 focus:border-[#0078d4] outline-none disabled:bg-neutral-50 disabled:text-neutral-400"
                />
                <button
                  type="submit"
                  disabled={!textInput.trim() || isProcessing || isListening}
                  className="px-3 py-2 bg-[#0078d4] text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#106ebe] transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>

              {/* Error display */}
              {error && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-[10px] text-red-600">{error}</p>
                </div>
              )}
            </div>

            {/* Tips */}
            <div className="p-3">
              {messages.length > 0 && chatMessages.length === 0 && (
                <div className="mb-3 border-b border-neutral-200 pb-3">
                  <p className="text-[10px] font-semibold text-neutral-600 uppercase tracking-wide mb-2 flex items-center gap-1">
                    <ChevronRight className="w-3 h-3" />
                    Recent Activity
                  </p>
                  <div className="space-y-2">
                    {messages.slice(0, 2).map((msg, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2 p-2 bg-white rounded-md shadow-sm"
                      >
                        <MessageCircle className="w-3 h-3 text-neutral-400 mt-0.5 shrink-0" />
                        <p className="text-[11px] text-neutral-700">
                          {renderMarkdownBold(msg)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tip area */}
              <div className="mb-3">
                <p className="text-[10px] font-semibold text-neutral-600 uppercase tracking-wide mb-2 flex items-center gap-1">
                  Pro Tip #{currentTip + 1}
                </p>
                <div className="bg-neutral-50 p-3 rounded-md border border-neutral-200">
                  <p className="text-[12px] text-neutral-700 leading-relaxed font-medium">
                    {renderMarkdownBold(tips[currentTip])}
                  </p>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-1">
                    {tips.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => onTipChange(i)}
                        className={`w-2 h-2 rounded-full transition-all ${
                          i === currentTip
                            ? "bg-neutral-500 w-4"
                            : "bg-neutral-300 hover:bg-neutral-400"
                        }`}
                      />
                    ))}
                  </div>
                  <button
                    onClick={() => onTipChange((currentTip + 1) % tips.length)}
                    className="text-[10px] text-neutral-500 hover:text-neutral-700"
                  >
                    Next →
                  </button>
                </div>
              </div>

              {/* Deadline reminders */}
              {urgentDeadlines.length > 0 && (
                <div className="border-t border-neutral-200 pt-3">
                  <p className="text-[10px] font-semibold text-neutral-600 uppercase tracking-wide mb-2 flex items-center gap-1">
                    <Bell className="w-3 h-3" />
                    Urgent ({urgentDeadlines.length})
                  </p>
                  <div className="space-y-2 max-h-[150px] overflow-y-auto">
                    {urgentDeadlines.map((a) => (
                      <div
                        key={a.id}
                        className="flex items-start gap-2 p-2 bg-neutral-50 rounded-md shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div
                          className={`w-1 h-full rounded-full self-stretch ${
                            a.daysLeft <= 3 ? "bg-red-500" : "bg-neutral-400"
                          }`}
                        />
                        <div className="flex-1">
                          <p className="text-[11px] font-medium text-neutral-700 leading-tight">
                            {a.title}
                          </p>
                          <p className="text-[9px] text-neutral-400">
                            {a.courseCode}
                          </p>
                          <p
                            className={`text-[10px] mt-1 font-medium ${
                              a.daysLeft <= 3
                                ? "text-red-500"
                                : "text-neutral-500"
                            }`}
                          >
                            {a.daysLeft} day{a.daysLeft > 1 ? "s" : ""} left
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick actions */}
              <div className="border-t border-neutral-200 pt-3 mt-3">
                <p className="text-[10px] font-semibold text-neutral-600 uppercase tracking-wide mb-2">
                  Quick Actions
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={onUploadOutline}
                    className="flex flex-col items-center gap-1 p-2 bg-neutral-50 rounded-md hover:bg-neutral-100 border border-neutral-200"
                  >
                    <Upload className="w-4 h-4 text-neutral-600" />
                    <span className="text-[9px] text-neutral-600">
                      Upload Outline
                    </span>
                  </button>
                  <button
                    onClick={onNewDoc}
                    className="flex flex-col items-center gap-1 p-2 bg-neutral-50 rounded-md hover:bg-neutral-100 border border-neutral-200"
                  >
                    <FileText className="w-4 h-4 text-neutral-600" />
                    <span className="text-[9px] text-neutral-600">New Doc</span>
                  </button>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-3 pt-2 border-t border-neutral-200">
                <div className="flex items-center justify-between text-[9px] text-neutral-600 mb-1">
                  <span>Overall Progress</span>
                  <span className="font-medium">
                    {Math.round((stats.submitted / stats.total) * 100)}%
                  </span>
                </div>
                <div className="h-1.5 bg-neutral-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#0078d4] to-[#50e6ff] rounded-full transition-all duration-500"
                    style={{
                      width: `${(stats.submitted / stats.total) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
