/** @type {import('tailwindcss').Config} */
const v = (name) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    screens: { sm: '640px', md: '768px', lg: '992px', xl: '1280px', '2xl': '1440px' },
    extend: {
      colors: {
        brand: { 50: v('brand-50'), 100: v('brand-100'), 200: v('brand-200'), 300: v('brand-300'), 400: v('brand-400'), 500: v('brand-500'), 600: v('brand-600'), 700: v('brand-700'), 800: v('brand-800'), 900: v('brand-900') },
        mint: { 50: v('mint-50'), 100: v('mint-100'), 200: v('mint-200'), 300: v('mint-300') },
        night: { DEFAULT: v('night'), 700: v('night-700'), 600: v('night-600') },
        gold: { 50: v('gold-50'), 100: v('gold-100'), 500: v('gold-500'), 700: v('gold-700') },
        ink: { DEFAULT: v('ink'), soft: v('ink-soft'), muted: v('ink-muted'), faint: v('ink-faint') },
        line: { DEFAULT: v('line'), strong: v('line-strong') },
        canvas: v('canvas'),
        surface: { DEFAULT: v('surface'), sunken: v('surface-sunken') },
        danger: { 50: v('danger-50'), DEFAULT: v('danger'), 700: v('danger-700') },
        warning: { 50: v('warning-50'), DEFAULT: v('warning') },
        lavender: { 50: v('lavender-50'), DEFAULT: v('lavender') },
        violet: { 50: v('violet-50'), DEFAULT: v('violet') },
        orange: { 50: v('orange-50'), DEFAULT: v('orange') },
      },
      fontFamily: {
        sans: ['Inter', 'Helvetica Neue', 'Arial', 'sans-serif'],
        display: ['Nunito', 'Inter', 'sans-serif'],
      },
      fontSize: {
        meta: ['12px', { lineHeight: '16px' }],
        body: ['14px', { lineHeight: '21px' }],
      },
      borderRadius: { sm: '8px', md: '12px', lg: '16px', xl: '20px', '2xl': '24px', '3xl': '28px' },
      boxShadow: {
        xs: '0 1px 2px rgb(16 40 36 / 0.05)',
        sm: '0 1px 3px rgb(16 40 36 / 0.06), 0 1px 2px rgb(16 40 36 / 0.04)',
        md: '0 6px 20px -4px rgb(16 40 36 / 0.12), 0 2px 6px rgb(16 40 36 / 0.05)',
        lg: '0 18px 48px -12px rgb(16 40 36 / 0.22), 0 4px 12px rgb(16 40 36 / 0.06)',
        glow: '0 10px 30px -8px rgb(14 140 126 / 0.55)',
      },
      spacing: { 18: '72px', header: '64px' },
      keyframes: {
        shimmer: { '100%': { transform: 'translateX(100%)' } },
        'fade-in': { from: { opacity: 0 }, to: { opacity: 1 } },
        'pop-in': { from: { opacity: 0, transform: 'translateY(6px) scale(.98)' }, to: { opacity: 1, transform: 'none' } },
        'slide-up': { from: { opacity: 0, transform: 'translateY(24px)' }, to: { opacity: 1, transform: 'none' } },
        'slide-left': { from: { transform: 'translateX(-100%)' }, to: { transform: 'none' } },
        'slide-right': { from: { transform: 'translateX(100%)' }, to: { transform: 'none' } },
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-8px)' } },
        'like-pop': { '0%': { transform: 'scale(1)' }, '40%': { transform: 'scale(1.35)' }, '100%': { transform: 'scale(1)' } },
      },
      animation: {
        shimmer: 'shimmer 1.4s infinite',
        'fade-in': 'fade-in .18s ease-out',
        'pop-in': 'pop-in .2s cubic-bezier(.2,.8,.2,1)',
        'slide-up': 'slide-up .28s cubic-bezier(.2,.8,.2,1)',
        'slide-left': 'slide-left .28s cubic-bezier(.2,.8,.2,1)',
        'slide-right': 'slide-right .28s cubic-bezier(.2,.8,.2,1)',
        float: 'float 6s ease-in-out infinite',
        'like-pop': 'like-pop .35s ease-out',
      },
    },
  },
  plugins: [],
};
