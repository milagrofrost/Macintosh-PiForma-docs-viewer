import { marked } from "marked";
import "./styles.css";
import { getManifest, isTauriRuntime, readDocument, updateDocumentation } from "./content";
import { initializePlatform } from "./platform";
import { STACKS, type StackKind } from "./stacks";

type Card = { title: string; html: string };
type LoadedStack = (typeof STACKS)[number] & { cards: Card[] };

const AUTO_CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000;
const AUTO_CHECK_KEY = "piformaDocsLastAutomaticCheck";

const ICONS: Record<StackKind, string> = {
  computer: '<img src="data:image/png;base64,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" width="48" height="48" alt="" draggable="false">',
  "folder-hardware": '<svg viewBox="0 0 48 48"><rect x="6" y="14" width="36" height="24" fill="#d7c76f" stroke="#000"/><rect x="8" y="12" width="14" height="5" fill="#d7c76f" stroke="#000"/><rect x="10" y="20" width="10" height="10" fill="#8c9bad" stroke="#000"/></svg>',
  "folder-software": '<svg viewBox="0 0 48 48"><rect x="6" y="14" width="36" height="24" fill="#d7c76f" stroke="#000"/><rect x="8" y="12" width="14" height="5" fill="#d7c76f" stroke="#000"/><rect x="10" y="19" width="17" height="12" fill="#f4f4f4" stroke="#000"/><rect x="12" y="21" width="12" height="2" fill="#6d8fe3"/></svg>',
  wiring: '<svg viewBox="0 0 48 48"><path d="M9 32 L18 17 L25 24 L33 10 L39 13 L30 29 L23 22 L15 36 Z" fill="#000"/></svg>',
  hammer: '<svg viewBox="0 0 48 48"><rect x="24" y="10" width="6" height="25" fill="#4a433e" stroke="#000" transform="rotate(35 27 22)"/><rect x="10" y="11" width="18" height="8" fill="#b4b4b4" stroke="#000" transform="rotate(-20 19 15)"/></svg>',
  toolbox: '<svg viewBox="0 0 48 48"><rect x="8" y="18" width="32" height="18" fill="#b85c58" stroke="#000"/><rect x="18" y="12" width="12" height="6" fill="#d8d8d8" stroke="#000"/></svg>',
  warning: '<svg viewBox="0 0 48 48"><polygon points="24,6 42,39 6,39" fill="#f4e57c" stroke="#000"/><rect x="22" y="16" width="4" height="12" fill="#000"/><rect x="22" y="31" width="4" height="4" fill="#000"/></svg>',
  "folder-projects": '<svg viewBox="0 0 48 48"><rect x="6" y="14" width="36" height="24" fill="#d7c76f" stroke="#000"/><rect x="8" y="12" width="14" height="5" fill="#d7c76f" stroke="#000"/><rect x="10" y="20" width="8" height="8" fill="#95a1ad" stroke="#000"/><rect x="20" y="20" width="8" height="8" fill="#b1c2d6" stroke="#000"/><rect x="30" y="20" width="8" height="8" fill="#95a1ad" stroke="#000"/></svg>'
};

const app = document.querySelector<HTMLElement>("#app");
if (!app) throw new Error("Missing #app");
app.innerHTML = `<main class="site-shell"><section class="window"><header class="titlebar"><button class="window-box close-box" aria-label="Close"></button><h1>Macintosh PiForma Guided Tour</h1><button class="window-box zoom-box" aria-label="Zoom" disabled></button></header><div class="window-body"><div class="toolbar"><button id="home">Home</button><button id="update">${isTauriRuntime() ? "Update Stack" : "Reload"}</button><select id="picker"><option>Choose a stack...</option></select></div><div class="content"><section id="home-view" class="home-view"><h2>Macintosh PiForma</h2><p>Select a stack to begin the guided tour.</p><div id="icon-grid" class="icon-grid"></div><div class="repo-line"><span id="status">Loading documentation...</span><span id="snapshot">Offline-ready snapshot</span></div></section><section id="card-view" class="card-view"><div id="card-scroll" class="card-scroll"></div><footer><button id="previous">◀ Previous</button><span id="counter">Card 0 of 0</span><button id="next">Next ▶</button></footer></section></div></div></section></main>`;
initializePlatform();

const $ = <T extends HTMLElement = HTMLElement>(id: string): T => { const node = document.getElementById(id); if (!node) throw new Error(`Missing ${id}`); return node as T; };
let stacks: LoadedStack[] = [];
let stackIndex = 0;
let cardIndex = 0;

function splitMarkdown(source: string, wanted?: string[]): { title: string; markdown: string }[] {
  const sections: { title: string; lines: string[] }[] = [];
  let current: { title: string; lines: string[] } | null = null;
  let inFence = false;
  for (const line of source.replace(/\r\n/g, "\n").split("\n")) {
    if (/^```/.test(line.trim())) inFence = !inFence;
    const heading = !inFence ? line.match(/^(#{1,2})\s+(.+?)\s*$/) : null;
    if (heading) { if (current) sections.push(current); current = { title: heading[2].replace(/\s+#+$/, ""), lines: [line] }; }
    else { if (!current) current = { title: "Introduction", lines: ["# Introduction"] }; current.lines.push(line); }
  }
  if (current) sections.push(current);
  const filtered = wanted?.length ? sections.filter((section) => wanted.some((name) => name.toLowerCase() === section.title.toLowerCase())) : sections;
  return (filtered.length ? filtered : sections).map((section) => ({ title: section.title, markdown: section.lines.join("\n") }));
}

async function load(): Promise<void> {
  $("status").textContent = "Loading documentation...";
  const manifest = await getManifest();
  const results = await Promise.allSettled(STACKS.map(async (definition) => {
    const markdown = await readDocument(definition.file);
    const cards = await Promise.all(splitMarkdown(markdown, definition.sections).map(async (section) => ({ title: section.title, html: await marked.parse(section.markdown) })));
    return { ...definition, cards };
  }));
  stacks = results.map((result, index) => result.status === "fulfilled" ? result.value : { ...STACKS[index], cards: [{ title: "Unavailable", html: `<h1>Unavailable</h1><p>${STACKS[index].file} is not available.</p>` }] });
  $("status").textContent = manifest.source === "cache" ? "Cached documentation" : "Bundled documentation";
  const date = new Date(manifest.generatedAt).toLocaleDateString();
  const commit = manifest.commit ? ` • ${manifest.commit.slice(0, 7)}` : "";
  $("snapshot").textContent = `${manifest.source === "cache" ? "Updated" : "Snapshot"}: ${date}${commit}`;
  $("snapshot").title = manifest.commit ? `Documentation commit ${manifest.commit}` : "Bundled documentation snapshot";
  renderHome(); showHome();
}

function renderHome(): void {
  const grid = $("icon-grid"); grid.innerHTML = "";
  stacks.forEach((stack, index) => {
    const button = document.createElement("button"); button.className = "icon-button";
    button.innerHTML = `<span class="icon-art">${ICONS[stack.kind]}</span><span class="icon-label">${stack.title}</span>`;
    button.onclick = () => openStack(index, 0);
    grid.append(button);
  });
}

function showHome(): void { $("home-view").classList.remove("hidden"); $("card-view").classList.remove("active"); $("picker").innerHTML = "<option>Choose a stack...</option>"; }
function openStack(nextStack: number, nextCard: number): void {
  stackIndex = Math.max(0, Math.min(nextStack, stacks.length - 1)); const stack = stacks[stackIndex];
  cardIndex = Math.max(0, Math.min(nextCard, stack.cards.length - 1));
  $("home-view").classList.add("hidden"); $("card-view").classList.add("active");
  const picker = $("picker") as HTMLSelectElement; picker.innerHTML = stack.cards.map((card, index) => `<option value="${index}">${card.title}</option>`).join(""); picker.value = String(cardIndex);
  $("card-scroll").innerHTML = `<div class="stack-kicker">${stack.title} Stack</div>${stack.cards[cardIndex].html}`;
  $("counter").textContent = `Card ${cardIndex + 1} of ${stack.cards.length}`;
  ($("previous") as HTMLButtonElement).disabled = cardIndex === 0; ($("next") as HTMLButtonElement).disabled = cardIndex === stack.cards.length - 1;
}

async function runUpdate(manual: boolean): Promise<void> {
  const button = $("update") as HTMLButtonElement;
  button.disabled = true;
  $("status").textContent = manual ? "Checking for updates..." : "Automatic update check...";
  try {
    const result = await updateDocumentation();
    if (result?.updated) {
      await load();
      $("status").textContent = `Updated ${result.files} files`;
    } else {
      await load();
      $("status").textContent = "Documentation is current";
    }
  } catch (error) {
    $("status").textContent = manual ? `Update failed: ${String(error)}` : "Offline • using current documentation";
  } finally {
    button.disabled = false;
  }
}

async function automaticUpdateCheck(): Promise<void> {
  if (!isTauriRuntime()) return;
  const lastCheck = Number(localStorage.getItem(AUTO_CHECK_KEY) ?? "0");
  if (Number.isFinite(lastCheck) && Date.now() - lastCheck < AUTO_CHECK_INTERVAL_MS) return;
  localStorage.setItem(AUTO_CHECK_KEY, String(Date.now()));
  await runUpdate(false);
}

$("home").onclick = showHome;
$("update").onclick = async () => { if (!isTauriRuntime()) { await load(); return; } await runUpdate(true); };
$("previous").onclick = () => openStack(stackIndex, cardIndex - 1);
$("next").onclick = () => openStack(stackIndex, cardIndex + 1);
$("picker").onchange = (event) => openStack(stackIndex, Number((event.target as HTMLSelectElement).value));
window.onkeydown = (event) => { if (!$("card-view").classList.contains("active")) return; if (event.key === "ArrowLeft" && cardIndex > 0) openStack(stackIndex, cardIndex - 1); if (event.key === "ArrowRight" && cardIndex < stacks[stackIndex].cards.length - 1) openStack(stackIndex, cardIndex + 1); if (event.key === "Escape") showHome(); };

async function bootstrap(): Promise<void> {
  await load();
  await automaticUpdateCheck();
}

void bootstrap();