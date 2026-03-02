import { useState, useEffect, useCallback } from "react";

const API_KEY_STORAGE = "openai_api_key";
const ORG_ID_STORAGE = "openai_org_id";

export function useApiKeys() {
  const [apiKey, setApiKeyState] = useState<string>(() => {
    return localStorage.getItem(API_KEY_STORAGE) || "";
  });
  const [orgId, setOrgIdState] = useState<string>(() => {
    return localStorage.getItem(ORG_ID_STORAGE) || "";
  });

  const setApiKey = useCallback((key: string) => {
    localStorage.setItem(API_KEY_STORAGE, key);
    setApiKeyState(key);
  }, []);

  const setOrgId = useCallback((id: string) => {
    localStorage.setItem(ORG_ID_STORAGE, id);
    setOrgIdState(id);
  }, []);

  const clearKeys = useCallback(() => {
    localStorage.removeItem(API_KEY_STORAGE);
    localStorage.removeItem(ORG_ID_STORAGE);
    setApiKeyState("");
    setOrgIdState("");
  }, []);

  const hasKeys = Boolean(apiKey);

  return { apiKey, orgId, setApiKey, setOrgId, clearKeys, hasKeys };
}
