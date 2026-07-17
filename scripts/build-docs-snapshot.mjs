import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

const repository = "milagrofrost/Macintosh-PiForma-docs";
const branch = "main";
const files = [
  "README.md",
  "docs/hardware.md",
  "docs/software.md",
  "docs/wiring.md",
  "docs/build-log.md",
  "docs/maintenance.md",
  "docs/known-issues.md",
  "docs/related-projects.md"
];
const outputRoot = new URL("../public/docs/", import.meta.url);

async function download(path) {
  const url = `https://raw.githubusercontent.com/${repository}/${branch}/${path}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
  return response.text();
}

await mkdir(outputRoot, { recursive: true });
let refreshed = 0;
for (const path of files) {
  const target = new URL(path, outputRoot);
  await mkdir(dirname(target.pathname), { recursive: true });
  try {
    await writeFile(target, await download(path), "utf8");
    refreshed += 1;
  } catch (error) {
    try {
      await readFile(target, "utf8");
      console.warn(`Using committed snapshot for ${path}: ${error.message}`);
    } catch {
      const title = path.split("/").pop().replace(/\.md$/, "");
      await writeFile(target, `# ${title}\n\nDocumentation snapshot unavailable during this build. Rebuild with network access to refresh this file.\n`, "utf8");
      console.warn(`Created fallback snapshot for ${path}: ${error.message}`);
    }
  }
}

await writeFile(new URL("manifest.json", outputRoot), `${JSON.stringify({ repository, branch, generatedAt: new Date().toISOString(), files }, null, 2)}\n`, "utf8");
console.log(`Documentation snapshot ready (${refreshed}/${files.length} refreshed).`);
