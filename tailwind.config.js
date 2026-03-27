// tailwind.config.js
module.exports = {
    content: ['./src/**/*.{js,jsx,ts,tsx}'],
    theme: {
        extend: {
            colors: {
                'aniverse-purple': '#6C5DD3',
                'aniverse-purple-light': '#8A7AFF',
                'aniverse-purple-dark': '#4A3DBF',
                'aniverse-cyan': '#01D1FF',
                'aniverse-cyan-dark': '#00A7CD',
            },
            animation: {
                'fadeIn': 'fadeIn 0.3s ease-in-out',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
            },
        },
    },
    plugins: [
        // Comentamos los plugins si siguen dando problemas
        // require('@tailwindcss/aspect-ratio'),
        // require('@tailwindcss/line-clamp'),
    ],
};