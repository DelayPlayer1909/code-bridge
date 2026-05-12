import { Toaster } from "react-hot-toast"

function Toast() {
    return (
        <Toaster
            position="top-right"
            toastOptions={{
                style: {
                    background: "#1c1c24",
                    color: "#f8fafc",
                    borderRadius: "12px",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    backdropFilter: "blur(12px)",
                    fontSize: "14px",
                    fontWeight: "500",
                    padding: "12px 20px",
                    boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
                },
                success: {
                    iconTheme: {
                        primary: "#7c3aed",
                        secondary: "#fff",
                    },
                },
                error: {
                    iconTheme: {
                        primary: "#ef4444",
                        secondary: "#fff",
                    },
                },
            }}
        />
    )
}

export default Toast
