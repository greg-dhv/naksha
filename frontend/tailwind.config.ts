import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg:       'var(--clr-bg)',
        raised:   'var(--clr-bg-raised)',
        text:     'var(--clr-text)',
        't2':     'var(--clr-text-2)',
        't3':     'var(--clr-text-3)',
        accent:   'var(--clr-accent)',
        border:   'var(--clr-border)',
      },
      fontFamily: {
        display: ['var(--font-display)', 'Cormorant Garamond', 'Georgia', 'serif'],
        label:   ['system-ui', '-apple-system', 'sans-serif'],
      },
      fontSize: {
        'display': 'var(--text-display)',
        'h1': 'var(--text-h1)',
        'h2': 'var(--text-h2)',
        'h3': 'var(--text-h3)',
        'body': 'var(--text-body)',
        'sm':  'var(--text-sm)',
        'xs':  'var(--text-xs)',
        'label': 'var(--text-label)',
      },
      letterSpacing: {
        wide:  'var(--tracking-wide)',
        wider: 'var(--tracking-wider)',
        caps:  'var(--tracking-caps)',
      },
    },
  },
  plugins: [],
}

export default config
