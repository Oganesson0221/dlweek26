import axios from "axios";

export const apiClient = axios.create({
  baseURL:
    import.meta.env.MODE === "development"
      ? "https://coursepilot-qyw8.onrender.com"
      : import.meta.env.VITE_API_BASE_URL,
  timeout: 30000,
});

apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg =
      err?.response?.data?.detail ||
      err?.response?.data?.error ||
      err.message ||
      "API error";
    return Promise.reject(new Error(msg));
  },
);
