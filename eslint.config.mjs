import js from '@eslint/js';
import pluginVue from 'eslint-plugin-vue';
import globals from 'globals';

export default [
  {
    ignores: ['**/node_modules/**', '**/dist/**', '**/*.min.js'],
  },

  // Correctness-only Vue rules: the styling presets would demand a mass
  // reformat of working templates (attribute wrapping, self-closing tags…),
  // which we explicitly avoid.
  ...pluginVue.configs['flat/essential'],
  js.configs.recommended,

  {
    // Frontend (Vue 3 + Vite, ESM)
    files: ['client/src/**/*.{js,vue}', 'client/test/**/*.js', 'client/vite.config.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
      },
    },
  },

  {
    // Backend (Express, CommonJS)
    files: ['server/src/**/*.js', 'server/test/**/*.js', 'server/server.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
      },
    },
  },

  {
    rules: {
      // Keep linting about correctness, not style — the two halves of the
      // codebase use different (working) formatting conventions already.
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-console': 'off',
      'vue/multi-word-component-names': ['error', { ignores: ['App'] }],
    },
  },
];
