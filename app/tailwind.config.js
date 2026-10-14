/** @type {import('tailwindcss').Config} */
import { fixedScale } from './tailwind-fixed-scale.js';

// THE FRAME HOLDS WHILE THE WORDS GROW (DR-1011). The large-print control
// scales the document root, and Tailwind's spacing is rem, so padding, margins,
// gaps and radii used to balloon with the text. These scales are written in
// --ts-fixed ("one rem as it is at Normal", src/index.css), so they are
// pixel-identical at Normal and do not move at A44. Width/height stay on the
// root on purpose (tailwind-fixed-scale.js says why).
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    padding: ({ theme }) => fixedScale(theme('spacing')),
    margin: ({ theme }) => ({ auto: 'auto', ...fixedScale(theme('spacing')) }),
    gap: ({ theme }) => fixedScale(theme('spacing')),
    space: ({ theme }) => fixedScale(theme('spacing')),
    borderRadius: {
      none: '0px',
      sm: 'calc(0.125 * var(--ts-fixed, 1rem))',
      DEFAULT: 'calc(0.25 * var(--ts-fixed, 1rem))',
      md: 'calc(0.375 * var(--ts-fixed, 1rem))',
      lg: 'calc(0.5 * var(--ts-fixed, 1rem))',
      xl: 'calc(0.75 * var(--ts-fixed, 1rem))',
      '2xl': 'calc(1 * var(--ts-fixed, 1rem))',
      '3xl': 'calc(1.5 * var(--ts-fixed, 1rem))',
      full: '9999px',
    },
    extend: {},
  },
  plugins: [],
};
