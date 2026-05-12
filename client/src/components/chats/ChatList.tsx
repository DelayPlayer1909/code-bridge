import { useAppContext } from "@/context/AppContext"
import { useChatRoom } from "@/context/ChatContext"
import { SyntheticEvent, useEffect, useRef } from "react"
import cn from "classnames"

function ChatList() {
    const {
        messages,
        isNewMessage,
        setIsNewMessage,
        lastScrollHeight,
        setLastScrollHeight,
        isAITyping,  // ✅ Added isAITyping
    } = useChatRoom()
    const { currentUser } = useAppContext()
    const messagesContainerRef = useRef<HTMLDivElement | null>(null)

    const handleScroll = (e: SyntheticEvent) => {
        const container = e.target as HTMLDivElement
        setLastScrollHeight(container.scrollTop)
    }

    useEffect(() => {
        if (!messagesContainerRef.current) return

        const container = messagesContainerRef.current
        const isAtBottom = container.scrollHeight - container.scrollTop === container.clientHeight

        if (isAtBottom) {
            container.scrollTop = container.scrollHeight
        }
    }, [messages])

    useEffect(() => {
        if (isNewMessage) {
            setIsNewMessage(false)
        }
        if (messagesContainerRef.current)
            messagesContainerRef.current.scrollTop = lastScrollHeight
    }, [isNewMessage, setIsNewMessage, lastScrollHeight])

    return (
        <div
            className="flex-grow overflow-auto rounded-xl bg-white/5 p-4 custom-scrollbar"
            ref={messagesContainerRef}
            onScroll={handleScroll}
        >
            {messages.map((message, index) => {
                const isAIMessage = message.username === "Gemini AI";
                const isCurrentUser = message.username === currentUser.username;

                return (
                    <div
                        key={index}
                        className={cn(
                            "mb-4 max-w-[85%] break-words rounded-2xl px-4 py-3 shadow-sm",
                            {
                                "bg-primary/20 border border-primary/20 text-white": isAIMessage,
                                "ml-auto bg-primary text-white shadow-lg shadow-primary/20": isCurrentUser,
                                "bg-white/10 border border-white/5 text-white/90": !isAIMessage && !isCurrentUser
                            }
                        )}
                    >
                        <div className="flex items-center justify-between gap-4 mb-1">
                            <span className={cn("text-[10px] font-bold uppercase tracking-wider", {
                                "text-primary": isAIMessage,
                                "text-white/80": isCurrentUser,
                                "text-accent": !isAIMessage && !isCurrentUser
                            })}>
                                {message.username}
                            </span>
                            <span className="text-[10px] text-white/40">
                                {message.timestamp}
                            </span>
                        </div>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.message}</p>
                    </div>
                )
            })}
            
            {/* ✅ Show AI typing indicator when AI is responding */}
            {isAITyping && (
                <div className="mb-4 max-w-[85%] break-words rounded-2xl px-4 py-3 bg-primary/10 border border-primary/10 text-white/80 animate-pulse">
                    <span className="text-xs font-medium italic">Gemini AI is thinking...</span>
                </div>
            )}
        </div>
    )
}

export default ChatList
