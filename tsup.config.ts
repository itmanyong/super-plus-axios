import { defineConfig } from 'tsup'

export default defineConfig(() => {
  return {
    entry: {
      index: `src/index.ts`,
      react: `src/frame/react/index.ts`,
      vue: `src/frame/vue/index.ts`
    },
    format: ['cjs', 'esm', 'iife'],
    outDir: 'dist',
    dts: true,
    clean: true,
    splitting: false,
    sourcemap: false,
    minify: false,
    shims: false,
    legacyOutput: false
  }
})

