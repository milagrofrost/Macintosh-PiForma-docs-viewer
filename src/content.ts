import { invoke } from "@tauri-apps/api/core";

export type DocsManifest = {
  generatedAt: string;
  source: "bundled" | "cache";
  commit?: string;
};

export type UpdateResult = {
  updated: boolean;
  commit: string;
  updatedAt: string;
  files: number;
};

type NativeStatus = {
  source: "bundled" | "cache";
  commit?: string;
  updatedAt?: string;
};

export const isTauriRuntime = (): boolean => "__TAURI_INTERNALS__" in window;

export async function getManifest(): Promise<DocsManifest> {
  if (isTauriRuntime()) {
    const status = await invoke<NativeStatus>("docs_status");
    if (status.source === "cache" && status.updatedAt) {
      return { generatedAt: status.updatedAt, source: "cache", commit: status.commit };
    }
  }

  const bundled = await fetch("./docs/manifest.json").then((response) => {
    if (!response.ok) throw new Error(`Bundled manifest: ${response.status}`);
    return response.json() as Promise<{ generatedAt: string }>;
  });
  return { generatedAt: bundled.generatedAt, source: "bundled" };
}

export async function readDocument(path: string): Promise<string> {
  if (isTauriRuntime()) {
    const cached = await invoke<string | null>("read_cached_document", { path });
    if (cached !== null) return cached;
  }

  return fetch(`./docs/${path}`).then((response) => {
    if (!response.ok) throw new Error(`${path}: ${response.status}`);
    return response.text();
  });
}

export async function updateDocumentation(): Promise<UpdateResult | null> {
  if (!isTauriRuntime()) return null;
  return invoke<UpdateResult>("update_docs");
}
