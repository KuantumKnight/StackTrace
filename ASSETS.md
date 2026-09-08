# StackTrace UI assets

This file records third-party design assets used by the frontend.

## Typography

Loaded from Google Fonts with `display=swap` in `index.html`:

- **Inter** — primary interface sans-serif
  - https://fonts.google.com/specimen/Inter
- **Instrument Serif** — editorial display face for major headings
  - https://fonts.google.com/specimen/Instrument+Serif
- **JetBrains Mono** — machine state, grammar, code, and telemetry accents
  - https://fonts.google.com/specimen/JetBrains+Mono

The CSS includes system fallbacks so the interface remains usable if remote font loading fails.

## Icons

The small interface icon set in `src/components/LucideIcons.tsx` is based on Lucide SVG sources:

- Search
- Moon
- Sun
- Arrow Up
- Command
- Layers

Source: https://lucide.dev/
Repository: https://github.com/lucide-icons/lucide
License: ISC

Icons are stored as local React SVG components so the application does not require a runtime icon CDN.

## Texture and decorative effects

No external photography, stock texture, or video is required by the core debugger. Grain, grid, glow, glass, and atmospheric depth are generated with CSS/SVG filters in the application styles. This avoids adding large media payloads or unnecessary licensing dependencies to a formal-language learning tool.
