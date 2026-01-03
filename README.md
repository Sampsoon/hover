# Hover

Hover over code on any webpage to see documentation. Like your IDE, but everywhere.

Works on documentation sites and AI chat apps like ChatGPT and Claude.

<p align="center">
  <img src="docs/demo0.gif" alt="Demo">
</p>

<p align="center">
  <img src="docs/demo1.gif" alt="Demo 2">
</p>

---

## Setup

**Note:** This extension is coming to the chrome web store soon and will be linked here when available.

### 1. Build the extension

```bash
bun install && bun run build
```

### 2. Load in Chrome

Navigate to `chrome://extensions` → Enable **Developer Mode** → **Load Unpacked** → Select the `dist_chrome` folder

### 3. Configure API

Click the extension icon, go to **Settings**, and add your [OpenRouter](https://openrouter.ai) API key or configure a custom OpenAI client compatible endpoint.

#### OpenRouter

<img src="docs/openrouter-settings.png" alt="OpenRouter Settings">

#### Custom Endpoint

<img src="docs/custom-endpoint-settings.png" alt="Custom Endpoint Settings">

### 4. Configure websites

Set which websites the extension runs on using URL patterns (e.g. `*://*.github.com/*`).

<img src="docs/website-settings.png" alt="Website Settings">

---

## Development

```bash
bun run dev      # Dev server
bun run build    # Production build and lint
bun run lint     # Lint
bun run format   # Format
bun run package  # Build and create hover-extension.zip for Chrome Web Store
```

Optional: Create `.env` to bundle an API key into dev builds:

```
VITE_OPEN_ROUTER_API_KEY=your-key
```

## Testing

See [scripts/README.md](scripts/README.md) for evaluation tools.

## Known Issues & Future Improvements

See [TASKS.md](TASKS.md) for a list of known issues and planned improvements.

## Privacy

See [PRIVACY.md](PRIVACY.md) for details on data handling.

## License

MIT
