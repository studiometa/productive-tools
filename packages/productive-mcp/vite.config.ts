import { readFileSync } from 'fs';
import { resolve } from 'path';
import { defineConfig } from 'vite';

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));

export default defineConfig({
  define: {
    __VERSION__: JSON.stringify(pkg.version),
  },
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        server: resolve(__dirname, 'src/server.ts'),
        auth: resolve(__dirname, 'src/auth.ts'),
        crypto: resolve(__dirname, 'src/crypto.ts'),
        oauth: resolve(__dirname, 'src/oauth.ts'),
        tools: resolve(__dirname, 'src/tools.ts'),
        handlers: resolve(__dirname, 'src/handlers.ts'),
        stdio: resolve(__dirname, 'src/stdio.ts'),
        http: resolve(__dirname, 'src/http.ts'),
      },
      formats: ['es'],
      fileName: (_, entryName) => `${entryName}.js`,
    },
    rollupOptions: {
      external: [
        '@modelcontextprotocol/sdk',
        '@modelcontextprotocol/sdk/server/index.js',
        '@modelcontextprotocol/sdk/server/stdio.js',
        '@modelcontextprotocol/sdk/types.js',
        '@studiometa/productive-api',
        '@studiometa/productive-core',
        'h3',
        /^node:/,
      ],
    },
    target: 'node20',
    minify: false,
    sourcemap: true,
    outDir: 'dist',
  },
});
