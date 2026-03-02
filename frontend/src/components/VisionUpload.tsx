import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import {
  Upload,
  Image as ImageIcon,
  X,
  Loader,
  Eye,
  Type,
  Box,
} from "lucide-react";
import { UploadedFile, VisionAnalysis } from "@/types";

interface VisionUploadProps {
  onAnalyze: (file: File, analysisType: string) => Promise<void>;
  isProcessing: boolean;
  analysis?: VisionAnalysis | null;
}

export const VisionUpload: React.FC<VisionUploadProps> = ({
  onAnalyze,
  isProcessing,
  analysis,
}) => {
  const [file, setFile] = useState<UploadedFile | null>(null);
  const [analysisType, setAnalysisType] = useState<string>("describe");

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const preview = URL.createObjectURL(file);
      setFile({
        file,
        preview,
        type: file.type,
        name: file.name,
      });
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
    },
    maxFiles: 1,
  });

  const handleAnalyze = async () => {
    if (file && !isProcessing) {
      await onAnalyze(file.file, analysisType);
    }
  };

  const clearFile = () => {
    if (file) {
      URL.revokeObjectURL(file.preview);
      setFile(null);
    }
  };

  const analysisOptions = [
    { id: "describe", label: "Describe Scene", icon: Eye },
    { id: "detect", label: "Detect Objects", icon: Box },
    { id: "text", label: "Extract Text", icon: Type },
  ];

  return (
    <div className="bg-surface-card border border-border-subtle rounded-lg p-5">
      <h2 className="text-[14px] font-semibold text-white mb-4">
        Vision Analysis
      </h2>

      {/* Upload Area */}
      {!file ? (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive
              ? "border-accent bg-accent/5"
              : "border-border-default hover:border-accent/50 hover:bg-surface-overlay/30"
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="w-10 h-10 text-slate-500 mx-auto mb-3" />
          {isDragActive ? (
            <p className="text-accent text-sm">Drop the image here...</p>
          ) : (
            <>
              <p className="text-slate-300 text-sm">
                Drag & drop an image here, or click to select
              </p>
              <p className="text-xs text-slate-600 mt-1.5">
                Supports PNG, JPG, GIF, WEBP up to 10MB
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {/* Preview */}
          <div className="relative rounded-lg overflow-hidden border border-border-subtle">
            <img
              src={file.preview}
              alt={file.name}
              className="w-full h-64 object-contain bg-surface-raised"
            />
            <button
              onClick={clearFile}
              className="absolute top-2 right-2 p-1.5 bg-red-500/80 backdrop-blur-sm text-white rounded-full hover:bg-red-500 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Analysis Options */}
          <div className="flex gap-2">
            {analysisOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = analysisType === option.id;
              return (
                <button
                  key={option.id}
                  onClick={() => setAnalysisType(option.id)}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    isSelected
                      ? "bg-accent text-white"
                      : "bg-surface-overlay text-slate-400 hover:text-slate-200 hover:bg-surface-overlay/80"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{option.label}</span>
                </button>
              );
            })}
          </div>

          {/* Analyze Button */}
          <button
            onClick={handleAnalyze}
            disabled={isProcessing}
            className="w-full btn-primary disabled:opacity-50"
          >
            {isProcessing ? (
              <span className="flex items-center justify-center gap-2">
                <Loader className="w-4 h-4 animate-spin" />
                <span>Analyzing...</span>
              </span>
            ) : (
              "Analyze Image"
            )}
          </button>
        </div>
      )}

      {/* Analysis Results */}
      {analysis && (
        <div className="mt-5 space-y-4">
          <h3 className="text-[13px] font-semibold text-white">
            Analysis Results
          </h3>

          {analysis.description && (
            <div className="bg-surface-overlay rounded-lg p-4">
              <p className="text-[13px] text-slate-300 leading-relaxed">
                {analysis.description}
              </p>
            </div>
          )}

          {analysis.objects && analysis.objects.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-slate-400 mb-2">
                Detected Objects
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {analysis.objects.map((obj, index) => (
                  <span
                    key={index}
                    className="px-2.5 py-1 bg-accent/15 text-accent-light rounded-full text-xs"
                  >
                    {obj}
                  </span>
                ))}
              </div>
            </div>
          )}

          {analysis.text && (
            <div>
              <h4 className="text-xs font-medium text-slate-400 mb-2">
                Extracted Text
              </h4>
              <div className="bg-surface-overlay rounded-lg p-4">
                <p className="text-[13px] text-slate-300 font-mono leading-relaxed">
                  {analysis.text}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
