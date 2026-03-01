import { useState, useCallback } from "react";
import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

export function useApi<T>() {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const get = useCallback(async (url: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<T>(url);
      setData(response.data);
      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const post = useCallback(async (url: string, body: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post<T>(url, body);
      setData(response.data);
      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const uploadFile = useCallback(
    async (url: string, file: File, additionalData?: any) => {
      setLoading(true);
      setError(null);

      const formData = new FormData();
      formData.append("file", file);
      if (additionalData) {
        Object.keys(additionalData).forEach((key) => {
          formData.append(key, additionalData[key]);
        });
      }

      try {
        const response = await axios.post<T>(url, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        setData(response.data);
        return response.data;
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return { data, error, loading, get, post, uploadFile };
}

export function useAgentApi() {
  const { loading, error, post } = useApi<any>();

  const sendTask = useCallback(
    async (task: AgentTask) => {
      return post("/agent/task", task);
    },
    [post],
  );

  const getAgents = useCallback(async () => {
    return post("/agent/list", {});
  }, [post]);

  return { loading, error, sendTask, getAgents };
}

export function useVisionApi() {
  const { loading, error, uploadFile, post } = useApi<any>();

  const analyzeImage = useCallback(
    async (file: File, prompt?: string) => {
      return uploadFile("/vision/analyze", file, { prompt });
    },
    [uploadFile],
  );

  const detectObjects = useCallback(
    async (file: File) => {
      return uploadFile("/vision/detect", file);
    },
    [uploadFile],
  );

  const extractText = useCallback(
    async (file: File) => {
      return uploadFile("/vision/extract-text", file);
    },
    [uploadFile],
  );

  const describeScene = useCallback(
    async (file: File) => {
      return uploadFile("/vision/describe", file);
    },
    [uploadFile],
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
