const config = {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			fontFamily: {
				sans: ['Inter', 'ui-sans-serif', 'system-ui']
			},
			boxShadow: {
				soft: '0 12px 30px -12px rgba(87, 42, 0, 0.35)'
			}
		}
	},
	plugins: [
		require('@tailwindcss/forms')({
			strategy: 'class'
		}),
		require('@tailwindcss/typography'),
		require('daisyui')
	],
	daisyui: {
		logs: false,
		themes: [
			{
				friendsgiving: {
					primary: '#ea580c',
					'primary-content': '#ffffff',
					secondary: '#92400e',
					'secondary-content': '#ffffff',
					accent: '#f59e0b',
					'accent-content': '#ffffff',
					neutral: '#292524',
					'neutral-content': '#fafaf9',
					'base-100': '#fafaf9',
					'base-200': '#f5f5f4',
					'base-300': '#e7e5e4',
					'base-content': '#292524',
					info: '#3b82f6',
					'info-content': '#ffffff',
					success: '#10b981',
					'success-content': '#ffffff',
					warning: '#f59e0b',
					'warning-content': '#ffffff',
					error: '#ef4444',
					'error-content': '#ffffff'
				}
			}
		]
	}
};

module.exports = config;

