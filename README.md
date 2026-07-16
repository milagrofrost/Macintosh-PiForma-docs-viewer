# Macintosh PiForma Docs Viewer

A retro Mac OS 8/9-style viewer for the Macintosh PiForma documentation.

The viewer fetches its content directly from:

- `milagrofrost/Macintosh-PiForma-docs`

This keeps the documentation repository as the single source of truth.

## Run locally

Because the viewer fetches Markdown from GitHub, serve it through a local web server rather than opening `index.html` directly.

```bash
python3 -m http.server 8080
```

Then open:

```text
http://localhost:8080
```

## Current structure

```text
.
├── index.html
├── README.md
├── LICENSE
└── .gitignore
```

## Planned direction

- Split HTML, CSS, JavaScript, and icons into separate source files
- Add offline caching
- Add Tauri and Rust integration
- Package as a native PiForma application
- Preserve the documentation repository as the content source

## License

MIT
