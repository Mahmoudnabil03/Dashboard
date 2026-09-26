/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0A5BFF',
          hover: '#1e6fff',
          muted: '#0A5BFF1A',
        },
        secondary: '#7c3aed',
        accent: '#06b6d4',
        success: '#22c55e',
        warning: '#f59e0b',
        error: '#ef4444',
        bg: {
          base: '#020617',
          elevated: '#0f172a',
          'elevated-hover': '#1e293b',
          card: '#0f172a',
          input: '#0f172a',
          'input-focus': '#1e293b',
        },
        border: {
          subtle: '#1e293b',
          DEFAULT: '#334155',
          strong: '#475569',
          focus: '#0A5BFF',
        },
        text: {
          primary: '#f1f5f9',
          secondary: '#94a3b8',
          tertiary: '#64748b',
          inverse: '#020617',
          link: '#60a5fa',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        'glow': '0 0 24px rgba(10, 91, 255, 0.2)',
        'glow-lg': '0 0 48px rgba(10, 91, 255, 0.15)',
      },
      typography: (theme) => ({
        invert: {
          css: {
            '--tw-prose-body': theme('colors.text.secondary'),
            '--tw-prose-headings': theme('colors.text.primary'),
            '--tw-prose-lead': theme('colors.text.secondary'),
            '--tw-prose-links': theme('colors.primary.DEFAULT'),
            '--tw-prose-bold': theme('colors.text.primary'),
            '--tw-prose-counters': theme('colors.text.tertiary'),
            '--tw-prose-bullets': theme('colors.border.DEFAULT'),
            '--tw-prose-hr': theme('colors.border.subtle'),
            '--tw-prose-quotes': theme('colors.text.primary'),
            '--tw-prose-quote-borders': theme('colors.primary.DEFAULT'),
            '--tw-prose-captions': theme('colors.text.tertiary'),
            '--tw-prose-code': theme('colors.accent'),
            '--tw-prose-pre-code': theme('colors.text.primary'),
            '--tw-prose-pre-bg': theme('colors.bg.elevated'),
            '--tw-prose-th-borders': theme('colors.border.subtle'),
            '--tw-prose-td-borders': theme('colors.border.subtle'),
            'code::before': { content: '""' },
            'code::after': { content: '""' },
          },
        },
      }),
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}