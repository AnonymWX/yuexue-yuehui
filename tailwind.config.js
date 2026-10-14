/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: ['./src/**/*.{js,jsx,ts,tsx}', './index.html'],
  theme: {
    extend: {
      colors: {
        // 主色单值别名
        primary: 'rgb(var(--primary-500) / <alpha-value>)',
        // ★ 关键：把 indigo 色阶映射到 CSS 变量
        // 全项目所有 bg-indigo-500 / text-indigo-600 / border-indigo-300 自动跟随主题
        indigo: {
          50: 'rgb(var(--primary-50) / <alpha-value>)',
          100: 'rgb(var(--primary-100) / <alpha-value>)',
          200: 'rgb(var(--primary-200) / <alpha-value>)',
          300: 'rgb(var(--primary-300) / <alpha-value>)',
          400: 'rgb(var(--primary-400) / <alpha-value>)',
          500: 'rgb(var(--primary-500) / <alpha-value>)',
          600: 'rgb(var(--primary-600) / <alpha-value>)',
          700: 'rgb(var(--primary-700) / <alpha-value>)',
          800: 'rgb(var(--primary-800) / <alpha-value>)',
          900: 'rgb(var(--primary-900) / <alpha-value>)',
          950: 'rgb(var(--primary-950) / <alpha-value>)',
        },
        // 页面背景 / 淡边框（主题变量）
        page: 'rgb(var(--page-bg) / <alpha-value>)',
        subtle: 'rgb(var(--subtle-border) / <alpha-value>)',
        // Duolingo 辅助色（保留原样）
        duo: {
          green: '#76924E',
          greenDark: '#5E7A3E',
          blue: '#5B8AA6',
          blueDark: '#46708A',
          red: '#C96A6A',
          redDark: '#A95252',
          orange: '#D08A4A',
          yellow: '#D9B85A',
          purple: '#9B7FB5',
          border: '#E8E2D4',
          grayText: '#9A9384',
        },
      },
      boxShadow: {
        'btn-green': '0 4px 0 0 #5E7A3E',
        'btn-blue': '0 4px 0 0 #46708A',
        'btn-red': '0 4px 0 0 #A95252',
        'btn-white': '0 4px 0 0 #E8E2D4',
      },
      keyframes: {
        'accordion-down': {
          from: { height: 0 },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: 0 },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
      transitionDuration: {
        0: '0ms',
      },
      padding: {
        0.8: '0.2rem',
      },
      width: {
        3.5: '0.875rem',
        5.5: '1.375rem',
        15: '3.75rem',
        18: '4.5rem',
        70: '17.5rem',
        75: '18.75rem',
        84: '21rem',
        85: '21.25rem',
        100: '25rem',
        116: '29rem',
        150: '37.5rem',
        160: '40rem',
        200: '50rem',
      },
      height: {
        3.5: '0.875rem',
        5.5: '1.375rem',
        15: '3.75rem',
        18: '4.5rem',
        22: '5.5rem',
        112: '28rem',
        120: '30rem',
        152: '38rem',
      },
      borderWidth: {
        3: '3px',
      },
      screens: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1536px',
        dic3: '1100px',
        dic4: '1440px',
      },
    },
  },
  variants: {
    extend: {
      visibility: ['hover', 'group-hover'],
      textOpacity: ['dark'],
      backgroundOpacity: ['dark'],
    },
  },
  plugins: [require('@headlessui/tailwindcss'), require('@tailwindcss/forms'), require('tailwindcss-animate')],
}
