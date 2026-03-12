import type { Book } from "../types/book"

export interface UserData {
  userId: string
  books: Book[]
  scratchpad: string
  lastModified: string
}

// Obține datele utilizatorului curent
export function getUserData(userId: string): UserData {
  if (typeof window === "undefined") {
    return {
      userId,
      books: [],
      scratchpad: "",
      lastModified: new Date().toISOString(),
    }
  }

  const dataJson = localStorage.getItem(`userData_${userId}`)
  if (dataJson) {
    return JSON.parse(dataJson)
  }

  // Datele implicite pentru utilizator nou
  return {
    userId,
    books: [],
    scratchpad: "",
    lastModified: new Date().toISOString(),
  }
}

// Salvează datele utilizatorului
export function saveUserData(userData: UserData): void {
  if (typeof window === "undefined") return
  userData.lastModified = new Date().toISOString()
  localStorage.setItem(`userData_${userData.userId}`, JSON.stringify(userData))
}

// Salvează cărțile utilizatorului
export function saveUserBooks(userId: string, books: Book[]): void {
  const userData = getUserData(userId)
  userData.books = books
  saveUserData(userData)
}

// Salvează scratchpad-ul utilizatorului
export function saveUserScratchpad(userId: string, scratchpad: string): void {
  const userData = getUserData(userId)
  userData.scratchpad = scratchpad
  saveUserData(userData)
}
