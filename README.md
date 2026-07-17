# Macintosh PiForma Docs Viewer

A browser and Tauri 2, Mac OS 8/9 and HyperCard-inspired viewer for the Macintosh PiForma documentation.

The editorial source of truth remains `milagrofrost/Macintosh-PiForma-docs`. Website and app builds include an offline snapshot. The Tauri app can also refresh its writable cache without rebuilding or reinstalling the application.

## Current behavior

- Fixed 656 by 420 pixel application target.
- Finder-style home view with HyperCard-style stack navigation.
- Charcoal is the primary interface and document font, with system fallbacks when it is not installed.
- Browser build centered on a neutral background.
- Undecorated movable Tauri window using the simulated title bar as its drag surface.
- External links open in a new tab on the website and in the system browser under Tauri.
- Cloudflare builds bundle a current static snapshot.
- The native **Update Stack** action compares the cached commit with `Macintosh-PiForma-docs`.
- The native app performs at most one automatic documentation check every 24 hours.
- Changed Markdown is downloaded into the user application-data directory and installed atomically.
- A failed or offline update leaves the previous cache intact.
- When no cache exists, the bundled snapshot is used.
- The status line identifies bundled or cached content, the snapshot date, and the short cached commit SHA.

## Browser development

```bash
npm install
npm run dev
```

Open `http://127.0.0.1:1420/`.

## Tauri development on Raspberry Pi or Debian Linux

```bash
sudo apt update
sudo apt install -y \
  build-essential curl wget file \
  libwebkit2gtk-4.1-dev libssl-dev libgtk-3-dev \
  libayatana-appindicator3-dev librsvg2-dev
```

Install Rust if needed, then run:

```bash
npm install
npm run dev:tauri
```

## Website build

```bash
npm run build
```

Cloudflare Pages settings:

```text
Build command: npm run build
Output directory: dist
```

## Debian package

```bash
npm run build:tauri
sudo apt install ./src-tauri/target/release/bundle/deb/*.deb
```

## Documentation update behavior

The native app stores refreshed documents under its Tauri application-data directory in `docs-cache/`. The cache includes a manifest containing the source repository, branch, commit SHA, and update timestamp.

On **Update Stack**:

1. Read the latest commit SHA for the docs repository.
2. Stop immediately when the cached SHA matches and all expected files exist.
3. Download all expected Markdown files into a temporary sibling directory.
4. Write the new manifest.
5. Rename the completed directory into place.
6. Restore the old cache if the final rename fails.

After the initial view loads, the Tauri app checks the timestamp of its last automatic attempt. When at least 24 hours have elapsed, it performs the same safe update operation. Offline failures are nonfatal and the current cached or bundled documentation stays visible. Manual **Update Stack** checks are always allowed.

The website does not write a local filesystem cache. Its Reload button reloads the snapshot produced by the Cloudflare build.

## Source layout

- `src/main.ts` owns viewer state, rendering, navigation, automatic checks, diagnostics, and Update Stack feedback.
- `src/content.ts` selects cached Tauri content or the bundled browser snapshot.
- `src/platform.ts` isolates native dragging, closing, and external-link behavior.
- `src/stacks.ts` maps documentation files and headings to stacks.
- `src-tauri/src/docs_cache.rs` owns cache status, safe reads, commit comparison, downloads, and atomic replacement.
- `scripts/build-docs-snapshot.mjs` generates the bundled offline snapshot.

## Deferred work

- Cloudflare deploy-hook automation from the documentation repository.
- Cache repository images referenced by the Markdown.
- User-editable refresh interval and expanded diagnostics.

## License

MIT
