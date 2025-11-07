import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    publicDir: 'public',
    server: {
        port: 3001,
        host: 'localhost', // Explicitly bind to localhost only
        strictPort: true,
        hmr: {
            protocol: 'ws',
            host: 'localhost', // Don't allow network discovery
        },
    },
    preview: {
        port: 3001,
        host: 'localhost',
        strictPort: true,
    },
});

