# Macintosh PiForma Docs Viewer

A browser and Tauri 2, Mac OS 8/9 and HyperCard-inspired viewer for the Macintosh PiForma documentation.

The editorial source of truth remains `milagrofrost/Macintosh-PiForma-docs`. Each build refreshes a bundled documentation snapshot, so the website and Raspberry Pi application work offline without maintaining documentation in two repositories.

## Current behavior

- Fixed application target of 656 by 420 pixels.
- Finder-style home view with HyperCard-style stack navigation.
- Markdown, tables, code blocks, links, and repository images rendered from a generated snapshot.
- Browser build centered on a neutral background.
- Tauri build uses an undecorated, movable native window with the simulated Mac title bar as its drag surface.
- External links open in a new browser tab on the website and in the system browser under Tauri.
- Relative Vite asset paths support Cloudflare Pages and subdirectory hosting.
- The snapshot builder keeps the last generated copy when GitHub is unavailable.

## Browser development

```bash
npm install
npm run dev
```

Open `http://127.0.0.1:1420/`.

## Tauri development on Raspberry Pi or Debian Linux

Install the normal Tauri and WebKitGTK build dependencies:

```bash
sudo apt update
sudo apt install -y \
  build-essential \
  curl \
  wget \
  file \
  libwebkit2gtk-4.1-dev \
  libssl-dev \
  libgtk-3-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev
```

Install Rust if needed:

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source "$HOME/.cargo/env"
```

Install JavaScript dependencies and run the native app:

```bash
npm install
npm run dev:tauri
```

## Website build

```bash
npm run build
```

The build refreshes `public/docs/` from the documentation repository, type-checks the frontend, and writes the website to `dist/`.

Cloudflare Pages settings:

```text
Build command: npm run build
Output directory: dist
```

## Debian package

```bash
npm run build:tauri
```

The Debian package is written under:

```text
src-tauri/target/release/bundle/deb/
```

Install it with:

```bash
sudo apt install ./src-tauri/target/release/bundle/deb/*.deb
```

## Source layout

- `src/main.ts` owns viewer state, Markdown rendering, and navigation.
- `src/platform.ts` isolates native Tauri dragging, closing, and external-link behavior from the browser build.
- `src/stacks.ts` maps documentation files and headings to stacks.
- `src/styles.css` contains the Platinum and HyperCard-inspired presentation for browser and native runtimes.
- `scripts/build-docs-snapshot.mjs` generates the offline documentation snapshot.
- `src-tauri/` contains the thin Rust shell, capability policy, native window configuration, and Debian bundle metadata.

## Next phase

- Add a writable documentation cache under the user's local application-data directory.
- Add an Update Stack action that compares the cached documentation commit with the repository.
- Keep the bundled snapshot as the final offline fallback.
- Add optional automatic update checks without rebuilding or reinstalling the application.

## License

MIT
