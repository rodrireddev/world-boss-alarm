import { defineConfig } from "vite"
import { resolve } from "node:path"
import { fileURLToPath } from "node:url"
import fs from "node:fs"

const rootDir = fileURLToPath(
  new URL(".", import.meta.url)
)

const logoPath = resolve(
  rootDir,
  "public/logo.png"
)

const logoBase64 =
  fs.readFileSync(logoPath).toString("base64")

export default defineConfig({
  publicDir: "public",

  define: {
    __LOGO_DATA_URL__: JSON.stringify(
      `data:image/png;base64,${logoBase64}`
    )
  },

  build: {
    outDir: "dist",
    emptyOutDir: true,

    rollupOptions: {
      input: {
        background: resolve(
          rootDir,
          "src/background.ts"
        ),
        content: resolve(
          rootDir,
          "src/content.ts"
        )
      },

      output: {
        entryFileNames: "[name].js",
        assetFileNames: "[name].[ext]"
      }
    }
  }
})