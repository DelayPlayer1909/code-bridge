import axiosInstance from "@/api/"
import { getAIResponse } from "@/services/aiService"
import { Language, RunContext as RunContextType } from "@/types/run"
import langMap from "lang-map"
import {
    ReactNode,
    createContext,
    useContext,
    useEffect,
    useState,
} from "react"
import toast from "react-hot-toast"
import { useFileSystem } from "./FileContext"

const RunCodeContext = createContext<RunContextType | null>(null)

export const useRunCode = () => {
    const context = useContext(RunCodeContext)
    if (context === null) {
        throw new Error(
            "useRunCode must be used within a RunCodeContextProvider",
        )
    }
    return context
}

const RunCodeContextProvider = ({ children }: { children: ReactNode }) => {
    const { activeFile } = useFileSystem()
    const [input, setInput] = useState<string>("")
    const [output, setOutput] = useState<string>("")
    const [isRunning, setIsRunning] = useState<boolean>(false)
    const [supportedLanguages, setSupportedLanguages] = useState<Language[]>([])
    const [selectedLanguage, setSelectedLanguage] = useState<Language>({
        language: "",
        version: "",
        aliases: [],
    })

    useEffect(() => {
        const fetchSupportedLanguages = async () => {
            try {
                const languages = await axiosInstance.get("/runtimes")
                setSupportedLanguages(languages.data)
            } catch (error: any) {
                console.error("Failed to fetch supported languages:", error)
                // Fallback languages if Piston is down/restricted
                setSupportedLanguages([
                    { language: "python", version: "3.10.0", aliases: ["py", "python3"] },
                    { language: "javascript", version: "18.15.0", aliases: ["js", "node"] }
                ])
            }
        }

        fetchSupportedLanguages()
    }, [])

    // Set the selected language based on the file extension
    useEffect(() => {
        if (supportedLanguages.length === 0 || !activeFile?.name) return

        const extension = activeFile.name.split(".").pop()
        if (extension) {
            const languageName = langMap.languages(extension)
            const language = supportedLanguages.find(
                (lang) =>
                    lang.aliases.includes(extension) ||
                    languageName.includes(lang.language.toLowerCase()),
            )
            if (language) setSelectedLanguage(language)
        } else setSelectedLanguage({ language: "", version: "", aliases: [] })
    }, [activeFile?.name, supportedLanguages])

    const runCode = async () => {
        try {
            if (!selectedLanguage || !selectedLanguage.language) {
                return toast.error("Please select a language to run the code")
            } else if (!activeFile) {
                return toast.error("Please open a file to run the code")
            } else {
                toast.loading("Running code...")
            }

            setIsRunning(true)
            const { language, version } = selectedLanguage

            // Try running with our local execution server
            try {
                const response = await axiosInstance.post("/execute", {
                    language,
                    version,
                    files: [{ name: activeFile.name, content: activeFile.content }],
                    stdin: input,
                })
                
                if (response.data.run.stderr) {
                    setOutput(response.data.run.stderr)
                } else {
                    setOutput(response.data.run.stdout)
                }
                setIsRunning(false)
                toast.dismiss()
                return
            } catch (localError: any) {
                console.warn("Local execution failed, trying Gemini fallback...", localError)
                
                // If it's Python, try Gemini as a secondary fallback
                if (language.toLowerCase() === "python") {
                    toast.loading("Local execution failed. Trying Gemini AI...")
                    const prompt = `Execute this Python code and provide the output. 
Input: ${input}
Code:
${activeFile.content}`
                    
                    const { response, error } = await getAIResponse(prompt)
                    if (error) throw new Error(error)
                    setOutput(response || "No output")
                    setIsRunning(false)
                    toast.dismiss()
                    toast.success("Executed via Gemini AI")
                    return
                }
                
                throw localError
            }
        } catch (error: any) {
            console.error("Run Code Error:", error)
            setIsRunning(false)
            toast.dismiss()
            
            const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || "Failed to run the code"
            toast.error(errorMessage)
        }
    }


    return (
        <RunCodeContext.Provider
            value={{
                setInput,
                output,
                isRunning,
                supportedLanguages,
                selectedLanguage,
                setSelectedLanguage,
                runCode,
            }}
        >
            {children}
        </RunCodeContext.Provider>
    )
}

export { RunCodeContextProvider }
export default RunCodeContext

