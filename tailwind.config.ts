import type {Config} from 'tailwindcss';

const sharedTheme = require('./tailwind.theme.cjs');

export default {
  darkMode: ['class'],
  content: [
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './packages/shared-ui/src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: sharedTheme,
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;
