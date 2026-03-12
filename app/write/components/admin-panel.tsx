"use client"

import { useState, useEffect, useMemo } from "react"
import { getUsers, updateUserRole, deleteUser, isAdmin, getCurrentSession, updateUserEmail, resetPassword } from "../lib/auth" 
// Presupunem că getUserData este disponibil din ../lib/storage
import { getUserData } from "../lib/storage" 
import type { User } from "../types/auth"
import { Button } from "../../../components/ui/button" 
// ADAUGĂ TRANZIȚIA PE CARD
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card"
import { Badge } from "../../../components/ui/badge"
import { Shield, Trash2, Users, AlertCircle, Mail, Key, Search, SortDesc, SortAsc, Download } from "lucide-react" 
// ADAUGĂ TRANZIȚIA PE DIALOG
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../../components/ui/dialog"


// Cheia sub care vom stoca setările de FILTRARE/SORTARE în localStorage
const STORAGE_KEY = 'adminPanelSettings';

// Funcție helper pentru formatarea sigură a datelor
const formatDate = (isoString: string | undefined): string => {
    if (!isoString) return "Dată necunoscută"
    try {
        const date = new Date(isoString)
        // Verifică dacă data este validă după parsare
        if (isNaN(date.getTime())) {
            return "Dată Invalidă (Lipsă)"
        }
        return date.toLocaleDateString("ro-RO")
    } catch (e) {
        return "Dată Invalidă (Eroare Parsare)"
    }
}

// MODIFICAT: Funcție pentru a citi setările (fără searchQuery) din localStorage
const getInitialSettings = () => {
  if (typeof window !== 'undefined') {
    const savedSettings = localStorage.getItem(STORAGE_KEY);
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        // Se asigură că se folosesc doar cheile relevante, ignorând searchQuery
        return {
            roleFilter: parsed.roleFilter || "all",
            sortBy: parsed.sortBy || "createdAt",
            sortOrder: parsed.sortOrder || "desc",
        };
      } catch (e) {
        console.error("Eroare la parsarea setărilor salvate:", e);
      }
    }
  }
  // Valorile implicite (fără căutare)
  return {
    roleFilter: "all",
    sortBy: "createdAt",
    sortOrder: "desc",
  };
};

// MODIFICAT: Funcție pentru a salva setările curente (fără searchQuery)
const saveSettings = (settings: {
    roleFilter: "all" | "admin" | "user",
    sortBy: "email" | "createdAt" | "lastLogin",
    sortOrder: "asc" | "desc",
}) => {
    if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    }
};


export function AdminPanel() {
  const [users, setUsers] = useState<User[]>([])
  const [currentSession, setCurrentSession] = useState(getCurrentSession())
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [error, setError] = useState("")

  // STĂRI NOI: Schimbare Email
  const [emailDialogOpen, setEmailDialogOpen] = useState(false)
  const [userToEditEmail, setUserToEditEmail] = useState<User | null>(null)
  const [newEmailInput, setNewEmailInput] = useState("")

  // STĂRI NOI: Resetare Parolă
  const [resetPassDialogOpen, setResetPassDialogOpen] = useState(false)
  const [userToResetPass, setUserToResetPass] = useState<User | null>(null)
  const [newPasswordInput, setNewPasswordInput] = useState("")

  // NOU: INIȚIALIZEAZĂ CU SETĂRILE SALVATE
  const initialSettings = getInitialSettings();
  
  // searchQuery NU mai este persistat, revine la "" la fiecare încărcare
  const [searchQuery, setSearchQuery] = useState("") 

  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "user">(initialSettings.roleFilter)
  const [sortBy, setSortBy] = useState<"email" | "createdAt" | "lastLogin">(initialSettings.sortBy)
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">(initialSettings.sortOrder)


  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = () => {
    const allUsers = getUsers()
    setUsers(allUsers)
  }
  
  // NOU: FUNCȚII WRAPPER pentru actualizare și salvare (fără searchQuery)
  const updateFilterAndSortSettings = ({
      newRoleFilter = roleFilter, 
      newSortBy = sortBy, 
      newSortOrder = sortOrder
    }) => {
      const settings = {
        roleFilter: newRoleFilter, 
        sortBy: newSortBy, 
        sortOrder: newSortOrder
      };

      setRoleFilter(newRoleFilter);
      setSortBy(newSortBy);
      setSortOrder(newSortOrder);

      saveSettings(settings);
  };


  // LOGICĂ: Sortare, Filtrare și Căutare a Utilizatorilor
  const sortedAndFilteredUsers = useMemo(() => {
    let filtered = users

    // 1. Filtrare după Rol
    if (roleFilter !== "all") {
      filtered = filtered.filter(user => user.role === roleFilter)
    }

    // 2. Căutare după Email
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(user => user.email.toLowerCase().includes(query))
    }

    // 3. Sortare
    return filtered.sort((a, b) => {
      let aVal: string | number = 0
      let bVal: string | number = 0
      
      if (sortBy === 'email') {
        aVal = a.email.toLowerCase()
        bVal = b.email.toLowerCase()
      } else {
        // Pentru createdAt și lastLogin (stringuri ISO)
        // Folosim fallback-ul de la getUsers, dar aplicăm și aici pentru siguranță
        const aDate = a[sortBy] || a.createdAt
        const bDate = b[sortBy] || b.createdAt
        aVal = new Date(aDate).getTime()
        bVal = new Date(bDate).getTime()
      }

      let comparison = 0
      if (aVal > bVal) {
        comparison = 1
      } else if (aVal < bVal) {
        comparison = -1
      }

      return sortOrder === "asc" ? comparison : comparison * -1
    })
  }, [users, roleFilter, searchQuery, sortBy, sortOrder])


  const handleRoleToggle = (userId: string, currentRole: "admin" | "user") => {
    const newRole = currentRole === "admin" ? "user" : "admin"
    const success = updateUserRole(userId, newRole)

    if (success) {
      loadUsers()
      setError("")
    } else {
      setError("Nu poți retrograda ultimul admin!")
      setTimeout(() => setError(""), 3000)
    }
  }

  // NOU: Deschide dialogul de editare email
  const handleEmailEditClick = (user: User) => {
    setUserToEditEmail(user)
    setNewEmailInput(user.email)
    setEmailDialogOpen(true)
  }

  // NOU: Confirmă actualizarea email-ului
  const handleEmailUpdateConfirm = () => {
    if (!userToEditEmail) return

    if (!newEmailInput.trim() || newEmailInput === userToEditEmail.email) {
        setEmailDialogOpen(false)
        return
    }

    const result = updateUserEmail(userToEditEmail.id, newEmailInput, currentSession)

    if (result === true) {
      loadUsers() 
      setCurrentSession(getCurrentSession()) 
      setError(`Email-ul pentru ${userToEditEmail.email} a fost actualizat cu succes!`)

    } else if (result === "email_exists") {
      setError("Acest email este deja utilizat!")
    } else {
        setError("Eroare la actualizarea email-ului.")
    }

    setTimeout(() => setError(""), 3000)
    setEmailDialogOpen(false)
    setUserToEditEmail(null)
    setNewEmailInput("")
  }

  // NOU: Deschide dialogul de resetare parolă
  const handlePasswordResetClick = (user: User) => {
    setUserToResetPass(user)
    setNewPasswordInput("") // Asigură că input-ul este gol
    setResetPassDialogOpen(true)
  }

  // NOU: Confirmă resetarea parolei
  const handlePasswordResetConfirm = () => {
    if (!userToResetPass || newPasswordInput.length < 6) { 
      setError("Parola trebuie să aibă minim 6 caractere.")
      setTimeout(() => setError(""), 3000)
      return
    }

    const success = resetPassword(userToResetPass.email, newPasswordInput)
    
    if (success) {
        setError(`Parola utilizatorului ${userToResetPass.email} a fost resetată cu succes!`)
    } else {
        setError("Eroare la resetarea parolei.")
    }

    setTimeout(() => setError(""), 3000)
    setResetPassDialogOpen(false)
    setUserToResetPass(null)
    setNewPasswordInput("")
  }

  // NOU: Funcție utilitară pentru a formata datele într-un string lizibil
  const formatUserDataForExport = (userData: any, email: string): string => {
    let output = `========================================================\n`
    output += `RAPORT DATE UTILIZATOR: ${email.toUpperCase()}\n`
    output += `DATA EXPORTULUI: ${formatDate(new Date().toISOString())} ${new Date().toLocaleTimeString("ro-RO")}\n`
    output += `========================================================\n\n`

    // 1. SCRATCHPAD (Notițe Rapide)
    output += `### 1. NOTIȚE RAPIDE (SCRATCHPAD) ###\n`
    output += `--------------------------------------------------------\n`
    output += userData.scratchpad?.content || userData.scratchpad || "Fără conținut în Notițe Rapide.\n" 
    output += `\n\n`

    // 2. CĂRȚI
    if (userData.books && userData.books.length > 0) {
      output += `### 2. CĂRȚI ȘI CONȚINUT ###\n`
      output += `--------------------------------------------------------\n\n`

      userData.books.forEach((book: any, bookIndex: number) => {
        output += `[CARTEA ${bookIndex + 1}: ${book.title.toUpperCase()}] (ID: ${book.id})\n`
        output += `Stare: ${book.isPinned ? "FIXATĂ" : "NORMALĂ"}\n`
        // CORECȚIE: Folosim formatDate
        output += `Creată la: ${formatDate(book.createdAt)}\n` 
        output += `--------------------------------------------------------\n`
        
        // A. REFERINȚE CARTE
        if (book.references || book.characters || book.locations || book.timeline || book.keyItemsLore) {
          output += `--- REFERINȚE CARTE ---\n`
          
          output += `PERSONAJE:\n`
          const characters = book.references?.characters || book.characters
          output += characters?.map((c: any) => `  - ${c.name}: ${c.description || 'Fără descriere'}`).join('\n') || 'Niciun personaj adăugat.'
          output += `\n\n`

          output += `LOCAȚII:\n`
          output += book.references?.locationsContent || book.locations || 'Nicio locație adăugată.'
          output += `\n\n`
          
          output += `CRONOLOGIE:\n`
          output += book.references?.timelineContent || book.timeline || 'Nicio cronologie adăugată.'
          output += `\n\n`
          
          output += `OBIECTE CHEIE:\n`
          output += book.references?.keyItemsLore || book.keyItemsLore || 'Niciun obiect cheie adăugat.'
          output += `\n`
        }
        output += `--------------------------------------------------------\n`


        // B. CAPITOLE
        if (book.chapters && book.chapters.length > 0) {
          book.chapters.forEach((chapter: any, chapterIndex: number) => {
            output += `   CAPITOLUL ${chapterIndex + 1}: ${chapter.title}\n`
            // CORECȚIE: Folosim formatDate și fallback la book.createdAt
            const lastModifiedDate = chapter.lastModified || book.createdAt
            output += `   Ultima Modificare: ${formatDate(lastModifiedDate)}\n` 
            output += `   Conținut:\n`
            output += `   ${chapter.content ? chapter.content.split('\n').map((line: string) => `   ${line}`).join('\n') : 'Fără conținut.'}\n`
            output += `   ........................................................\n`
          })
        } else {
          output += `Fără capitole adăugate în această carte.\n`
        }

        output += `\n\n` // Spațiu între cărți
      })
    } else {
      output += `Fără Cărți găsite.\n`
    }
    
    return output
  }

  // MODIFICAT: Exportă datele utilizatorului ca fișier TXT structurat
  const handleExportData = (userId: string, email: string) => {
      // Presupunem că getUserData colectează TOATE datele utilizatorului.
      const userData = getUserData(userId) 
      
      if (!userData) {
          setError(`Nu s-au găsit date pentru utilizatorul ${email}.`)
          setTimeout(() => setError(""), 3000)
          return
      }

      // APELEAZĂ FUNCȚIA DE FORMATare
      const formattedText = formatUserDataForExport(userData, email)

      // Descarcă ca fișier TXT
      const dataStr = "data:text/plain;charset=utf-8," + encodeURIComponent(formattedText)
      const downloadAnchorNode = document.createElement('a')
      downloadAnchorNode.setAttribute("href", dataStr)
      downloadAnchorNode.setAttribute("download", `date_exportate_${email.replace('@', '_at_')}.txt`) 
      document.body.appendChild(downloadAnchorNode) 
      downloadAnchorNode.click()
      downloadAnchorNode.remove()
      
      setError(`Toate datele (Cărți, Capitole, Referințe și Notițe) pentru ${email} au fost exportate cu succes (.txt)!`) 
      setTimeout(() => setError(""), 3000)
  }

  const handleDeleteClick = (user: User) => {
    setUserToDelete(user)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = () => {
    if (!userToDelete) return

    const success = deleteUser(userToDelete.id)

    if (success) {
      loadUsers()
      setError("Utilizator șters cu succes!")
    } else {
      setError("Nu poți șterge ultimul admin!")
    }

    setTimeout(() => setError(""), 3000)
    setDeleteDialogOpen(false)
    setUserToDelete(null)
  }

  if (!currentSession || !isAdmin(currentSession)) {
    return (
      <Card className="transition-colors duration-500 ease-in-out">
        <CardContent className="pt-6 transition-colors duration-500 ease-in-out">
          <div className="flex items-center gap-2 text-red-500 transition-colors duration-500 ease-in-out">
            <AlertCircle className="h-5 w-5 transition-colors duration-500 ease-in-out" />
            <p className="transition-colors duration-500 ease-in-out">Nu ai permisiuni de administrator</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const adminCount = users.filter((u) => u.role === "admin").length

  return (
    // APLICĂ TRANZIȚIA PE CONTAINERUL PRINCIPAL
    <div className="space-y-4 transition-colors duration-500 ease-in-out">
      {/* APLICĂ TRANZIȚIA PE CARD */}
      <Card className="transition-colors duration-500 ease-in-out">
        <CardHeader className="transition-colors duration-500 ease-in-out">
          <div className="flex items-center gap-2 transition-colors duration-500 ease-in-out">
            <Shield className="h-5 w-5 text-amber-500 transition-colors duration-500 ease-in-out" />
            <CardTitle className="transition-colors duration-500 ease-in-out">Panou de Administrare</CardTitle>
          </div>
          <CardDescription className="transition-colors duration-500 ease-in-out">Gestionează utilizatorii și administratorii aplicației</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Info Box */}
          <div className="flex items-center gap-4 mb-4 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-md border border-amber-200 dark:border-amber-800 transition-colors duration-500 ease-in-out">
            <Users className="h-5 w-5 text-amber-600 transition-colors duration-500 ease-in-out" />
            <div>
              <p className="text-sm font-medium transition-colors duration-500 ease-in-out">Total utilizatori: {users.length}</p>
              <p className="text-xs text-muted-foreground transition-colors duration-500 ease-in-out">
                Administratori: {adminCount} | Utilizatori: {users.length - adminCount}
              </p>
            </div>
          </div>

          {/* Mesaj Eroare/Succes */}
          {error && (
            <div className={`flex items-center gap-2 text-sm p-3 rounded-md mb-4 ${error.includes("succes") ? "text-green-600 bg-green-50 dark:bg-green-950/20 border-green-200" : "text-red-500 bg-red-50 dark:bg-red-950/20 border-red-200"} border transition-colors duration-500 ease-in-out`}>
              <AlertCircle className="h-4 w-4 flex-shrink-0 transition-colors duration-500 ease-in-out" />
              <span className="transition-colors duration-500 ease-in-out">{error}</span>
            </div>
          )}
          
          {/* NOU: Panou de Căutare, Filtrare și Sortare - APLICĂ TRANZIȚIA PE CONTAINER */}
          <div className="flex flex-wrap gap-4 mb-4 transition-colors duration-500 ease-in-out">
            {/* Căutare */}
            <div className="relative flex-1 min-w-[200px] max-w-xs transition-colors duration-500 ease-in-out">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors duration-500 ease-in-out" />
              <input
                type="text"
                placeholder="Caută după email..."
                value={searchQuery}
                // NEMODIFICAT: Folosește setSearchQuery
                onChange={(e) => setSearchQuery(e.target.value)}
                // APLICĂ TRANZIȚIA PE INPUT
                className="flex h-9 w-full rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors duration-500 ease-in-out"
              />
            </div>
            
            {/* Filtru Rol - APLICĂ TRANZIȚIA PE SELECT */}
            <select
              value={roleFilter}
              // MODIFICAT: Folosește updateFilterAndSortSettings
              onChange={(e) => updateFilterAndSortSettings({ newRoleFilter: e.target.value as "all" | "admin" | "user" })}
              className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors duration-500 ease-in-out"
            >
              <option value="all">Toate Rolurile</option>
              <option value="admin">Admini</option>
              <option value="user">Utilizatori</option>
            </select>
            
            {/* Sortare după - APLICĂ TRANZIȚIA PE SELECT */}
            <select
              value={sortBy}
              // MODIFICAT: Folosește updateFilterAndSortSettings
              onChange={(e) => updateFilterAndSortSettings({ newSortBy: e.target.value as "email" | "createdAt" | "lastLogin" })}
              className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors duration-500 ease-in-out"
            >
              <option value="createdAt">Sortare: Data Creării</option>
              <option value="lastLogin">Sortare: Ultima Autentificare</option>
              <option value="email">Sortare: Email</option>
            </select>
            
            {/* Ordine Sortare - APLICĂ TRANZIȚIA PE BUTON */}
            <Button
              variant="outline"
              size="icon"
              // MODIFICAT: Folosește updateFilterAndSortSettings
              onClick={() => updateFilterAndSortSettings({ newSortOrder: sortOrder === "asc" ? "desc" : "asc" })}
              className="transition-colors duration-500 ease-in-out"
            >
              {sortOrder === "desc" ? (
                <SortDesc className="h-4 w-4 transition-colors duration-500 ease-in-out" />
              ) : (
                <SortAsc className="h-4 w-4 transition-colors duration-500 ease-in-out" />
              )}
            </Button>
          </div>
          {/* SFÂRȘIT NOU: Panou de Căutare, Filtrare și Sortare */}


          {/* Lista de Utilizatori (cu scroll) */}
          <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
            {sortedAndFilteredUsers.length > 0 ? (
              sortedAndFilteredUsers.map((user) => (
                <div
                  key={user.id}
                  // ADAUGĂ TRANZIȚIA PE ITEM
                  className="flex items-center justify-between p-3 border rounded-md hover:bg-accent/50 transition-colors duration-500 ease-in-out"
                >
                  <div className="flex-1 min-w-0 transition-colors duration-500 ease-in-out">
                    <div className="flex items-center gap-2 transition-colors duration-500 ease-in-out">
                      <p className="font-medium truncate transition-colors duration-500 ease-in-out">{user.email}</p>
                      <Badge variant={user.role === "admin" ? "default" : "secondary"} className="flex-shrink-0 transition-colors duration-500 ease-in-out">
                        {user.role === "admin" ? "Admin" : "Utilizator"}
                      </Badge>
                      {currentSession && user.id === currentSession.userId && (
                        <Badge variant="outline" className="text-xs flex-shrink-0 transition-colors duration-500 ease-in-out">
                          Tu
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate transition-colors duration-500 ease-in-out">
                      Creat: {formatDate(user.createdAt)}
                      {user.lastLogin && (
                        <> • Ultima autentificare: {formatDate(user.lastLogin)}</>
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 transition-colors duration-500 ease-in-out">
                    {/* NOU: Buton de Export Date */}
                    <Button
                      variant="outline"
                      size="icon"
                      title="Exportă toate datele (TXT)"
                      onClick={() => handleExportData(user.id, user.email)}
                      className="transition-colors duration-500 ease-in-out"
                    >
                      <Download className="h-4 w-4 transition-colors duration-500 ease-in-out" />
                    </Button>
                    
                    {/* NOU: Buton de Resetare Parolă */}
                    <Button
                      variant="outline"
                      size="icon"
                      title="Resetează Parola"
                      onClick={() => handlePasswordResetClick(user)}
                      className="transition-colors duration-500 ease-in-out"
                    >
                      <Key className="h-4 w-4 transition-colors duration-500 ease-in-out" />
                    </Button>

                    {/* Buton de Editare Email */}
                    <Button
                      variant="outline"
                      size="icon" 
                      title="Schimbă Email"
                      onClick={() => handleEmailEditClick(user)}
                      className="transition-colors duration-500 ease-in-out"
                    >
                      <Mail className="h-4 w-4 transition-colors duration-500 ease-in-out" />
                    </Button>

                    {/* Buton de Schimbare Rol */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRoleToggle(user.id, user.role)}
                      disabled={user.id === currentSession.userId}
                      className="transition-colors duration-500 ease-in-out"
                    >
                      {user.role === "admin" ? "Retrogradează" : "Promovează Admin"}
                    </Button>

                    {/* Buton de Ștergere */}
                    <Button
                      variant="destructive"
                      size="icon" 
                      onClick={() => handleDeleteClick(user)}
                      disabled={user.id === currentSession.userId}
                      className="transition-colors duration-500 ease-in-out"
                    >
                      <Trash2 className="h-4 w-4 transition-colors duration-500 ease-in-out" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground pt-4 transition-colors duration-500 ease-in-out">Niciun utilizator găsit.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialog pentru schimbarea email-ului - APLICĂ TRANZIȚIA */}
      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent className="transition-colors duration-500 ease-in-out">
          <DialogHeader>
            <DialogTitle className="transition-colors duration-500 ease-in-out">Schimbă Adresa de Email</DialogTitle>
            <DialogDescription className="transition-colors duration-500 ease-in-out">
              Introdu noua adresă de email pentru utilizatorul <span className="font-semibold transition-colors duration-500 ease-in-out">{userToEditEmail?.email}</span>.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 transition-colors duration-500 ease-in-out">
            <input
              type="email"
              value={newEmailInput}
              onChange={(e) => setNewEmailInput(e.target.value)}
              placeholder="Noua adresă de email"
              // APLICĂ TRANZIȚIA PE INPUT
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors duration-500 ease-in-out"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailDialogOpen(false)} className="transition-colors duration-500 ease-in-out">
              Anulează
            </Button>
            <Button onClick={handleEmailUpdateConfirm} disabled={!newEmailInput.trim()} className="transition-colors duration-500 ease-in-out">
              Salvează Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* Dialog pentru resetarea parolei - APLICĂ TRANZIȚIA */}
      <Dialog open={resetPassDialogOpen} onOpenChange={setResetPassDialogOpen}>
        <DialogContent className="transition-colors duration-500 ease-in-out">
          <DialogHeader>
            <DialogTitle className="transition-colors duration-500 ease-in-out">Resetează Parola</DialogTitle>
            <DialogDescription className="transition-colors duration-500 ease-in-out">
              Setează o nouă parolă temporară pentru utilizatorul <span className="font-semibold transition-colors duration-500 ease-in-out">{userToResetPass?.email}</span>.
              (Minim 6 caractere)
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 transition-colors duration-500 ease-in-out">
            <input
              type="password"
              value={newPasswordInput}
              onChange={(e) => setNewPasswordInput(e.target.value)}
              placeholder="Noua parolă (ex: Temp123!)"
              // APLICĂ TRANZIȚIA PE INPUT
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors duration-500 ease-in-out"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetPassDialogOpen(false)} className="transition-colors duration-500 ease-in-out">
              Anulează
            </Button>
            <Button onClick={handlePasswordResetConfirm} disabled={newPasswordInput.length < 6} className="transition-colors duration-500 ease-in-out">
              Resetează Parola
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog pentru ștergere - APLICĂ TRANZIȚIA */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="transition-colors duration-500 ease-in-out">
          <DialogHeader>
            <DialogTitle className="transition-colors duration-500 ease-in-out">Confirmare Ștergere</DialogTitle>
            <DialogDescription className="transition-colors duration-500 ease-in-out">
              Ești sigur că vrei să ștergi utilizatorul <span className="font-semibold transition-colors duration-500 ease-in-out">{userToDelete?.email}</span>?
              <br />
              <span className="text-red-500 transition-colors duration-500 ease-in-out">
                Această acțiune va șterge permanent toate datele utilizatorului (cărți, personaje, etc.)
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} className="transition-colors duration-500 ease-in-out">
              Anulează
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} className="transition-colors duration-500 ease-in-out">
              Șterge Utilizator
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}