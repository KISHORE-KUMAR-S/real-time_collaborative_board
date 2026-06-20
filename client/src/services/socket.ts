// Single Socket.IO client instance. Auto-reconnect with bounded backoff. The
// auth token is read via a callback so every (re)connect picks up the current
// token — important after login and across reconnects.
import { io, type Socket } from "socket.io-client"
import { config } from "@/config"
import { authToken } from "@/services/authToken"

export const socket: Socket = io(config.apiUrl, {
  autoConnect: false,
  reconnection: true,
  reconnectionDelay: 500,
  reconnectionDelayMax: 5000,
  auth: (cb) => cb({ token: authToken.get() ?? "" }),
})
