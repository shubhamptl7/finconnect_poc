/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        // Display/headings — Geist for that distinctive, precise fintech feel
        display: ['Geist', 'IBM Plex Sans', 'system-ui', 'sans-serif'],
        // Body/UI — IBM Plex Sans, excellent financial data readability
        sans: ['IBM Plex Sans', 'system-ui', 'sans-serif'],
        // Numbers — tabular, monospaced financial amounts
        mono: ['IBM Plex Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        // Brand — Emerald/Teal green design system used in Loan Module
        brand: {
          50:  '#F0F9F7',
          100: '#DCEFEB',
          200: '#A7F3D0',
          300: '#6EE7B7',
          400: '#34D399',
          500: '#10B981',
          600: '#0F766E',  // Primary action — rich emerald/teal
          700: '#0B625C',  // Hover
          800: '#065F46',
          900: '#064E3B',
          950: '#022C22',
        },
        // Slate — page/surface/text (standard Tailwind slate kept)
        // Midnight — premium card dark background
        midnight: {
          DEFAULT: '#0B1220',
          soft:    '#111B2E',
          muted:   '#1A2640',
        },
        // Surface tokens
        surface: {
          0: '#FFFFFF',
          1: '#F8FAFB',
          2: '#F0F4F8',
        },
        // Semantic
        ink: {
          900: '#0B1220',
          700: '#1E2D40',
          600: '#445569',
          400: '#8B98A9',
          200: '#C8D2DC',
        },
      },
      fontSize: {
        // Display sizes for Geist headings
        'display-2xl': ['48px', { lineHeight: '1.1', letterSpacing: '-0.03em', fontWeight: '700' }],
        'display-xl':  ['40px', { lineHeight: '1.1', letterSpacing: '-0.025em', fontWeight: '700' }],
        'display-lg':  ['32px', { lineHeight: '1.15', letterSpacing: '-0.02em', fontWeight: '700' }],
        'display-md':  ['26px', { lineHeight: '1.2', letterSpacing: '-0.015em', fontWeight: '600' }],
        'display-sm':  ['22px', { lineHeight: '1.25', letterSpacing: '-0.01em', fontWeight: '600' }],
      },
      animation: {
        'fade-in':       'fadeIn 0.35s ease-out',
        'slide-up':      'slideUp 0.35s ease-out',
        'slide-down':    'slideDown 0.25s ease-out',
        'slide-in-right':'slideInRight 0.3s ease-out',
        'slide-in-left': 'slideInLeft 0.3s ease-out',
        'pulse-slow':    'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer':       'shimmer 1.6s linear infinite',
        'shimmer-sweep': 'shimmerSweep 3.5s ease-in-out infinite',
        'spin-slow':     'spin 8s linear infinite',
        'scale-in':      'scaleIn 0.2s ease-out',
        'progress':      'progress 2s ease-out forwards',
      },
      keyframes: {
        fadeIn:       { from: { opacity: '0' },                            to: { opacity: '1' } },
        slideUp:      { from: { opacity: '0', transform: 'translateY(12px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideDown:    { from: { opacity: '0', transform: 'translateY(-8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideInRight: { from: { opacity: '0', transform: 'translateX(16px)' }, to: { opacity: '1', transform: 'translateX(0)' } },
        slideInLeft:  { from: { opacity: '0', transform: 'translateX(-16px)' }, to: { opacity: '1', transform: 'translateX(0)' } },
        scaleIn:      { from: { opacity: '0', transform: 'scale(0.95)' }, to: { opacity: '1', transform: 'scale(1)' } },
        shimmer:      { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        shimmerSweep: { '0%': { left: '-80%' }, '60%, 100%': { left: '150%' } },
        progress:     { from: { width: '0%' }, to: { width: 'var(--progress-width, 100%)' } },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-mesh':   'linear-gradient(135deg, #0B1220 0%, #0F766E 50%, #0B1220 100%)',
        // Subtle arc motif — used in landing + auth only
        'arc-pattern':     'radial-gradient(ellipse at 20% 50%, rgba(15,118,110,0.08) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(16,185,129,0.06) 0%, transparent 50%)',
      },
      boxShadow: {
        // Elevation system — clean, not glowy
        'e0': 'none',
        'e1': '0 1px 2px rgba(11,18,32,0.05)',
        'e2': '0 1px 3px rgba(11,18,32,0.06), 0 4px 16px rgba(11,18,32,0.04)',
        'e3': '0 4px 8px rgba(11,18,32,0.06), 0 12px 32px rgba(11,18,32,0.08)',
        'e4': '0 8px 24px rgba(11,18,32,0.10), 0 24px 64px rgba(11,18,32,0.12)',
        // Focus ring — brand emerald/teal color
        'focus-brand': '0 0 0 3px rgba(15,118,110,0.18)',
        'focus-ring':  '0 0 0 2px #ffffff, 0 0 0 4px rgba(15,118,110,0.35)',
        // Glow — emerald/teal green
        'glow-brand':  '0 0 20px rgba(15,118,110,0.22)',
        'glow-success':'0 0 20px rgba(16,185,129,0.20)',
        // Legacy aliases (preserve backward compat)
        'card':        '0 1px 3px rgba(11,18,32,0.06), 0 4px 16px rgba(11,18,32,0.04)',
        'card-hover':  '0 4px 8px rgba(11,18,32,0.06), 0 12px 32px rgba(11,18,32,0.08)',
        'glow-blue':   '0 0 20px rgba(15,118,110,0.22)',
        'glow-green':  '0 0 20px rgba(16,185,129,0.20)',
        'depth-sm':    '0 1px 2px rgba(11,18,32,0.05)',
        'depth-md':    '0 4px 8px rgba(11,18,32,0.06), 0 12px 32px rgba(11,18,32,0.08)',
        'depth-lg':    '0 8px 24px rgba(11,18,32,0.10), 0 24px 64px rgba(11,18,32,0.12)',
        'premium':     '0 20px 60px rgba(11,18,32,0.4), 0 4px 16px rgba(15,118,110,0.25), inset 0 1px 0 rgba(255,255,255,0.08)',
        'inner-light': 'inset 0 1px 0 rgba(255,255,255,0.10)',
      },
      borderRadius: {
        'xs': '4px',
        'sm': '6px',
        'DEFAULT': '8px',
        'md': '10px',
        'lg': '12px',
        'xl': '16px',
        '2xl': '20px',
        '3xl': '24px',
        '4xl': '32px',
        'full': '9999px',
      },
      spacing: {
        '18': '72px',
        '22': '88px',
        '72': '288px',
        '84': '336px',
        '96': '384px',
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
}
