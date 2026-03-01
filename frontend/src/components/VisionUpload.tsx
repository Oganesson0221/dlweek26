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
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Computer Vision Analysis
      </h2>

      {/* Upload Area */}
      {!file ? (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive
              ? "border-primary-500 bg-primary-50"
              : "border-gray-300 hover:border-primary-400 hover:bg-gray-50"
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          {isDragActive ? (
            <p className="text-primary-600">Drop the image here...</p>
          ) : (
            <>
              <p className="text-gray-600">
                Drag & drop an image here, or click to select
              </p>
              <p className="text-sm text-gray-400 mt-2">
                Supports PNG, JPG, GIF up to 10MB
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Preview */}
          <div className="relative rounded-lg overflow-hidden border border-gray-200">
            <img
              src={file.preview}
              alt={file.name}
              className="w-full h-64 object-contain bg-gray-50"
            />
            <button
              onClick={clearFile}
              className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Analysis Options */}
          <div className="flex space-x-2">
            {analysisOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = analysisType === option.id;
              return (
                <button
                  key={option.id}
                  onClick={() => setAnalysisType(option.id)}
                  className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isSelected
                      ? "bg-primary-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <Icon className="w-4 h-4" />
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
              <span className="flex items-center justify-center space-x-2">
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
        <div className="mt-6 space-y-4">
          <h3 className="font-medium text-gray-900">Analysis Results</h3>

          {analysis.description && (
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-700">{analysis.description}</p>
            </div>
          )}

          {analysis.objects && analysis.objects.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Detected Objects
              </h4>
              <div className="flex flex-wrap gap-2">
                {analysis.objects.map((obj, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm"
                  >
                    {obj}
                  </span>
                ))}
              </div>
            </div>
          )}

          {analysis.text && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Extracted Text
              </h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-700 font-mono">
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
