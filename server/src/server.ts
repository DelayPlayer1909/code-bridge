import express, { Response, Request } from "express"
import dotenv from "dotenv"
import http from "http"
import cors from "cors"
import { SocketEvent, SocketId } from "./types/socket"
import { USER_CONNECTION_STATUS, User } from "./types/user"
import { Server } from "socket.io"
import path from "path"
import { exec } from "child_process"
import fs from "fs"
import { v4 as uuidv4 } from "uuid"
import { execSync } from "child_process"  // already have exec, just add execSync
import os from "os"


dotenv.config()

const app = express()

app.use(express.json())

app.use(cors())

app.use(express.static(path.join(__dirname, "public"))) // Serve static files

const server = http.createServer(app)
const io = new Server(server, {
	cors: {
		origin: "*", // Allow all origins for local development
		methods: ["GET", "POST"],
		credentials: true,
	},
	transports: ["websocket", "polling"],
	maxHttpBufferSize: 1e8,
	pingTimeout: 60000,
	pingInterval: 25000,
})

let userSocketMap: User[] = []

// Function to get all users in a room
function getUsersInRoom(roomId: string): User[] {
	return userSocketMap.filter((user) => user.roomId == roomId)
}

// Function to get room id by socket id
function getRoomId(socketId: SocketId): string | null {
	const roomId = userSocketMap.find(
		(user) => user.socketId === socketId
	)?.roomId

	if (!roomId) {
		console.error("Room ID is undefined for socket ID:", socketId)
		return null
	}
	return roomId
}

function getUserBySocketId(socketId: SocketId): User | null {
	const user = userSocketMap.find((user) => user.socketId === socketId)
	if (!user) {
		console.error("User not found for socket ID:", socketId)
		return null
	}
	return user
}



// ─── Binary Resolution ────────────────────────────────────────────────────────

const IS_WINDOWS = os.platform() === "win32"

function resolveBinary(bin: string, windowsAliases?: string[]): string {
    const names = IS_WINDOWS && windowsAliases ? windowsAliases : [bin]

    for (const name of names) {
        try {
            const cmd = IS_WINDOWS ? `where ${name}` : `which ${name}`
            const result = execSync(cmd, { stdio: ["pipe", "pipe", "pipe"] })
                .toString()
                .trim()
                .split("\n")[0]
                .trim()
            if (result) return IS_WINDOWS ? `"${result}"` : result
        } catch {
            continue
        }
    }

    // Fallback to JAVA_HOME for java/javac
    const javaHome = process.env.JAVA_HOME
    if (javaHome && (bin === "java" || bin === "javac")) {
        return IS_WINDOWS
            ? `"${javaHome}\\bin\\${bin}.exe"`
            : `${javaHome}/bin/${bin}`
    }

    return bin // last resort — hope it's on PATH
}

// Resolved once at startup
const JAVA   = resolveBinary("java")
const JAVAC  = resolveBinary("javac")
const PYTHON = resolveBinary("python3", ["python", "python3"])
const NODE   = resolveBinary("node")

console.log("Resolved binaries:", { NODE, PYTHON, JAVA, JAVAC })

// ─── Execution Endpoint ───────────────────────────────────────────────────────

app.post("/execute", (req: Request, res: Response) => {
    const { language, files, stdin } = req.body

    // ── Validate request ──
    if (!language) {
        return res.status(400).send({ error: "No language provided" })
    }
    if (!files || files.length === 0) {
        return res.status(400).send({ error: "No files provided" })
    }

    const file = files[0]
    const code = file.content
    const originalFileName = file.name || "script"

    if (!code) {
        return res.status(400).send({ error: "File content is empty" })
    }

    // ── Build command ──
    const executionId = uuidv4()
    const tempDir = path.join(__dirname, "..", "temp", executionId)

    let fileName = originalFileName
    let command = ""

    switch (language.toLowerCase()) {
        case "javascript":
        case "js":
            if (!fileName.endsWith(".js")) fileName += ".js"
            command = `${NODE} ${fileName}`
            break

        case "python":
        case "py":
        case "python3":
            if (!fileName.endsWith(".py")) fileName += ".py"
            command = `${PYTHON} ${fileName}`
            break

        case "java":
            if (!fileName.endsWith(".java")) fileName += ".java"
            const className = fileName.replace(".java", "")
            // On Windows, && works in cmd but wrap with cmd /c to be safe
            command = IS_WINDOWS
                ? `cmd /c "${JAVAC} ${fileName} && ${JAVA} ${className}"`
                : `${JAVAC} ${fileName} && ${JAVA} ${className}`
            break

        default:
            return res.status(400).send({
                error: `Language "${language}" is not supported. Supported: javascript, python, java`,
            })
    }

    // ── Create temp dir and write file ──
    try {
        fs.mkdirSync(tempDir, { recursive: true })
    } catch (err) {
        return res.status(500).send({ error: "Failed to create temp directory" })
    }

    const filePath = path.join(tempDir, fileName)

    try {
        fs.writeFileSync(filePath, code)
    } catch (err) {
        fs.rmSync(tempDir, { recursive: true, force: true })
        return res.status(500).send({ error: "Failed to write code to disk" })
    }

    // ── Execute ──
    const child = exec(
        command,
        {
            cwd: tempDir,
            timeout: 15000,
            env: {
                ...process.env,
                PATH: IS_WINDOWS
                    ? process.env.PATH                         // Windows PATH is usually fine
                    : `/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:${process.env.PATH ?? ""}`,
            },
        },
        (error, stdout, stderr) => {
            // ── Cleanup ──
            try {
                fs.rmSync(tempDir, { recursive: true, force: true })
            } catch (cleanupErr) {
                console.error("Failed to delete temp dir:", cleanupErr)
            }

            // ── Timeout check ──
            const timedOut = (error as any)?.killed === true || error?.message?.includes("ETIMEDOUT")

            // ── Respond ──
            res.send({
                run: {
                    stdout: stdout || "",
                    stderr: stderr || (error && !timedOut ? error.message : ""),
                    code: timedOut ? 124 : (error?.code ?? 0), // 124 = unix timeout exit code
                    timedOut,
                },
            })
        }
    )

    // ── Pipe stdin if provided ──
    if (stdin && child.stdin) {
        try {
            child.stdin.write(stdin)
            child.stdin.end()
        } catch (err) {
            console.error("Failed to write stdin:", err)
        }
    }
})

app.get("/runtimes", (req: Request, res: Response) => {
    res.send([
        { language: "javascript", version: "Node.js", aliases: ["js", "javascript"] },
        { language: "python", version: "Python 3", aliases: ["py", "python", "python3"] },
        { language: "java", version: "Java 17", aliases: ["java"] }
    ])
})

io.on("connection", (socket) => {
	// ... (rest of the socket logic remains same)
	socket.on(SocketEvent.JOIN_REQUEST, ({ roomId, username }) => {
		const isUsernameExist = getUsersInRoom(roomId).filter(
			(u) => u.username === username
		)
		if (isUsernameExist.length > 0) {
			io.to(socket.id).emit(SocketEvent.USERNAME_EXISTS)
			return
		}

		const user = {
			username,
			roomId,
			status: USER_CONNECTION_STATUS.ONLINE,
			cursorPosition: 0,
			typing: false,
			socketId: socket.id,
			currentFile: null,
		}
		userSocketMap.push(user)
		socket.join(roomId)
		socket.broadcast.to(roomId).emit(SocketEvent.USER_JOINED, { user })
		const users = getUsersInRoom(roomId)
		io.to(socket.id).emit(SocketEvent.JOIN_ACCEPTED, { user, users })
	})

	socket.on("disconnecting", () => {
		const user = getUserBySocketId(socket.id)
		if (!user) return
		const roomId = user.roomId
		socket.broadcast
			.to(roomId)
			.emit(SocketEvent.USER_DISCONNECTED, { user })
		userSocketMap = userSocketMap.filter((u) => u.socketId !== socket.id)
		socket.leave(roomId)
	})

	socket.on(
		SocketEvent.SYNC_FILE_STRUCTURE,
		({ fileStructure, openFiles, activeFile, socketId }) => {
			io.to(socketId).emit(SocketEvent.SYNC_FILE_STRUCTURE, {
				fileStructure,
				openFiles,
				activeFile,
			})
		}
	)

	socket.on(
		SocketEvent.DIRECTORY_CREATED,
		({ parentDirId, newDirectory }) => {
			const roomId = getRoomId(socket.id)
			if (!roomId) return
			socket.broadcast.to(roomId).emit(SocketEvent.DIRECTORY_CREATED, {
				parentDirId,
				newDirectory,
			})
		}
	)

	socket.on(SocketEvent.DIRECTORY_UPDATED, ({ dirId, children }) => {
		const roomId = getRoomId(socket.id)
		if (!roomId) return
		socket.broadcast.to(roomId).emit(SocketEvent.DIRECTORY_UPDATED, {
			dirId,
			children,
		})
	})

	socket.on(SocketEvent.DIRECTORY_RENAMED, ({ dirId, newName }) => {
		const roomId = getRoomId(socket.id)
		if (!roomId) return
		socket.broadcast.to(roomId).emit(SocketEvent.DIRECTORY_RENAMED, {
			dirId,
			newName,
		})
	})

	socket.on(SocketEvent.DIRECTORY_DELETED, ({ dirId }) => {
		const roomId = getRoomId(socket.id)
		if (!roomId) return
		socket.broadcast
			.to(roomId)
			.emit(SocketEvent.DIRECTORY_DELETED, { dirId })
	})

	socket.on(SocketEvent.FILE_CREATED, ({ parentDirId, newFile }) => {
		const roomId = getRoomId(socket.id)
		if (!roomId) return
		socket.broadcast
			.to(roomId)
			.emit(SocketEvent.FILE_CREATED, { parentDirId, newFile })
	})

	socket.on(SocketEvent.FILE_UPDATED, ({ fileId, newContent }) => {
		const roomId = getRoomId(socket.id)
		if (!roomId) return
		socket.broadcast.to(roomId).emit(SocketEvent.FILE_UPDATED, {
			fileId,
			newContent,
		})
	})

	socket.on(SocketEvent.FILE_RENAMED, ({ fileId, newName }) => {
		const roomId = getRoomId(socket.id)
		if (!roomId) return
		socket.broadcast.to(roomId).emit(SocketEvent.FILE_RENAMED, {
			fileId,
			newName,
		})
	})

	socket.on(SocketEvent.FILE_DELETED, ({ fileId }) => {
		const roomId = getRoomId(socket.id)
		if (!roomId) return
		socket.broadcast.to(roomId).emit(SocketEvent.FILE_DELETED, { fileId })
	})

	socket.on(SocketEvent.USER_OFFLINE, ({ socketId }) => {
		userSocketMap = userSocketMap.map((user) => {
			if (user.socketId === socketId) {
				return { ...user, status: USER_CONNECTION_STATUS.OFFLINE }
			}
			return user
		})
		const roomId = getRoomId(socketId)
		if (!roomId) return
		socket.broadcast.to(roomId).emit(SocketEvent.USER_OFFLINE, { socketId })
	})

	socket.on(SocketEvent.USER_ONLINE, ({ socketId }) => {
		userSocketMap = userSocketMap.map((user) => {
			if (user.socketId === socketId) {
				return { ...user, status: USER_CONNECTION_STATUS.ONLINE }
			}
			return user
		})
		const roomId = getRoomId(socketId)
		if (!roomId) return
		socket.broadcast.to(roomId).emit(SocketEvent.USER_ONLINE, { socketId })
	})

	socket.on(SocketEvent.SEND_MESSAGE, ({ message }) => {
		const roomId = getRoomId(socket.id)
		if (!roomId) return
		socket.broadcast
			.to(roomId)
			.emit(SocketEvent.RECEIVE_MESSAGE, { message })
	})

	socket.on(SocketEvent.TYPING_START, ({ cursorPosition }) => {
		userSocketMap = userSocketMap.map((user) => {
			if (user.socketId === socket.id) {
				return { ...user, typing: true, cursorPosition }
			}
			return user
		})
		const user = getUserBySocketId(socket.id)
		if (!user) return
		const roomId = user.roomId
		socket.broadcast.to(roomId).emit(SocketEvent.TYPING_START, { user })
	})

	socket.on(SocketEvent.TYPING_PAUSE, () => {
		userSocketMap = userSocketMap.map((user) => {
			if (user.socketId === socket.id) {
				return { ...user, typing: false }
			}
			return user
		})
		const user = getUserBySocketId(socket.id)
		if (!user) return
		const roomId = user.roomId
		socket.broadcast.to(roomId).emit(SocketEvent.TYPING_PAUSE, { user })
	})

	socket.on(SocketEvent.REQUEST_DRAWING, () => {
		const roomId = getRoomId(socket.id)
		if (!roomId) return
		socket.broadcast
			.to(roomId)
			.emit(SocketEvent.REQUEST_DRAWING, { socketId: socket.id })
	})

	socket.on(SocketEvent.SYNC_DRAWING, ({ drawingData, socketId }) => {
		socket.broadcast
			.to(socketId)
			.emit(SocketEvent.SYNC_DRAWING, { drawingData })
	})

	socket.on(SocketEvent.DRAWING_UPDATE, ({ snapshot }) => {
		const roomId = getRoomId(socket.id)
		if (!roomId) return
		socket.broadcast.to(roomId).emit(SocketEvent.DRAWING_UPDATE, {
			snapshot,
		})
	})
})

io.on("error", (error) => {
	console.error("Socket.io error:", error)
})

const PORT = process.env.PORT || 3000

app.get("/", (req: Request, res: Response) => {
	res.sendFile(path.join(__dirname, "..", "public", "index.html"))
})

server.listen(PORT, () => {
	console.log(`Listening on port ${PORT}`)
})

