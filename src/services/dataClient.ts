import { cloudClient } from "./cloudClient";
import { localClient } from "./localClient";
import type { DataClient } from "./types";

export type DataMode = "auto" | "local" | "cloud";

const MODE_STORAGE_KEY = "tesla_data_mode";

function isTauriRuntime(): boolean {
  if (typeof window === "undefined") return false;
  const w = window as Window & {
    __TAURI__?: unknown;
    __TAURI_INTERNALS__?: unknown;
  };
  return Boolean(w.__TAURI__ || w.__TAURI_INTERNALS__);
}

function parseMode(raw: string | null | undefined): DataMode | null {
  const v = raw?.toLowerCase();
  if (v === "local" || v === "cloud" || v === "auto") return v;
  return null;
}

function getStoredMode(): DataMode | null {
  if (typeof window === "undefined") return null;
  return parseMode(window.localStorage.getItem(MODE_STORAGE_KEY));
}

function getEnvMode(): DataMode {
  const mode = parseMode(import.meta.env.VITE_DATA_MODE as string | undefined);
  return mode ?? "auto";
}

export function getCurrentDataMode(): DataMode {
  return getStoredMode() ?? getEnvMode();
}

export function setPreferredDataMode(mode: DataMode): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(MODE_STORAGE_KEY, mode);
}

export function clearPreferredDataMode(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(MODE_STORAGE_KEY);
}

function pickClient(mode: DataMode): DataClient {
  if (mode === "local") {
    if (!isTauriRuntime()) {
      throw new Error("当前不是 Tauri 运行环境，无法使用本地模式。请切换为云端模式。");
    }
    return localClient;
  }

  if (mode === "cloud") {
    return cloudClient;
  }

  return isTauriRuntime() ? localClient : cloudClient;
}

export function getDataClient(): DataClient {
  return pickClient(getCurrentDataMode());
}
