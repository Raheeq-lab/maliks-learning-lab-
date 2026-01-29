
import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				// CUSTOM BACKGROUNDS (From User Prompt)
				'bg-main': 'var(--bg-main)',
				'bg-page': 'var(--bg-page)',
				'bg-card': 'var(--bg-card)',
				'bg-card-hover': 'var(--bg-card-hover)',
				'bg-header': 'var(--bg-header)',
				'bg-section': 'var(--bg-section)',
				'bg-section-alt': 'var(--bg-section-alt)',
				'bg-elevated': 'var(--bg-elevated)',
				'bg-hover': 'var(--bg-hover)',
				'bg-active': 'var(--bg-active)',
				'bg-disabled': 'var(--bg-disabled)',
				'bg-code': 'var(--bg-code)',
				'bg-input': 'var(--bg-input)',
				'bg-input-focus': 'var(--bg-input-focus)',

				// SUBJECT BACKGROUNDS
				'math-bg-light': 'var(--math-bg-light)',
				'english-bg-light': 'var(--english-bg-light)',
				'ict-bg-light': 'var(--ict-bg-light)',
				'math-bg-dark': 'var(--math-bg-dark)',
				'english-bg-dark': 'var(--english-bg-dark)',
				'ict-bg-dark': 'var(--ict-bg-dark)',

				// NAVIGATION TABS
				'tab-active-bg': 'var(--tab-active-bg)',
				'tab-hover-bg': 'var(--tab-hover-bg)',

				// CUSTOM BRAND COLORS
				'bg-primary': 'hsl(var(--bg-primary))',
				'bg-secondary': 'hsl(var(--bg-secondary))',
				'focus-blue': {
					DEFAULT: 'hsl(var(--focus-blue))',
					light: 'hsl(var(--focus-blue-light))',
					dark: 'hsl(var(--focus-blue-dark))',
					darker: 'hsl(var(--focus-blue-darker))',
				},
				'success-green': {
					DEFAULT: 'hsl(var(--success-green))',
					light: 'hsl(var(--success-green-light))',
				},
				'error-coral': {
					DEFAULT: 'hsl(var(--error-coral))',
					light: 'hsl(var(--error-coral-light))',
				},
				'warning-amber': {
					DEFAULT: 'hsl(var(--warning-amber))',
					light: 'hsl(var(--warning-amber-light))',
				},
				'math-purple': 'hsl(var(--math-purple))',
				'english-green': 'hsl(var(--english-green))',
				'ict-orange': 'hsl(var(--ict-orange))',
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
				quiz: {
					purple: '#6200EA',
					teal: '#00BCD4',
					light: '#F5F7FF',
					dark: '#1A1A2E'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'fade-in': {
					'0%': { opacity: '0' },
					'100%': { opacity: '1' }
				},
				'bounce-subtle': {
					'0%, 100%': { transform: 'translateY(0)' },
					'50%': { transform: 'translateY(-5px)' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.5s ease-out',
				'bounce-subtle': 'bounce-subtle 2s ease-in-out infinite'
			},
			fontFamily: {
				sans: ['Inter', 'sans-serif'],
				poppins: ['Poppins', 'sans-serif']
			},
			fontSize: {
				'xs': 'var(--font-xs)',
				'sm': 'var(--font-sm)',
				'base': 'var(--font-base)',
				'lg': 'var(--font-lg)',
				'xl': 'var(--font-xl)',
				'2xl': 'var(--font-2xl)',
				'3xl': 'var(--font-3xl)',
			},
			spacing: {
				'1': 'var(--space-1)',
				'2': 'var(--space-2)',
				'3': 'var(--space-3)',
				'4': 'var(--space-4)',
				'5': 'var(--space-5)',
				'6': 'var(--space-6)',
				'8': 'var(--space-8)',
				'10': 'var(--space-10)',
				'12': 'var(--space-12)',
				'16': 'var(--space-16)',
				'card-padding': 'var(--card-padding)',
				'section-gap': 'var(--section-gap)',
				'card-gap': 'var(--card-gap)',
			},
			borderWidth: {
				'3': '3px',
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
