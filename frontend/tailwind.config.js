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
        // Cyberpunk color scheme from reference image
        'cyber-dark': '#0a0e1a',
        'cyber-darker': '#050810',
        'cyber-cyan': '#00d9ff',
        'cyber-magenta': '#ff00ff',
        'cyber-purple': '#b026ff',
        'cyber-pink': '#ff0080',
        'cyber-blue': '#0080ff',
      },
      backgroundImage: {
        'grid-pattern': 'linear-gradient(to right, rgba(0, 217, 255, 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(0, 217, 255, 0.05) 1px, transparent 1px)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          'from': { boxShadow: '0 0 5px rgba(0, 217, 255, 0.5)' },
          'to': { boxShadow: '0 0 20px rgba(0, 217, 255, 0.8), 0 0 30px rgba(255, 0, 255, 0.4)' },
        },
      },
    },
  },
  plugins: [],
}
