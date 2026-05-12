import { useFileSystem } from "@/context/FileContext"
import { getIconClassName } from "@/utils/getIconClassName"
import { Icon } from "@iconify/react"
import { IoClose } from "react-icons/io5"
import cn from "classnames"
import { useEffect, useRef } from "react"
import customMapping from "@/utils/customMapping"
import { useSettings } from "@/context/SettingContext"
import langMap from "lang-map"

function FileTab() {
    const {
        openFiles,
        closeFile,
        activeFile,
        updateFileContent,
        setActiveFile,
    } = useFileSystem()
    const fileTabRef = useRef<HTMLDivElement>(null)
    const { setLanguage } = useSettings()

    const changeActiveFile = (fileId: string) => {
        // If the file is already active, do nothing
        if (activeFile?.id === fileId) return

        updateFileContent(activeFile?.id || "", activeFile?.content || "")

        const file = openFiles.find((file) => file.id === fileId)
        if (file) {
            setActiveFile(file)
        }
    }

    useEffect(() => {
        const fileTabNode = fileTabRef.current
        if (!fileTabNode) return

        const handleWheel = (e: WheelEvent) => {
            if (e.deltaY > 0) {
                fileTabNode.scrollLeft += 100
            } else {
                fileTabNode.scrollLeft -= 100
            }
        }

        fileTabNode.addEventListener("wheel", handleWheel)

        return () => {
            fileTabNode.removeEventListener("wheel", handleWheel)
        }
    }, [])

    // Update the editor language when a file is opened
    useEffect(() => {
        if (activeFile?.name === undefined) return
        // Get file extension on file open and set language when file is opened
        const extension = activeFile.name.split(".").pop()
        if (!extension) return

        // Check if custom mapping exists
        if (customMapping[extension]) {
            setLanguage(customMapping[extension])
            return
        }

        const language = langMap.languages(extension)
        setLanguage(language[0])
    }, [activeFile?.name, setLanguage])

    return (
        <div
            className="flex h-[50px] w-full select-none gap-1 overflow-x-auto px-2 pt-2"
            ref={fileTabRef}
        >
            {openFiles.map((file) => (
                <div
                    key={file.id}
                    className={cn(
                        "group flex w-fit min-w-[120px] max-w-[200px] cursor-pointer items-center rounded-t-lg px-4 py-2 text-sm font-medium transition-all duration-200 border-x border-t border-transparent",
                        { 
                            "bg-dark text-primary border-white/5": file.id === activeFile?.id,
                            "text-white/40 hover:text-white/80 hover:bg-white/5": file.id !== activeFile?.id 
                        },
                    )}
                    onClick={() => changeActiveFile(file.id)}
                >
                    <Icon
                        icon={getIconClassName(file.name)}
                        fontSize={18}
                        className={cn("mr-2 min-w-fit transition-opacity", {
                            "opacity-100": file.id === activeFile?.id,
                            "opacity-50 group-hover:opacity-100": file.id !== activeFile?.id
                        })}
                    />
                    <p
                        className="flex-grow truncate"
                        title={file.name}
                    >
                        {file.name}
                    </p>
                    <IoClose
                        className={cn(
                            "ml-2 rounded-md transition-all duration-200 p-0.5",
                            {
                                "hover:bg-white/10 hover:text-white": file.id === activeFile?.id,
                                "opacity-0 group-hover:opacity-100 hover:bg-white/10": file.id !== activeFile?.id
                            }
                        )}
                        size={18}
                        onClick={(e) => {
                            e.stopPropagation()
                            closeFile(file.id)
                        }}
                    />
                </div>
            ))}
        </div>
    )
}

export default FileTab
