import { marked } from "marked";
import "./styles.css";
import { STACKS, type StackKind } from "./stacks";

type Card = { title: string; html: string };
type LoadedStack = (typeof STACKS)[number] & { cards: Card[] };

const ICONS: Record<StackKind, string> = {
  computer: '<svg viewBox="0 0 48 48"><rect x="8" y="5" width="28" height="33" fill="#d9d2be" stroke="#000"/><rect x="12" y="9" width="20" height="18" fill="#95a1ad" stroke="#000"/><rect x="16" y="38" width="12" height="3" fill="#a7a094" stroke="#000"/></svg>',
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

app.innerHTML = `
<main class="site-shell">
  <section class="window">
    <header class="titlebar"><button class="window-box close-box"></button><h1>Macintosh PiForma Guided Tour</h1><button class="window-box zoom-box"></button></header>
    <div class="window-body">
      <div class="toolbar"><button id="home">Home</button><button id="reload">Reload</button><select id="picker"><option>Choose a stack...</option></select></div>
      <div class="content">
        <section id="home-view" class="home-view"><h2>Macintosh PiForma</h2><p>Select a stack to begin the guided tour.</p><div id="icon-grid" class="icon-grid"></div><div class="repo-line"><span id="status">Loading bundled documentation...</span><span id="snapshot">Offline-ready snapshot</span></div></section>
        <section id="card-view" class="card-view"><div id="card-scroll" class="card-scroll"></div><footer><button id="previous">◀ Previous</button><span id="counter">Card 0 of 0</span><button id="next">Next ▶</button></footer></section>
      </div>
    </div>
  </section>
</main>`;

const $ = <T extends HTMLElement = HTMLElement>(id: string): T => {
  const node = document.getElementById(id);
  if (!node) throw new Error(`Missing ${id}`);
  return node as T;
};

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
    if (heading) {
      if (current) sections.push(current);
      current = { title: heading[2].replace(/\s+#+$/, ""), lines: [line] };
    } else {
      if (!current) current = { title: "Introduction", lines: ["# Introduction"] };
      current.lines.push(line);
    }
  }
  if (current) sections.push(current);
  const filtered = wanted?.length ? sections.filter((section) => wanted.some((name) => name.toLowerCase() === section.title.toLowerCase())) : sections;
  return (filtered.length ? filtered : sections).map((section) => ({ title: section.title, markdown: section.lines.join("\n") }));
}

async function load(): Promise<void> {
  $("status").textContent = "Loading bundled documentation...";
  const manifest = await fetch("./docs/manifest.json").then((response) => response.json()) as { generatedAt: string };
  const results = await Promise.allSettled(STACKS.map(async (definition) => {
    const markdown = await fetch(`./docs/${definition.file}`).then((response) => {
      if (!response.ok) throw new Error(String(response.status));
      return response.text();
    });
    const cards = await Promise.all(splitMarkdown(markdown, definition.sections).map(async (section) => ({ title: section.title, html: await marked.parse(section.markdown) })));
    return { ...definition, cards };
  }));
  stacks = results.map((result, index) => result.status === "fulfilled" ? result.value : { ...STACKS[index], cards: [{ title: "Unavailable", html: `<h1>Unavailable</h1><p>${STACKS[index].file} is not in this snapshot.</p>` }] });
  $("status").textContent = "Bundled from Macintosh-PiForma-docs";
  $("snapshot").textContent = `Snapshot: ${new Date(manifest.generatedAt).toLocaleDateString()}`;
  renderHome();
  showHome();
}

function renderHome(): void {
  const grid = $("icon-grid");
  grid.innerHTML = "";
  stacks.forEach((stack, index) => {
    const button = document.createElement("button");
    button.className = "icon-button";
    button.innerHTML = `<span class="icon-art">${ICONS[stack.kind]}</span><span class="icon-label">${stack.title}</span>`;
    button.onclick = () => { grid.querySelectorAll("button").forEach((item) => item.classList.remove("selected")); button.classList.add("selected"); };
    button.ondblclick = () => openStack(index, 0);
    grid.append(button);
  });
}

function showHome(): void {
  $("home-view").classList.remove("hidden");
  $("card-view").classList.remove("active");
  $("picker").innerHTML = "<option>Choose a stack...</option>";
}

function openStack(nextStack: number, nextCard: number): void {
  stackIndex = Math.max(0, Math.min(nextStack, stacks.length - 1));
  const stack = stacks[stackIndex];
  cardIndex = Math.max(0, Math.min(nextCard, stack.cards.length - 1));
  $("home-view").classList.add("hidden");
  $("card-view").classList.add("active");
  const picker = $("picker") as HTMLSelectElement;
  picker.innerHTML = stack.cards.map((card, index) => `<option value="${index}">${card.title}</option>`).join("");
  picker.value = String(cardIndex);
  $("card-scroll").innerHTML = `<div class="stack-kicker">${stack.title} Stack</div>${stack.cards[cardIndex].html}`;
  $("counter").textContent = `Card ${cardIndex + 1} of ${stack.cards.length}`;
  ($("previous") as HTMLButtonElement).disabled = cardIndex === 0;
  ($("next") as HTMLButtonElement).disabled = cardIndex === stack.cards.length - 1;
}

$("home").onclick = showHome;
$("reload").onclick = () => void load();
$("previous").onclick = () => openStack(stackIndex, cardIndex - 1);
$("next").onclick = () => openStack(stackIndex, cardIndex + 1);
$("picker").onchange = (event) => openStack(stackIndex, Number((event.target as HTMLSelectElement).value));
window.onkeydown = (event) => {
  if (!$("card-view").classList.contains("active")) return;
  if (event.key === "ArrowLeft" && cardIndex > 0) openStack(stackIndex, cardIndex - 1);
  if (event.key === "ArrowRight" && cardIndex < stacks[stackIndex].cards.length - 1) openStack(stackIndex, cardIndex + 1);
  if (event.key === "Escape") showHome();
};

void load();
