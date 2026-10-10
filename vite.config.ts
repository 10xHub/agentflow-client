import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'TenxGraphClient',
      formats: ['es', 'cjs'],
      fileName: (format) => `index.${format === 'es' ? 'js' : 'cjs'}`,
    },
    outDir: 'dist',
    // `npm run clean` wipes dist before the build. Vite must not empty it again,
    // or it would delete the declarations tsc emits in the preceding step.
    emptyOutDir: false,
    sourcemap: true,
  },
});
