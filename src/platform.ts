import { getCurrentWindow } from "@tauri-apps/api/window";
import { openUrl } from "@tauri-apps/plugin-opener";

const isTauriRuntime = (): boolean => "__TAURI_INTERNALS__" in window;

export function initializePlatform(): void {
  if (!isTauriRuntime()) return;

  document.documentElement.classList.add("tauri-runtime");
  const appWindow = getCurrentWindow();
  const titlebar = document.querySelector<HTMLElement>(".titlebar");
  const closeButton = document.querySelector<HTMLButtonElement>(".close-box");

  titlebar?.addEventListener("mousedown", (event) => {
    if (event.button !== 0 || (event.target as HTMLElement).closest("button")) return;
    void appWindow.startDragging();
  });

  closeButton?.addEventListener("click", () => {
    void appWindow.close();
  });

  document.addEventListener("click", (event) => {
    const anchor = (event.target as HTMLElement).closest<HTMLAnchorElement>("a[href]");
    if (!anchor) return;

    const url = new URL(anchor.href, window.location.href);
    if (!/^https?:$/.test(url.protocol)) return;

    event.preventDefault();
    void openUrl(url.href);
  });
}
