// ESLint flat config (ESLint 9+).
//
// Purpose: catch extraction-leak bugs (no-undef) the moment they appear, so
// they never ship and never white-screen the app. The r33-r39 extraction
// passes leaked several monolith-only references into the extracted modules;
// AGENT-WORKFLOW.md now requires `npm run lint` green before any commit that
// touches app/src/components/.
//
// Vite-compatible: JSX, ESM, React 17+ automatic JSX transform.
import js from '@eslint/js';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

export default [
  {
    ignores: ['dist/**', 'preview-*/**', 'node_modules/**', '.vite/**'],
  },
  js.configs.recommended,
  {
    files: ['src/**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        // Vite build-time injected constants (see vite.config.js define block).
        __BUILD_TIME__: 'readonly',
        __BUILD_SHA__: 'readonly',
        __WORKFLOW_STATS__: 'readonly',
        __GOVERNANCE_QUEUE__: 'readonly',
        __DR_LEDGER__: 'readonly',
        __QUALITY_PROOF__: 'readonly',
        __CONFLICT_LOOP__: 'readonly',
        __UIUX_REVIEWS__: 'readonly',
      },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
    },
    settings: {
      react: { version: 'detect' },
    },
    rules: {
      // Core extraction-leak guard. The whole point of this config.
      'no-undef': 'error',

      // Surfaces dead imports + module-level constants left behind after
      // refactors (the inverse extraction-leak — definition stays in the
      // monolith after the reference moves). Tuned so destructured props
      // that the component declares but doesn't internally use are NOT
      // warned: those are contract documentation, not dead code. Likewise,
      // catch (e) without a use is intentional defensive code.
      'no-unused-vars': ['warn', {
        args: 'none',
        caughtErrors: 'none',
        vars: 'all',
        varsIgnorePattern: '^_',
        ignoreRestSiblings: true,
      }],

      // Empty catch blocks are an intentional defensive pattern in this
      // codebase (e.g., try { window.location.href = … } catch (e) {}).
      'no-empty': ['error', { allowEmptyCatch: true }],

      // React rules pruned to the ones that protect runtime behavior.
      'react/jsx-uses-react': 'error',
      'react/jsx-uses-vars': 'error',
      'react/jsx-no-undef': 'error',

      // React 17+ automatic JSX transform: React doesn't need to be in scope
      // for JSX. The repo still imports React explicitly for hooks, so that
      // import stays — this rule just disables the linter complaint.
      'react/react-in-jsx-scope': 'off',

      // Codebase doesn't use PropTypes; no value in nagging.
      'react/prop-types': 'off',

      // Lots of intentional apostrophes and ampersands in editorial copy.
      'react/no-unescaped-entities': 'off',

      // Hooks discipline — exhaustive-deps stays as warn so existing
      // useEffect calls that intentionally elide deps surface but don't
      // block. The rules-of-hooks check stays as error because violating
      // it is always a bug.
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
];
