import { useAppContext } from "@/context/AppContext";
import { useChatRoom } from "@/context/ChatContext";
import { useSocket } from "@/context/SocketContext";
import { ChatMessage } from "@/types/chat";
import { SocketEvent } from "@/types/socket";
import { formatDate } from "@/utils/formateDate";
import { FormEvent, useRef, useState } from "react";
import { LuSendHorizonal } from "react-icons/lu";
import { v4 as uuidV4 } from "uuid";
import { getAIResponse } from "@/services/aiService";

function ChatInput() {
    const { currentUser } = useAppContext();
    const { socket } = useSocket();
    const { setMessages } = useChatRoom();
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [isAIProcessing, setIsAIProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const sendMessage = (message: string, isAIMessage = false) => {
        const newMessage: ChatMessage = {
            id: uuidV4(),
            message,
            username: isAIMessage ? "Gemini" : currentUser.username,
            timestamp: formatDate(new Date().toISOString()),
        };

        if (!isAIMessage) {
            socket.emit(SocketEvent.SEND_MESSAGE, { message: newMessage });
        }
        setMessages((messages) => [...messages, newMessage]);
    };

    const handleAIRequest = async (query: string) => {
        try {
            setIsAIProcessing(true);
            setError(null);

            const { response, error } = await getAIResponse(query);

            if (error) {
                setError(error);
                sendMessage("Sorry, I couldn't process your request at the moment.", true);
                return;
            }

            if (response) {
                sendMessage(response, true);
            }
        } finally {
            setIsAIProcessing(false);
        }
    };

    const handleSendMessage = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const inputVal = inputRef.current?.value.trim();
        if (!inputVal || inputVal.length === 0) return;

        // Send user message first
        sendMessage(inputVal);

        // Check for AI command
        if (inputVal.toLowerCase().startsWith("@ai")) {
            const query = inputVal.slice(3).trim();
            if (query) {
                await handleAIRequest(query);
            } else {
                sendMessage("Please provide a question after @ai", true);
            }
        }

        // Clear input
        if (inputRef.current) {
            inputRef.current.value = "";
        }
    };

    return (
        <div className="flex flex-col gap-3 pt-2">
            {error && (
                <div className="text-[10px] text-danger font-medium animate-shake px-1">
                    {error}
                </div>
            )}
            <form
                onSubmit={handleSendMessage}
                className="relative flex items-center"
            >
                <input
                    type="text"
                    className="input-field pr-12 text-sm"
                    placeholder={isAIProcessing ? "AI is thinking..." : "Type @ai to ask Gemini..."}
                    ref={inputRef}
                    disabled={isAIProcessing}
                />
                <button
                    className="absolute right-1.5 flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                    type="submit"
                    disabled={isAIProcessing}
                >
                    <LuSendHorizonal size={18} />
                </button>
            </form>
            {isAIProcessing && (
                <div className="flex items-center gap-2 px-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" />
                    <div className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:0.2s]" />
                    <div className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:0.4s]" />
                    <span className="text-[10px] text-primary/80 font-bold uppercase tracking-wider ml-1">
                        Gemini Thinking
                    </span>
                </div>
            )}
        </div>
    );
}

export default ChatInput;
