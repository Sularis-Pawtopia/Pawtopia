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
          DEFAULT: '#FF6B6B',
          50: '#FFF5F5',
          100: '#FFE5E5',
          200: '#FFCCCC',
          300: '#FFB3B3',
          400: '#FF8A8A',
          500: '#FF6B6B',
          600: '#FF4848',
          700: '#FF2525',
          800: '#E60000',
          900: '#B30000',
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
