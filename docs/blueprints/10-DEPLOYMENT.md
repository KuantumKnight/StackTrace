# Deployment Blueprint

## MVP hosting
Static Vite build on Vercel, Netlify, or GitHub Pages. No backend is required for the initial educational tool.

## Build
`npm run build` → `dist/`

## Environment
No secrets should be required for the offline-first MVP.

## Performance goals
- Initial JS bundle kept small by lazy-loading challenge/analysis modules.
- Simulation work moved to a Web Worker if large NPDA trees make the UI stall.
- Cap rendered execution-tree nodes and virtualize trace lists.

## Observability
Client-side error boundary; optional privacy-safe telemetry later. Never send student grammar/input content by default.
