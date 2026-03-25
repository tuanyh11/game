import { defineConfig } from 'vite';

export default defineConfig({
    base: './', // Relative paths — required for CrazyGames hosting
    esbuild: {
        // @ts-ignore: 'drop' is supported by esbuild but may not be in Vite's type definitions
        drop: ['console', 'debugger'],
    },
});
