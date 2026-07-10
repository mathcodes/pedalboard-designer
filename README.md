# Pedalboard Designer — Signal Chain Lab

An interactive pedalboard patch bay. Drag pedals from the locker onto a
snap-to-grid board, wire them up by tapping OUT → IN jacks, and trace the
signal path from guitar to amp with orthogonally-routed cables that never
cross a pedal's footprint.

## Local development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

Outputs a static site to `dist/`.

## Deploy to GitHub Pages

This repo includes a GitHub Actions workflow (`.github/workflows/deploy.yml`)
that builds and deploys automatically on every push to `main`.

One-time setup after pushing:

1. Go to the repo's **Settings → Pages**.
2. Under **Build and deployment → Source**, choose **GitHub Actions**.
3. Push to `main` (or re-run the workflow) — the site will publish to
   `https://<your-username>.github.io/pedalboard-designer/`.

If you rename the repo, update the `base` path in `vite.config.js` to match.

## Project structure

```
src/
  App.jsx              Main app: state, drag-and-drop, wire routing, rendering
  constants.js          Pedal types + grid layout constants
  index.css             Global styles
  components/
    JackButton.jsx
    Knob.jsx
    GuitarGlyph.jsx
```
