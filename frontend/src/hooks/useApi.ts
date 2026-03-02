import { useState, useCallback } from "react";

function getHeaders(): Record<string, string> {
  const apiKey = localStorage.getItem("openai_api_key") || "";
  const orgId = localStorage.getItem("openai_org_id") || "";
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  };
  if (orgId) headers["OpenAI-Organization"] = orgId;
  return headers;
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function useVisionApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const callVision = useCallback(async (file: File, prompt: string) => {
    const apiKey = localStorage.getItem("openai_api_key");
    if (!apiKey) {
      throw new Error(
        "No API key configured. Please go to Settings to add your OpenAI API key.",
      );
    }

    setLoading(true);
    setError(null);
    try {
      const base64 = await fileToBase64(file);
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: prompt },
                { type: "image_url", image_url: { url: base64 } },
              ],
            },
          ],
          max_tokens: 1024,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || `API error: ${res.status}`);
      }

      const data = await res.json();
      const text = data.choices?.[0]?.message?.content || "";
      return text;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const analyzeImage = useCallback(
    async (file: File) => {
      const text = await callVision(
        file,
        "Analyze this image in detail. Describe what you see, identify any objects, and note any text visible.",
      );
      return { description: text, objects: [], text: "" };
    },
    [callVision],
  );

  const detectObjects = useCallback(
    async (file: File) => {
      const text = await callVision(
        file,
        "List all objects you can detect in this image. Format as a comma-separated list, then provide a brief description.",
      );
      const parts = text.split("\n");
      const firstLine = parts[0] || "";
      const objects = firstLine
        .split(",")
        .map((s: string) => s.trim())
        .filter(Boolean);
      return { description: parts.slice(1).join("\n"), objects, text: "" };
    },
    [callVision],
  );

  const extractText = useCallback(
    async (file: File) => {
      const text = await callVision(
        file,
        "Extract all visible text from this image. Return only the text content you can read.",
      );
      return { description: "", objects: [], text };
    },
    [callVision],
  );

  const describeScene = useCallback(
    async (file: File) => {
      const text = await callVision(
        file,
        "Provide a detailed description of this scene. What is happening? What are the key elements? What is the context or setting?",
      );
      return { description: text, objects: [], text: "" };
    },
    [callVision],
  );

  return {
    loading,
    error,
    analyzeImage,
    detectObjects,
    extractText,
    describeScene,
  };
}
