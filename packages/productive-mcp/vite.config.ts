import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        server: resolve(__dirname, 'src/server.ts'),
        auth: resolve(__dirname, 'src/auth.ts'),
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
        '@studiometa/productive-cli',
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
