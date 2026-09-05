/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        severity: {
          critical: '#ef4444', // red-500
          high: '#f97316',     // orange-500
          medium: '#eab308',   // yellow-500
          safe: '#22c55e',     // green-500
        },
        command: {
          bg: '#f4f5f7',      // soft neutral off-white/light gray
          card: '#ffffff',    // crisp surface
          border: '#e2e8f0',  // subtle border
          text: '#0f172a',    // clear slate text
          muted: '#64748b',   // slate-500
        }
      }
    },
  },
  plugins: [],
}
