/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: '#0b0f1a',
        bg2: '#111827',
        bg3: '#1a2235',
        bg4: '#1e2a3a',
        text: '#e8edf5',
        text2: '#8b96a8',
        text3: '#5a6578',
        accent: '#2dd4bf',
        accent2: '#0891b2',
      },
      borderRadius: {
        DEFAULT: '10px',
        sm: '6px',
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}

