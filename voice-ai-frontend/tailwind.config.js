/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#f2f20d', // Neon Sarı
                    dim: '#caca0b',
                },
                background: {
                    light: '#f8f8f5',
                    dark: '#1a1a18', // Koyu Siyah/Gri
                    surface: '#262624',
                }
            },
            fontFamily: {
                display: ['"Space Grotesk"', 'sans-serif'],
                mono: ['"JetBrains Mono"', 'monospace'],
            },
            boxShadow: {
                'pixel': '-2px 0 0 0 white, 2px 0 0 0 white, 0 -2px 0 0 white, 0 2px 0 0 white',
                'pixel-primary': '-2px 0 0 0 #f2f20d, 2px 0 0 0 #f2f20d, 0 -2px 0 0 #f2f20d, 0 2px 0 0 #f2f20d',
            }
        },
    },
    plugins: [],
}