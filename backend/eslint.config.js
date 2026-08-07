import js from '@eslint/js';
import pluginImport from 'eslint-plugin-import-x';
import pluginN from 'eslint-plugin-n';
import globals from 'globals';

export default [
  // Layer 1: Global ignores
  {
    ignores: [
      'node_modules/**',
      'uploads/**',
      '*.log',
      'application.log',
      'src/database/migrations/**',
      'src/database/seeders/**',
    ],
  },

  // Layer 2: ESLint recommended base rules
  js.configs.recommended,
  pluginN.configs['flat/recommended'],

  // Layer 3: Config for ESM .js files
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node,
      },
    },
  },

  // Layer 4: Config for CommonJS .cjs files (migrations, seeders, database config)
  {
    files: ['**/*.cjs'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
      },
    },
  },

  // Layer 5: Custom rules for all files
  {
    files: ['**/*.js', '**/*.cjs'],
    rules: {
      'no-unused-vars': [
        'error',
        {
          vars: 'all',
          args: 'after-used',
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      'n/no-process-exit': 'warn',
    },
  },

  // Layer 6: ESLint config file is a dev-only file, allow devDependency imports
  {
    files: ['eslint.config.js'],
    rules: {
      'n/no-unpublished-import': 'off',
    },
  },

  // Layer 7: Import rules
  {
    files: ['**/*.js'],
    plugins: {
      import: pluginImport,
    },
    settings: {
      'import/resolver': {
        node: {
          extensions: ['.js'],
        },
      },
    },
    rules: {
      'import/no-duplicates': 'error',
      'import/first': 'error',
      'import/order': [
        'error',
        {
          groups: [
            'builtin', // node:fs, node:path
            'external', // fastify, sequelize, bcrypt
            'internal', // absolute internal paths
            'parent', // ../config/env.js
            'sibling', // ./userService.js
            'index', // ./index.js
          ],
          'newlines-between': 'always',
        },
      ],
    },
  },
];
