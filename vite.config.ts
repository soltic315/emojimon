import { defineConfig } from 'vite';
import packageJson from './package.json';

// GitHub Actions 上でビルドする場合、GITHUB_REPOSITORY 環境変数からリポジトリ名を取得して
// GitHub Pages のベースパス（/<リポジトリ名>/）を自動設定する。
// ローカル開発時は '/' のまま動作する。
const getBase = (): string => {
  const repo = process.env.GITHUB_REPOSITORY?.split('/')[1];
  return repo ? `/${repo}/` : '/';
};

export default defineConfig({
  base: process.env.CI ? getBase() : '/',
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
  },
});
