/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        flipkart: {
          blue: '#2874f0',
          'blue-dark': '#1c5fc7',
          yellow: '#ff9f00',
          bg: '#f1f3f6',
          text: '#212121',
          muted: '#878787',
          green: '#388e3c',
        },
      },
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px 0 rgba(0,0,0,.08)',
        header: '0 1px 4px 0 rgba(0,0,0,.1)',
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
};
