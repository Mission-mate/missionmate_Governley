/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
  	extend: {
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			
  			composer: 'hsl(var(--composer))',
  			'module-contacts': 'hsl(var(--module-contacts) / <alpha-value>)',
  			overdue: 'hsl(var(--overdue))',
  			'copilot-orb': 'hsl(var(--copilot-orb))',
  			poll: {
  				DEFAULT: 'hsl(var(--poll))',
  				accent: 'hsl(var(--poll-accent))',
  				foreground: 'hsl(var(--poll-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			}
  		},
  		fontFamily: {
  			heading: ['var(--font-heading)'],
  			body: ['var(--font-body)'],
  			display: ['var(--font-display)'],
  			serif: ['var(--font-serif)'],
  			mono: ['var(--font-mono)']
  		},
  		keyframes: {
  			'accordion-down': {
  				from: { height: '0' },
  				to: { height: 'var(--radix-accordion-content-height)' }
  			},
  			'accordion-up': {
  				from: { height: 'var(--radix-accordion-content-height)' },
  				to: { height: '0' }
  			},
  			badgeArrive: {
  				from: { opacity: '0.55', transform: 'scale(.88)' },
  				to: { opacity: '1', transform: 'scale(1)' }
  			},
  			addIconReveal: {
  				from: { opacity: '0.18' },
  				to: { opacity: '1' }
  			},
  			/* No `to` frame: ends on the element's own transform, so offsets like translate-y-1 never jump. */
  			'dropdown-enter': {
  				from: { opacity: '0', transform: 'translateY(-6px)' }
  			},
  			/* Expanded rows and sections — same motion, a slightly shorter travel. */
  			'expand-enter': {
  				from: { opacity: '0', transform: 'translateY(-4px)' }
  			},
  			/* Closing — the reverse slide, slightly quicker. Uses `translate` so it never
  			   overrides an element's own transform (e.g. menu side offsets). */
  			'dropdown-exit': {
  				to: { opacity: '0', translate: '0 -6px' }
  			},
  			'expand-exit': {
  				to: { opacity: '0', translate: '0 -4px' }
  			},
  			/* A pinned item the reader jumped to — a brief primary tint that fades out. */
  			/* Composer send icon — flies off up and to the right, then a fresh one slides back in. */
  			'send-out': {
  				from: { opacity: '1', translate: '0 0' },
  				to: { opacity: '0', translate: '12px -8px' }
  			},
  			'send-in': {
  				from: { opacity: '0', translate: '-10px 6px' }
  			},
  			'send-wait': {
  				from: { opacity: '0' }
  			},
  			'pin-flash': {
  				'0%, 40%': { backgroundColor: 'hsl(var(--primary) / 0.14)' },
  				'100%': { backgroundColor: 'transparent' }
  			}
  		},
  		animation: {
  			'dropdown-enter': 'dropdown-enter 240ms cubic-bezier(.22,1,.36,1)',
  			'expand-enter': 'expand-enter 240ms cubic-bezier(.22,1,.36,1)',
  			'dropdown-exit': 'dropdown-exit 220ms cubic-bezier(.22,1,.36,1) forwards',
  			'expand-exit': 'expand-exit 220ms cubic-bezier(.22,1,.36,1) forwards',
  			'pin-flash': 'pin-flash 1600ms ease-out',
  			'send-out': 'send-out 260ms cubic-bezier(.4,0,.7,.2)',
  			'send-in': 'send-in 320ms cubic-bezier(.22,1,.36,1)',
  			'send-wait': 'send-wait 200ms ease-out 240ms backwards',
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}
