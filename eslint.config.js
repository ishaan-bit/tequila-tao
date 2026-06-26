import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // `android/` holds the Capacitor native project; `cap sync` copies the built
  // web bundle into android/app/src/main/assets — those are generated artifacts,
  // never lint them (they were turning `npm run lint` red with hundreds of
  // false positives from minified vendor code).
  // `ops-console/` is a separate Vercel sub-project with its own toolchain/lint.
  // The FCM service worker runs in a worker context (importScripts, the firebase
  // compat global) that this browser-module config can't resolve.
  globalIgnores(['dist', 'public/sw.js', 'public/firebase-messaging-sw.js', 'android', 'coverage', 'ops-console']),
  {
    files: ['**/*.{js,jsx}'],
    plugins: { react },
    extends: [
      js.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      // Count identifiers used only as JSX element names (e.g. <motion.div>).
      'react/jsx-uses-vars': 'error',
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]', argsIgnorePattern: '^_' }],
      // Dev-only HMR nicety (co-located helper + component); never a prod issue.
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
])
