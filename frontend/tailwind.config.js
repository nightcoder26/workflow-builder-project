/******** Tailwind CSS Configuration ********/
/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ["class"],
    content: [
        "./index.html",
        "./src/**/*.{ts,tsx}"
    ],
    theme: {
        extend: {
            colors: {
                primary: "#3B82F6",
                success: "#10B981",
                warning: "#F59E0B",
                error: "#EF4444",
                background: "#F9FAFB",
                card: "#FFFFFF",
                gmail: "#EA4335",
                sheets: "#34A853",
                slack: "#4A154B",
                telegram: "#0088cc",
                gcal: "#4285F4"
            },
            boxShadow: {
                card: "0 1px 2px 0 rgb(0 0 0 / 0.05), 0 1px 1px -1px rgb(0 0 0 / 0.05)"
            },
            fontFamily: {
                inter: ["Inter", "ui-sans-serif", "system-ui"],
            },
            keyframes: {
                pulseOnce: {
                    '0%': { boxShadow: '0 0 0 0 rgba(59,130,246,0.5)' },
                    '70%': { boxShadow: '0 0 0 10px rgba(59,130,246,0)' },
                    '100%': { boxShadow: '0 0 0 0 rgba(59,130,246,0)' }
                }
            },
            animation: {
                pulseOnce: 'pulseOnce 1.5s ease-out 1'
            }
        }
    },
    plugins: [],
}
