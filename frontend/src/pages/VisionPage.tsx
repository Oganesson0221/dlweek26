import React, { useState } from "react";
import { VisionUpload } from "@/components/VisionUpload";
import { useVisionApi } from "@/hooks/useApi";
import { VisionAnalysis } from "@/types";
import { Camera, Image as ImageIcon, Info } from "lucide-react";

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

  const examples = [
    {
      name: "Object Detection",
      icon: Camera,
      description: "Identify objects in images",
    },
    {
      name: "Scene Description",
      icon: ImageIcon,
      description: "Get detailed scene analysis",
    },
    {
      name: "Text Extraction",
      icon: Info,
      description: "Extract text from images",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Computer Vision</h1>
        <p className="text-gray-500 mt-1">
          Analyze images with GPT-4 Vision - object detection, scene
          description, and text extraction
        </p>
      </div>

      {/* Examples */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {examples.map((example) => {
          const Icon = example.icon;
          return (
            <div
              key={example.name}
              className="bg-white rounded-xl shadow-sm p-4"
            >
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2 bg-primary-50 rounded-lg">
                  <Icon className="w-5 h-5 text-primary-600" />
                </div>
                <h3 className="font-medium text-gray-900">{example.name}</h3>
              </div>
              <p className="text-sm text-gray-500">{example.description}</p>
            </div>
          );
        })}
      </div>

      {/* Main Vision Component */}
      <VisionUpload
        onAnalyze={handleAnalyze}
        isProcessing={loading}
        analysis={analysis}
      />

      {/* Tips */}
      <div className="bg-blue-50 rounded-xl p-4">
        <h3 className="font-medium text-blue-900 mb-2">
          💡 Tips for best results
        </h3>
        <ul className="text-sm text-blue-800 space-y-1">
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
