// Single source for the auth token, persisted to localStorage so a refresh
// keeps the session. Shared by the REST client and the socket client.
const KEY = "collab-board-token"

let token: string | null = localStorage.getItem(KEY)

export const authToken = {
  get: () => token,
  set: (value: string) => {
    token = value
    localStorage.setItem(KEY, value)
  },
  clear: () => {
    token = null
    localStorage.removeItem(KEY)
  },
}
