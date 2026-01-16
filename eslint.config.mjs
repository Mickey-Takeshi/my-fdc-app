import nextConfig from 'eslint-config-next';

const config = [
  ...nextConfig,
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'references/**',
      '*.cjs',
    ],
  },
  {
    rules: {
      // useEffect内でのsetStateは既存コードで使用されているため警告に変更
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
];

export default config;
