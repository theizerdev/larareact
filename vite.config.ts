import inertia from '@inertiajs/vite';
import { wayfinder } from '@laravel/vite-plugin-wayfinder';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { bunny } from 'laravel-vite-plugin/fonts';
import { defineConfig } from 'vite';

export default defineConfig({
    define: {
        __dirname: '""',
    },
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            ssr: 'resources/js/ssr.tsx',
            refresh: true,
            fonts: [
                bunny('Instrument Sans', {
                    weights: [400, 500, 600],
                }),
            ],
        }),
        inertia(),
        react({
            babel: {
                plugins: ['babel-plugin-react-compiler'],
            },
        }),
        tailwindcss(),
        wayfinder({
            formVariants: true,
        }),
        VitePWA({
            registerType: 'autoUpdate',
            // Usamos el manifest manual en /public/pwa/manifest.json
            manifest: false,
            includeAssets: ['icons/*.png', 'image/logo/**'],
            workbox: {
                // Solo cachear assets estáticos; las requests API siguen al servidor
                globPatterns: ['**/*.{js,css,html}'],
                maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
                runtimeCaching: [
                    {
                        urlPattern: /^\/icons\//,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'kiosko-icons',
                            expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 30 },
                        },
                    },
                    {
                        urlPattern: /^\/image\//,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'kiosko-images',
                            expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 7 },
                        },
                    },
                ],
                navigateFallback: null,
                maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
            },
        }),
    ],
    server: {
        watch: {
            usePolling: true,
            interval: 100, // Revisa cambios cada 100ms (más sensible para Windows)
            ignored: ['**/storage/**', '**/public/storage/**'],
        },
    },
});