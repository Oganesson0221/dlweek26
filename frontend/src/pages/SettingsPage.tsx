import React, { useState } from "react";
import { useApiKeys } from "@/hooks/useApiKeys";
import {
  Key,
  Eye,
  EyeOff,
  CheckCircle,
  AlertTriangle,
  Trash2,
  Shield,
  Sparkles,
} from "lucide-react";

export const SettingsPage: React.FC = () => {
  const { apiKey, orgId, setApiKey, setOrgId, clearKeys, hasKeys } =
    useApiKeys();
  const [showKey, setShowKey] = useState(false);
  const [tempKey, setTempKey] = useState(apiKey);
  const [tempOrg, setTempOrg] = useState(orgId);
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<"success" | "error" | null>(
    null,
  );

  const handleSave = () => {
    setApiKey(tempKey);
    setOrgId(tempOrg);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleClear = () => {
    clearKeys();
    setTempKey("");
    setTempOrg("");
    setTestResult(null);
  };

  const handleTest = async () => {
    if (!tempKey) return;
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("https://api.openai.com/v1/models", {
        headers: {
          Authorization: `Bearer ${tempKey}`,
          ...(tempOrg ? { "OpenAI-Organization": tempOrg } : {}),
        },
      });
      if (res.ok) {
        setTestResult("success");
      } else {
        setTestResult("error");
      }
    } catch {
      setTestResult("error");
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2.5">
          <Key className="w-5 h-5 text-accent" />
          API Configuration
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Configure your OpenAI API keys to power Microsoft CoursePilot AI tools. Keys are
          stored locally in your browser.
        </p>
      </div>

      {/* Security Notice */}
      <div className="bg-accent/5 border border-accent/15 rounded-lg p-4 flex items-start gap-3">
        <Shield className="w-4 h-4 text-accent mt-0.5 shrink-0" />
        <div>
          <h3 className="text-[13px] font-semibold text-accent-light">
            Your keys stay private
          </h3>
          <p className="text-[12px] text-slate-500 mt-0.5">
            API keys are stored only in your browser's localStorage and are sent
            directly to OpenAI. They never pass through any third-party server.
          </p>
        </div>
      </div>

      {/* API Key Form */}
      <div className="bg-surface-card border border-border-subtle rounded-lg p-5 space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">
            OpenAI API Key <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <input
              type={showKey ? "text" : "password"}
              value={tempKey}
              onChange={(e) => setTempKey(e.target.value)}
              placeholder="sk-..."
              className="w-full input-field font-mono text-xs pr-10"
            />
            <button
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
            >
              {showKey ? (
                <EyeOff className="w-3.5 h-3.5" />
              ) : (
                <Eye className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">
            Organization ID <span className="text-slate-600">(optional)</span>
          </label>
          <input
            type="text"
            value={tempOrg}
            onChange={(e) => setTempOrg(e.target.value)}
            placeholder="org-..."
            className="w-full input-field font-mono text-xs"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={handleSave}
            disabled={!tempKey}
            className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed text-xs"
          >
            {saved ? "✓ Saved!" : "Save Keys"}
          </button>
          <button
            onClick={handleTest}
            disabled={!tempKey || testing}
            className="btn-secondary disabled:opacity-40 disabled:cursor-not-allowed text-xs"
          >
            {testing ? "Testing..." : "Test Connection"}
          </button>
          {hasKeys && (
            <button
              onClick={handleClear}
              className="px-4 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-md font-medium transition-colors text-xs flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear
            </button>
          )}
        </div>

        {/* Test Result */}
        {testResult === "success" && (
          <div className="flex items-center gap-2 text-green-400 bg-green-500/10 border border-green-500/15 rounded-md px-4 py-2.5">
            <CheckCircle className="w-3.5 h-3.5" />
            <span className="text-xs">
              Connection successful — your API key is valid.
            </span>
          </div>
        )}
        {testResult === "error" && (
          <div className="flex items-center gap-2 text-red-400 bg-red-500/10 border border-red-500/15 rounded-md px-4 py-2.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span className="text-xs">
              Connection failed. Check your API key and try again.
            </span>
          </div>
        )}
      </div>

      {/* Status */}
      <div className="bg-surface-card border border-border-subtle rounded-lg p-5">
        <h2 className="text-[14px] font-semibold text-white mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-gold" />
          Service Status
        </h2>
        <div className="space-y-2.5">
          {[
            { label: "API Key", ready: hasKeys, alt: "⚠ Not Set" },
            { label: "Organization", ready: !!orgId, alt: "— Optional" },
            { label: "AI Tutor", ready: hasKeys, alt: "Needs API Key" },
            { label: "Vision Lab", ready: hasKeys, alt: "Needs API Key" },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between">
              <span className="text-xs text-slate-500">{item.label}</span>
              <span
                className={`text-xs font-medium ${item.ready ? "text-green-400" : "text-slate-600"}`}
              >
                {item.ready ? "✓ Ready" : item.alt}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
