import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#FF9300',
          50: '#FFF7E6',
          100: '#FFEBC0',
          200: '#FFDC99',
          300: '#FFCD73',
          400: '#FFBE4D',
          500: '#FF9300',
          600: '#E6850D',
          700: '#CC7700',
          800: '#B36900',
          900: '#995C00',
        },
        secondary: {
          DEFAULT: '#4ECDC4',
          50: '#F0FFFE',
          100: '#D4F8F5',
          200: '#A8F1EB',
          300: '#7DEAE1',
          400: '#51E3D7',
          500: '#4ECDC4',
          600: '#3CAAA3',
          700: '#2D7F7A',
          800: '#1E5451',
          900: '#0F2A28',
        },
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
    },
  },
  plugins: [require('tailwind-scrollbar')],
};

export default config;
