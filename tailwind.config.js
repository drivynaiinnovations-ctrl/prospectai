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
        green:   'var(--green)',
        amber:   'var(--amber)',
        blue:    'var(--blue)',
        red:     'var(--red)',
      },
      fontFamily: {
        display: ['system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
