import React, { useState } from "react";
import { VisionUpload } from "@/components/VisionUpload";
import { useVisionApi } from "@/hooks/useApi";
import { VisionAnalysis } from "@/types";
import { Camera, Image as ImageIcon, Type, Lightbulb } from "lucide-react";

export const VisionPage: React.FC = () => {
  const [analysis, setAnalysis] = useState<VisionAnalysis | null>(null);
  const { loading, analyzeImage, detectObjects, extractText, describeScene } =
    useVisionApi();

  const handleAnalyze = async (file: File, type: string) => {
    try {
      let result;
      switch (type) {
        case "describe":
          result = await describeScene(file);
          break;
        case "detect":
          result = await detectObjects(file);
          break;
        case "text":
          result = await extractText(file);
          break;
        default:
          result = await analyzeImage(file);
      }
      setAnalysis(result);
    } catch (error) {
      console.error("Analysis failed:", error);
    }
  };

  const capabilities = [
    {
      name: "Object Detection",
      icon: Camera,
      description: "Identify objects in educational diagrams",
    },
    {
      name: "Scene Description",
      icon: ImageIcon,
      description: "Detailed analysis of charts & figures",
    },
    {
      name: "Text Extraction",
      icon: Type,
      description: "OCR from textbook pages & slides",
    },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white">Vision Lab</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Analyze images with GPT-4o Vision — extract text, detect objects, and
          describe scenes
        </p>
      </div>

      {/* Capabilities */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {capabilities.map((cap) => {
          const Icon = cap.icon;
          return (
            <div
              key={cap.name}
              className="bg-surface-card border border-border-subtle rounded-lg p-4"
            >
              <div className="flex items-center gap-3 mb-1.5">
                <div className="p-1.5 bg-accent-subtle rounded-md">
                  <Icon className="w-4 h-4 text-accent" />
                </div>
                <h3 className="text-[13px] font-semibold text-white">
                  {cap.name}
                </h3>
              </div>
              <p className="text-[12px] text-slate-500">{cap.description}</p>
            </div>
          );
        })}
      </div>

      {/* Main Upload */}
      <VisionUpload
        onAnalyze={handleAnalyze}
        isProcessing={loading}
        analysis={analysis}
      />

      {/* Tips */}
      <div className="bg-gold-subtle border border-gold/15 rounded-lg px-5 py-4">
        <h3 className="text-[13px] font-semibold text-gold flex items-center gap-2 mb-2">
          <Lightbulb className="w-4 h-4" />
          Tips for best results
        </h3>
        <ul className="text-[12px] text-slate-400 space-y-1">
          <li>• Use clear, well-lit images for better object detection</li>
          <li>
            • For text extraction, ensure text is legible and not too small
          </li>
          <li>• Scene descriptions work best with complex, detailed images</li>
          <li>• Supported formats: PNG, JPG, JPEG, GIF, WEBP</li>
        </ul>
      </div>
    </div>
  );
};
