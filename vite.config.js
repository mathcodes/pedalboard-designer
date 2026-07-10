import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Base path matches the GitHub Pages project URL: https://<user>.github.io/pedalboard-designer/
// Update this if you push to a differently-named repo.
export default defineConfig({
  plugins: [react()],
  base: "/pedalboard-designer/",
});
