// Do not move / rename this file, it works for IDE automatic setting.
// Lint the files included in each typescript project with common rules
const projects = ['./tsconfig.json'];
const tests = ['./tsconfig.spec.json'];

// Lint project using its tsconfig.json.
const lintProjects = () => {
  return [
    {
      extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:@typescript-eslint/recommended-requiring-type-checking',
        'prettier'
      ],
      env: {
        node: true
      },
      files: ['**/*.ts'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        tsconfigRootDir: __dirname,
        project: projects,
        ecmaVersion: 'latest',
        sourceType: 'module'
      },
      plugins: ['@typescript-eslint'],
      rules: {
        ...require('./.eslint-rules/eslint.rules.cjs'),
        ...require('./.eslint-rules/typescript-eslint.rules.cjs')
      }
    }
  ];
};

const lintTests = () => {
  return [
    {
      parser: '@typescript-eslint/parser',
      parserOptions: {
        tsconfigRootDir: __dirname,
        project: tests,
        ecmaVersion: 'latest',
        sourceType: 'module'
      },
      files: ['src/**/*.spec.ts'],
      rules: {
        ...require('./.eslint-rules/eslint.rules.cjs'),
        ...require('./.eslint-rules/eslint.test.rules.cjs'),
        ...require('./.eslint-rules/typescript-eslint.rules.cjs'),
        ...require('./.eslint-rules/typescript-eslint.test.rules.cjs')
      }
    }
  ];
};

module.exports = {
  root: true,
  overrides: [...lintProjects(), ...lintTests()]
};
