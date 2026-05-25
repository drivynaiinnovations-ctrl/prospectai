/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg:      'var(--bg)',
        surface: 'var(--surface)',
        surface2:'var(--surface2)',
        border:  'var(--border)',
        text:    'var(--text)',
        text2:   'var(--text2)',
        text3:   'var(--text3)',
        accent:  'var(--accent)',
        accent2: 'var(--accent2)',
        green:   'var(--green)',
        amber:   'var(--amber)',
        blue:    'var(--blue)',
        red:     'var(--red)',
        sidebar: 'var(--sidebar)',
        sidebar2:'var(--sidebar2)',
      },
      fontFamily: {
        display: ['Lexend', 'system-ui', 'sans-serif'],
        sans:    ['Lexend', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 4px rgba(0,0,0,0.06)',
        'card-md': '0 2px 8px rgba(0,0,0,0.10)',
      },
    },
  },
  plugins: [],
}
