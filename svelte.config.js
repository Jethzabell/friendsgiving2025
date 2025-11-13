import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const dev = process.argv.includes('dev');

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),

	kit: {
		adapter: adapter({
			strict: false
		}),
		prerender: {
			entries: ['*']
		},
		paths: {
			relative: true,
			base: dev ? '' : process.env.VITE_BASE_PATH ?? ''
		},
		alias: {
			$components: 'src/lib/components',
			$stores: 'src/lib/stores'
		}
	}
};

export default config;
