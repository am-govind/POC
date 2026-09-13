/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: '#0a0a0f', light: '#1a1520', card: '#14121c' },
        gold: { DEFAULT: '#d4a574', bright: '#c9a227', dim: '#8b7355' },
        amber: { glow: '#ff9f00' },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'grain': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E\")",
      },
      boxShadow: {
        glow: '0 0 30px rgba(212, 165, 116, 0.25)',
        'glow-lg': '0 0 60px rgba(212, 165, 116, 0.35)',
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
};
