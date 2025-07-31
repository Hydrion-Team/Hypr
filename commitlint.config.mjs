export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'build',
        'chore',
        'ci',
        'docs',
        'feat',
        'fix',
        'perf',
        'refactor',
        'revert',
        'style',
        'test',
        // Custom types from changelog script
        'lint',
        'pretty',
        'config',
        'deps',
        'release'
      ]
    ],
    'subject-case': [2, 'always', ['sentence-case']]
  }
};
