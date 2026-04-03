import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";


const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api/v1";
const SESSION_STORAGE_KEY = "fiscateste.session";

let accessToken: string | null = null;
let refreshToken: string | null = null;
let refreshRequest: Promise<string | null> | null = null;


export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json"
  }
});


export function setSession(tokens: { accessToken: string; refreshToken: string } | null) {
  accessToken = tokens?.accessToken ?? null;
  refreshToken = tokens?.refreshToken ?? null;

  if (tokens) {
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(tokens));
  } else {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  }
}


export function getStoredSession() {
  const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as { accessToken: string; refreshToken: string };
  } catch {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    return null;
  }
}


async function refreshSession(): Promise<string | null> {
  if (!refreshToken) {
    return null;
  }

  if (!refreshRequest) {
    refreshRequest = api
      .post(
        "/auth/refresh",
        { refresh_token: refreshToken },
        { headers: { Authorization: `Bearer ${refreshToken}` } }
      )
      .then((response) => {
        const tokens = {
          accessToken: response.data.access_token as string,
          refreshToken: response.data.refresh_token as string
        };
        setSession(tokens);
        return tokens.accessToken;
      })
      .catch(() => {
        setSession(null);
        return null;
      })
      .finally(() => {
        refreshRequest = null;
      });
  }

  return refreshRequest;
}


api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (accessToken) {
    config.headers.set("Authorization", `Bearer ${accessToken}`);
  }
  return config;
});


api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    if (error.response?.status !== 401 || !originalRequest || originalRequest._retry || originalRequest.url?.includes("/auth/refresh")) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;
    const nextAccessToken = await refreshSession();
    if (!nextAccessToken) {
      return Promise.reject(error);
    }

    originalRequest.headers.set("Authorization", `Bearer ${nextAccessToken}`);
    return api(originalRequest);
  }
);


const existingSession = getStoredSession();
if (existingSession) {
  setSession(existingSession);
}
