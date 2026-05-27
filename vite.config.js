import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import { bunny } from 'laravel-vite-plugin/fonts';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.jsx'],
            refresh: true,
            fonts: [
                bunny('Instrument Sans', {
                    weights: [400, 500, 600],
                }),
            ],
        }),
        tailwindcss(),
        react({ fastRefresh: false })
    ],
    server: {
        // Use alternative port if default 5173 is unavailable
        // Use a high-numbered port unlikely to be restricted
        port: 8000,
        watch: {
            ignored: ['**/storage/framework/views/**'],
        },
    },
});
