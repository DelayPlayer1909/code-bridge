import { useAppContext } from "@/context/AppContext"
import { RemoteUser, USER_CONNECTION_STATUS } from "@/types/user"
import Avatar from "react-avatar"
import cn from "classnames"

function Users() {
    const { users } = useAppContext()

    return (
        <div className="flex flex-grow justify-center overflow-y-auto py-4 custom-scrollbar">
            <div className="grid h-full w-full grid-cols-2 items-start gap-4 sm:grid-cols-3">
                {users.map((user) => {
                    return <User key={user.socketId} user={user} />
                })}
            </div>
        </div>
    )
}

const User = ({ user }: { user: RemoteUser }) => {
    const { username, status } = user
    const isOnline = status === USER_CONNECTION_STATUS.ONLINE
    const title = `${username} - ${isOnline ? "online" : "offline"}`

    return (
        <div
            className="group relative flex flex-col items-center gap-3 rounded-2xl border border-white/5 bg-white/5 p-4 transition-all hover:bg-white/10"
            title={title}
        >
            <div className="relative">
                <Avatar 
                    name={username} 
                    size="50" 
                    round="16px" 
                    title={title}
                    className="shadow-lg transition-transform group-hover:scale-105" 
                />
                <div
                    className={cn(
                        "absolute -right-1 -top-1 h-3.5 w-3.5 rounded-full border-2 border-dark shadow-sm",
                        {
                            "bg-success": isOnline,
                            "bg-danger": !isOnline
                        }
                    )}
                ></div>
            </div>
            <p className="w-full truncate text-center text-xs font-medium text-white/70 group-hover:text-white">
                {username}
            </p>
        </div>
    )
}

export default Users
