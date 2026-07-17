# Macintosh PiForma Docs Viewer

A browser-first, Mac OS 8/9 and HyperCard-inspired viewer for the Macintosh PiForma documentation. Phase one uses Vite, TypeScript, and a generated offline documentation snapshot. The same frontend is intended to become the UI for a Tauri 2 application on Raspberry Pi.

The editorial source of truth remains `milagrofrost/Macintosh-PiForma-docs`. The viewer never requires documentation text to be maintained twice.

## Current behavior

- Fixed application target of 656 by 420 pixels, centered on a neutral browser background.
- Finder-style home view with HyperCard-style stack navigation.
- Markdown, tables, code blocks, links, and repository images rendered from a generated snapshot.
- Relative Vite asset paths support Cloudflare Pages and subdirectory hosting.
- The snapshot builder keeps the last generated copy when GitHub is unavailable.

## Development

```bash
npm install
npm run dev
```

Open `http://127.0.0.1:1420/`.

## Build

```bash
npm run build
```

The build refreshes `public/docs/` from the documentation repository, type-checks the frontend, and writes the website to `dist/`.

Cloudflare Pages settings:

```text
Build command: npm run build
Output directory: dist
```

## Source layout

- `src/main.ts` owns viewer state, Markdown rendering, and navigation.
- `src/stacks.ts` maps documentation files and headings to stacks.
- `src/styles.css` contains the Platinum and HyperCard-inspired presentation.
- `scripts/build-docs-snapshot.mjs` generates the offline documentation snapshot.

## Planned next phase

- Add Tauri 2 and a thin Rust backend.
- Make the simulated title bar the native drag region.
- Package a movable, undecorated 656 by 420 Raspberry Pi application.
- Open external links through the system browser.
- Later add a writable documentation cache and manual Update Stack action.

## License

MIT
