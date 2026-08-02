/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // legacy aliases (kept for anything not yet migrated)
        bg: '#16181c',
        panel2: '#1e1f23',
        border2: '#3a3f42',
        accentDim: '#1a8cd8',
        error: '#f4212e',

        // NativelyAI palette (superset)
        background: '#16181c',
        panel: '#1e1f23',
        surface: '#26282d',
        'surface-hover': '#2d3036',
        foreground: '#e7e9ea',
        muted: '#71767b',
        accent: '#1d9bf0',
        'accent-hover': '#1a8cd8',
        'accent-soft': 'rgba(29, 155, 240, 0.15)',
        border: '#2f3336',
        destructive: '#f4212e',
        success: '#22c55e',
        warning: '#ffd400',
        primary: '#1d9bf0',
        'on-primary': '#ffffff',
        secondary: '#8b98a5',
        ring: '#1d9bf0',
      },
      fontFamily: {
        sans: ['Inter', 'Plus Jakarta Sans', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        bubble: '18px',
        xl: '1rem',
        '2xl': '1.25rem',
      },
    },
  },
  plugins: [],
};
