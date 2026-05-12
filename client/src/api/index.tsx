import axios, { AxiosInstance } from "axios"

// Point to our local backend server for code execution
const localBackendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000"

const instance: AxiosInstance = axios.create({
    baseURL: localBackendUrl,
    headers: {
        "Content-Type": "application/json",
    },
})

export default instance

