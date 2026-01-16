/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      screens: {
        // Mobile-first breakpoints (desktop-first approach - these define max-width)
        xs: '375px', // Small phones
        sm: '640px', // Large phones / small tablets
        tablet: '768px', // Tablets
        desktop: '1024px', // Desktop
        lg: '1280px', // Large desktop
        xl: '1536px', // Extra large
      },
      // Custom spacing for touch targets
      spacing: {
        11: '2.75rem', // 44px - minimum touch target
        13: '3.25rem',
      },
      // Animation for mobile interactions
      animation: {
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
        shimmer: 'shimmer 1.5s ease-in-out infinite',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
      },
    },
  },
  plugins: [],
};
