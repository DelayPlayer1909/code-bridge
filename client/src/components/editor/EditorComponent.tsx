import { useFileSystem } from "@/context/FileContext"
import useResponsive from "@/hooks/useResponsive"
import cn from "classnames"
import { IoCodeSlash } from "react-icons/io5"
import Editor from "./Editor"
import FileTab from "./FileTab"

function EditorComponent() {
    const { openFiles } = useFileSystem()
    const { minHeightReached } = useResponsive()

    if (openFiles.length <= 0) {
        return (
            <div className="flex h-full w-full items-center justify-center bg-dark">
                <div className="glass flex flex-col items-center justify-center p-12 rounded-3xl gap-4">
                    <div className="rounded-2xl bg-primary/10 p-6">
                        <IoCodeSlash size={60} className="text-primary animate-pulse-slow" />
                    </div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">
                        No active file
                    </h1>
                    <p className="text-white/50 text-center max-w-[250px]">
                        Select a file from the sidebar or create a new one to begin coding.
                    </p>
                </div>
            </div>
        )
    }

    return (
        <main
            className={cn(
                "flex w-full flex-col overflow-hidden bg-dark",
                {
                    "h-[calc(100vh-60px)]": !minHeightReached,
                    "h-full": minHeightReached,
                }
            )}
        >
            <FileTab />
            <div className="flex-grow overflow-hidden border-t border-white/5">
                <Editor />
            </div>
        </main>
    )
}

export default EditorComponent
