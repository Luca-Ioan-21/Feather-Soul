// app/write/types/auth.ts

export type User = {
  id: string
  email: string
  // NOU: Numele utilizatorului
  name: string 
  password: string
  role: 'user' | 'admin'
  createdAt: string
  lastLogin: string
}

export type UserSession = {
  userId: string 
  email: string
  // NOU: Numele utilizatorului în sesiune
  name: string
  role: 'user' | 'admin'
  loginTime: string
}