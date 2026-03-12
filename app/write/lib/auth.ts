// app/write/lib/auth.ts

import type { User, UserSession } from "../types/auth" // Folosește tipurile actualizate

// Simple hash function (pentru producție, folosește bcrypt sau similar)
function hashPassword(password: string): string {
  // Simplu hash pentru demo - în producție folosește bcrypt
  let hash = 0
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash
  }
  return hash.toString(36)
}

// Obține toți utilizatorii (MODIFICAT: Adaugă fallback pentru 'name')
export function getUsers(): User[] {
  if (typeof window === "undefined") return []
  const usersJson = localStorage.getItem("users")
  
  // CORECȚIE: Asigură-te că lastLogin și NOU: name sunt întotdeauna prezente (fallback)
  return usersJson 
    ? (JSON.parse(usersJson) as User[]).map(user => ({
        ...user,
        lastLogin: user.lastLogin || user.createdAt,
        // NOU: Fallback pentru nume (folosește prima parte a email-ului dacă lipsește)
        name: user.name || (user.email.split('@')[0] || "Utilizator").toUpperCase(), 
    })) 
    : []
}

// Salvează utilizatorii
function saveUsers(users: User[]): void {
  if (typeof window === "undefined") return
  localStorage.setItem("users", JSON.stringify(users))
}

// Inițializare admin predefinit (MODIFICAT: adaugă nume)
export function initializeDefaultAdmin(): void {
  if (typeof window === "undefined") return
  const users = getUsers()
  const adminExists = users.some((u) => u.role === "admin")

  if (!adminExists) {
    const defaultAdmin: User = {
      id: "admin-default",
      email: "admin@journalscris.ro",
      name: "Admin Default", // <--- ADAUGAT
      password: hashPassword("Admin123!"),
      role: "admin",
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(), 
    }
    users.push(defaultAdmin)
    saveUsers(users)
  }
}

// Login (MODIFICAT: salvează numele în sesiune)
export function login(email: string, password: string): UserSession | null {
  const users = getUsers()
  const hashedPassword = hashPassword(password)
  const user = users.find((u) => u.email === email && u.password === hashedPassword)

  if (user) {
    // Actualizează last login
    user.lastLogin = new Date().toISOString()
    saveUsers(users)

    const session: UserSession = {
      userId: user.id,
      email: user.email,
      name: user.name, // <--- ADAUGAT
      role: user.role,
      loginTime: new Date().toISOString(),
    }

    // Salvează sesiunea (folosește "currentUser" conform codului tău inițial)
    localStorage.setItem("currentUser", JSON.stringify(session))
    return session
  }

  return null
}

/**
 * Register (MODIFICAT: acceptă 'name' ca prim argument)
 */
export function register(name: string, email: string, password: string): UserSession | null {
  const users = getUsers()

  // Verifică dacă emailul există deja
  if (users.some((u) => u.email === email)) {
    return null
  }

  const newUser: User = {
    id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    email,
    name, // <--- ADAUGAT
    password: hashPassword(password),
    role: "user",
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(), 
  }

  users.push(newUser)
  saveUsers(users)

  // Auto-login după register
  return login(email, password)
}

// Logout
export function logout(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem("currentUser")
}

// Obține sesiunea curentă (MODIFICAT: asigură-te că sesiunea are 'name')
export function getCurrentSession(): UserSession | null {
  if (typeof window === "undefined") return null
  const sessionJson = localStorage.getItem("currentUser")
  
  if (sessionJson) {
      const session = JSON.parse(sessionJson) as UserSession

      // NOU: Asigură-te că sesiunea are 'name' (pentru compatibilitate)
      if (!session.name || session.name === session.email) { 
          const user = getUsers().find(u => u.id === session.userId)
          if (user) {
              session.name = user.name
              // Actualizează sesiunea în localStorage pentru a include numele
              localStorage.setItem("currentUser", JSON.stringify(session))
          }
      }
      return session
  }
  return null
}

// Verifică dacă utilizatorul este admin
export function isAdmin(session: UserSession | null): boolean {
  return session?.role === "admin"
}


// NOU: Funcție pentru a verifica parola (necesară pentru dialogul de confirmare)
export function checkPassword(userId: string, password: string): boolean {
  const users = getUsers()
  const user = users.find((u) => u.id === userId)

  if (!user) return false

  const hashedPassword = hashPassword(password)

  // Compara hash-ul parolei introduse cu hash-ul stocat
  return user.password === hashedPassword
}


/**
 * Schimbă parola utilizatorului.
 */
export function changePassword(userId: string, oldPassword: string, newPassword: string): boolean | "wrong_password" {
  const users = getUsers()
  const userIndex = users.findIndex((u) => u.id === userId)

  if (userIndex === -1) return false

  const user = users[userIndex]
  const hashedPassword = hashPassword(oldPassword)

  // 1. Verifică parola veche
  if (user.password !== hashedPassword) {
    return "wrong_password"
  }

  // 2. Hash-uiește și setează noua parolă
  users[userIndex].password = hashPassword(newPassword)
  
  // 3. Salvează lista actualizată de utilizatori
  saveUsers(users)

  return true
}

/**
 * NOU: Actualizează Numele și Adresa de Email a unui utilizator.
 * Înlocuiește funcția 'updateUserEmail' din codul tău vechi.
 */
export function updateUserProfile(userId: string, newName: string, newEmail: string, currentSession: UserSession | null): boolean | "email_exists" {
  const users = getUsers()
  const userIndex = users.findIndex((u) => u.id === userId)

  if (userIndex === -1) return false

  const user = users[userIndex]
  
  // 1. Verifică dacă noul email există deja la alt utilizator
  if (newEmail.toLowerCase() !== user.email.toLowerCase() && users.some((u, index) => u.email.toLowerCase() === newEmail.toLowerCase() && index !== userIndex)) {
    return "email_exists"
  }

  // 2. Actualizează Numele și Emailul
  user.name = newName
  user.email = newEmail
  saveUsers(users)
  
  // 3. Dacă utilizatorul își schimbă propriul profil, actualizează sesiunea curentă
  if (currentSession && currentSession.userId === userId) {
    const updatedSession: UserSession = {
      ...currentSession,
      name: newName, // <--- ADAUGAT
      email: newEmail,
    }
    localStorage.setItem("currentUser", JSON.stringify(updatedSession))
  }
  
  return true
}

// Actualizează rolul utilizatorului (doar admin)
export function updateUserRole(userId: string, newRole: "admin" | "user"): boolean {
  const users = getUsers()
  const userIndex = users.findIndex((u) => u.id === userId)

  if (userIndex === -1) return false

  // Verifică să nu rămână fără admin
  if (newRole === "user") {
    const adminCount = users.filter((u) => u.role === "admin").length
    if (adminCount <= 1) {
      return false // Nu permite retrogradarea ultimului admin
    }
  }

  users[userIndex].role = newRole
  saveUsers(users)
  return true
}

// Șterge utilizator (doar admin)
export function deleteUser(userId: string): boolean {
  const users = getUsers()
  const user = users.find((u) => u.id === userId)

  if (!user) return false

  // Nu permite ștergerea ultimului admin
  if (user.role === "admin") {
    const adminCount = users.filter((u) => u.role === "admin").length
    if (adminCount <= 1) {
      return false
    }
  }

  const filteredUsers = users.filter((u) => u.id !== userId)
  saveUsers(filteredUsers)

  // Șterge și datele utilizatorului 
  localStorage.removeItem(`userData_${userId}`)
  return true
}


/**
 * Resetează parola utilizatorului.
 */
export function resetPassword(email: string, newPassword: string): boolean {
  const users = getUsers()
  const userIndex = users.findIndex((u) => u.email === email)

  if (userIndex === -1) {
    // Email-ul nu a fost găsit
    return false
  }

  // Hash-uiește noua parolă înainte de a o salva
  users[userIndex].password = hashPassword(newPassword)
  
  // Salvează lista actualizată de utilizatori
  saveUsers(users)

  return true
}