/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'gowun': ['Gowun Dodum', 'sans-serif'],
        'jua': ['Jua', 'sans-serif'],
        'gamja': ['Gamja Flower', 'sans-serif'],
      },
      keyframes: {
        'mascot-wiggle': {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        'drift': {
          '0%': { transform: 'translate(0px, 0px)' },
          '25%': { transform: 'translate(30px, -20px)' },
          '50%': { transform: 'translate(-20px, -40px)' },
          '75%': { transform: 'translate(-30px, 20px)' },
          '100%': { transform: 'translate(0px, 0px)' },
        },
        'drift-reverse': {
          '0%': { transform: 'translate(0px, 0px)' },
          '25%': { transform: 'translate(-30px, 20px)' },
          '50%': { transform: 'translate(20px, 40px)' },
          '75%': { transform: 'translate(30px, -20px)' },
          '100%': { transform: 'translate(0px, 0px)' },
        }
      },
      animation: {
        'mascot-wiggle': 'mascot-wiggle 2s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'bounce-slow': 'float 3s ease-in-out infinite',
        'drift': 'drift 15s ease-in-out infinite',
        'drift-reverse': 'drift-reverse 20s ease-in-out infinite',
      }
    },
  },
  plugins: [],
}