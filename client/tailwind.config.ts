/** @type {import('tailwindcss').Config} */
export default {
    content: ["./src/**/*.{jsx,tsx}", "./*.html"],
    theme: {
        extend: {
            colors: {
                dark: "#0a0a0c",
                darkHover: "#16161e",
                secondary: "#1c1c24",
                primary: "#7c3aed", // Vibrant Violet
                accent: "#3b82f6", // Electric Blue
                danger: "#ef4444",
                success: "#10b981",
                light: "#f8fafc",
            },
            fontFamily: {
                poppins: ["Poppins", "sans-serif"],
                grotesk: ["Space Grotesk", "sans-serif"],
                mono: ["Space Mono", "monospace"],
            },
            animation: {
                "up-down": "up-down 3s ease-in-out infinite alternate",
                "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
            },
            boxShadow: {
                glass: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
                "glass-sm": "0 4px 16px 0 rgba(0, 0, 0, 0.25)",
            },
            backdropBlur: {
                glass: "12px",
            },
        },
    },
    plugins: [],
}
