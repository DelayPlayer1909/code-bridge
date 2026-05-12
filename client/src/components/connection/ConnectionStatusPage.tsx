import { useNavigate } from "react-router-dom"

function ConnectionStatusPage() {
    return (
        <div className="flex h-screen min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
            <ConnectionError />
        </div>
    )
}

const ConnectionError = () => {
    const navigate = useNavigate()
    const reloadPage = () => {
        window.location.reload()
    }

    const gotoHomePage = () => {
        navigate("/")
    }

    return (
        <div className="glass flex flex-col items-center gap-8 rounded-3xl p-12 max-w-[500px]">
            <div className="flex flex-col items-center gap-4">
                <div className="rounded-full bg-danger/10 p-6">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="60"
                        height="60"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-danger animate-pulse"
                    >
                        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                        <path d="M12 9v4" />
                        <path d="M12 17h.01" />
                    </svg>
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-white">Connection Failed</h1>
                <p className="text-white/60 leading-relaxed text-center">
                    We couldn't connect to the workspace. This might be due to an unstable internet connection or an invalid room ID.
                </p>
            </div>
            <div className="flex flex-col w-full gap-3">
                <button
                    className="btn-primary"
                    onClick={reloadPage}
                >
                    Try Again
                </button>
                <button
                    className="text-sm text-white/60 hover:text-white transition-colors cursor-pointer select-none underline decoration-white/20 underline-offset-4"
                    onClick={gotoHomePage}
                >
                    Return to Homepage
                </button>
            </div>
        </div>
    )
}

export default ConnectionStatusPage
