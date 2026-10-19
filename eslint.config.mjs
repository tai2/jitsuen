// The Remotion flat config is gone with the framework; this is the minimal replacement.
// There is no React and no JSX left in the repo — src/ is one .ts module plus plain
// browser .js motion helpers, and scripts/ is Node. `pnpm lint` also runs
// `hyperframes lint`, which is what actually validates the composition HTML.
import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {ignores: ['node_modules', 'out', 'assets', '.cache', '.hyperframes']},
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/blocks/*.js'],
    languageOptions: {
      // Motion helpers run in the composition page, not in Node: GSAP and the runtime's
      // window.__timelines are supplied by the page, not imported.
      globals: {window: 'readonly', document: 'readonly', gsap: 'readonly'},
    },
  },
);
