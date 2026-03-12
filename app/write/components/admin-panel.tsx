"use client"

import { useState, useEffect, useMemo } from "react"
import { getUsers, updateUserRole, deleteUser, isAdmin, getCurrentSession, updateUserEmail, resetPassword } from "../lib/auth" 
import { getUserData } from "../lib/storage" 
import type { User } from "../types/auth"
import { Button } from "../../../components/ui/button" 
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card"
import { Badge } from "../../../components/ui/badge"
import { Shield, Trash2, Users, AlertCircle, Mail, Key, Search, SortDesc, SortAsc, Download } from "lucide-react" 
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../../components/ui/dialog"

const STORAGE_KEY = 'adminPanelSettings';

const formatDate = (isoString: string | undefined): string => {
    if (!isoString) return "Dată necunoscută"
    try {
        const date = new Date(isoString)
        if (isNaN(date.getTime())) return "Dată Invalidă"
        return date.toLocaleDateString("ro-RO")
    } catch (e) {
        return "Eroare Dată"
    }
}

const getInitialSettings = () => {
  if (typeof window !== 'undefined') {
    const savedSettings = localStorage.getItem(STORAGE_KEY);
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        return {
            roleFilter: parsed.roleFilter || "all",
            sortBy: parsed.sortBy || "createdAt",
            sortOrder: parsed.sortOrder || "desc",
        };
      } catch (e) {
        console.error("Eroare la parsarea setărilor:", e);
      }
    }
  }
  return { roleFilter: "all", sortBy: "createdAt", sortOrder: "desc" };
};

const saveSettings = (settings: any) => {
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

  const [emailDialogOpen, setEmailDialogOpen] = useState(false)
  const [userToEditEmail, setUserToEditEmail] = useState<User | null>(null)
  const [newEmailInput, setNewEmailInput] = useState("")

  const [resetPassDialogOpen, setResetPassDialogOpen] = useState(false)
  const [userToResetPass, setUserToResetPass] = useState<User | null>(null)
  const [newPasswordInput, setNewPasswordInput] = useState("")

  const initialSettings = useMemo(() => getInitialSettings(), []);
  const [searchQuery, setSearchQuery] = useState("") 
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "user">(initialSettings.roleFilter)
  const [sortBy, setSortBy] = useState<"email" | "createdAt" | "lastLogin">(initialSettings.sortBy)
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">(initialSettings.sortOrder)

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = () => {
    const allUsers = getUsers() || []
    setUsers(allUsers)
  }
  
  const updateFilterAndSortSettings = ({
      newRoleFilter = roleFilter, 
      newSortBy = sortBy, 
      newSortOrder = sortOrder
    }) => {
      const settings = { roleFilter: newRoleFilter, sortBy: newSortBy, sortOrder: newSortOrder };
      setRoleFilter(newRoleFilter);
      setSortBy(newSortBy);
      setSortOrder(newSortOrder);
      saveSettings(settings);
  };

  const sortedAndFilteredUsers = useMemo(() => {
    let filtered = [...users]
    if (roleFilter !== "all") {
      filtered = filtered.filter(user => user.role === roleFilter)
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(user => user.email.toLowerCase().includes(query))
    }
    return filtered.sort((a, b) => {
      let aVal: any, bVal: any;
      if (sortBy === 'email') {
        aVal = a.email.toLowerCase(); bVal = b.email.toLowerCase();
      } else {
        aVal = new Date(a[sortBy] || a.createdAt || 0).getTime();
        bVal = new Date(b[sortBy] || b.createdAt || 0).getTime();
      }
      return sortOrder === "asc" ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
    })
  }, [users, roleFilter, searchQuery, sortBy, sortOrder])

  const handleRoleToggle = (userId: string, currentRole: "admin" | "user") => {
    const newRole = currentRole === "admin" ? "user" : "admin"
    const success = updateUserRole(userId, newRole)
    if (success) { loadUsers(); setError(""); }
    else { setError("Nu poți retrograda ultimul admin!"); setTimeout(() => setError(""), 3000); }
  }

  const handleEmailEditClick = (user: User) => {
    setUserToEditEmail(user); setNewEmailInput(user.email); setEmailDialogOpen(true);
  }

  const handleEmailUpdateConfirm = () => {
    if (!userToEditEmail || !currentSession) return
    if (!newEmailInput.trim() || newEmailInput === userToEditEmail.email) {
        setEmailDialogOpen(false); return;
    }
    const result = updateUserEmail(userToEditEmail.id, newEmailInput, currentSession)
    if (result === true) {
      loadUsers(); setCurrentSession(getCurrentSession()); setError(`Email actualizat cu succes!`);
    } else if (result === "email_exists") {
      setError("Acest email este deja utilizat!");
    } else {
      setError("Eroare la actualizarea email-ului.");
    }
    setTimeout(() => setError(""), 3000); setEmailDialogOpen(false);
  }

  const handlePasswordResetClick = (user: User) => {
    setUserToResetPass(user); setNewPasswordInput(""); setResetPassDialogOpen(true);
  }

  const handlePasswordResetConfirm = () => {
    if (!userToResetPass || newPasswordInput.length < 6) { 
      setError("Parola trebuie să aibă minim 6 caractere.");
      setTimeout(() => setError(""), 3000); return;
    }
    const success = resetPassword(userToResetPass.email, newPasswordInput)
    if (success) setError(`Parola resetată cu succes!`);
    else setError("Eroare la resetarea parolei.");
    setTimeout(() => setError(""), 3000); setResetPassDialogOpen(false);
  }

  const handleExportData = (userId: string, email: string) => {
      const userData = getUserData(userId) 
      if (!userData) {
          setError(`Nu s-au găsit date.`); setTimeout(() => setError(""), 3000); return;
      }
      const formattedText = `RAPORT DATE UTILIZATOR: ${email}\nData: ${new Date().toLocaleString()}\n...Date exportate...`;
      const dataStr = "data:text/plain;charset=utf-8," + encodeURIComponent(formattedText)
      const downloadAnchorNode = document.createElement('a')
      downloadAnchorNode.setAttribute("href", dataStr)
      downloadAnchorNode.setAttribute("download", `export_${email}.txt`) 
      document.body.appendChild(downloadAnchorNode); downloadAnchorNode.click(); downloadAnchorNode.remove();
      setError(`Date exportate cu succes!`); setTimeout(() => setError(""), 3000);
  }

  const handleDeleteClick = (user: User) => { setUserToDelete(user); setDeleteDialogOpen(true); }

  const handleDeleteConfirm = () => {
    if (!userToDelete) return
    const success = deleteUser(userToDelete.id)
    if (success) { loadUsers(); setError("Utilizator șters!"); }
    else setError("Eroare la ștergere.");
    setTimeout(() => setError(""), 3000); setDeleteDialogOpen(false);
  }

  if (!currentSession || !isAdmin(currentSession)) {
    return (
      <Card className="transition-colors duration-500 ease-in-out">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-red-500">
            <AlertCircle className="h-5 w-5" />
            <p>Nu ai permisiuni de administrator</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const adminCount = users.filter((u) => u.role === "admin").length

  return (
    <div className="space-y-4 transition-colors duration-500 ease-in-out">
      <Card className="transition-colors duration-500 ease-in-out">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-amber-500" />
            <CardTitle>Panou de Administrare</CardTitle>
          </div>
          <CardDescription>Gestionează utilizatorii aplicației</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-md border border-amber-200 transition-colors duration-500">
            <Users className="h-5 w-5 text-amber-600" />
            <div>
              <p className="text-sm font-medium">Total: {users.length}</p>
              <p className="text-xs text-muted-foreground">Admini: {adminCount} | Useri: {users.length - adminCount}</p>
            </div>
          </div>

          {error && (
            <div className={`p-3 rounded-md mb-4 text-sm border ${error.includes("succes") ? "bg-green-50 text-green-600" : "bg-red-50 text-red-50"}`}>
              {error}
            </div>
          )}
          
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Caută email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-md border pl-10 pr-3 py-2 text-sm transition-colors duration-500"
              />
            </div>
            
            <select
              value={roleFilter}
              onChange={(e) => updateFilterAndSortSettings({ newRoleFilter: e.target.value as any })}
              className="rounded-md border p-2 text-sm transition-colors duration-500"
            >
              <option value="all">Toate Rolurile</option>
              <option value="admin">Admini</option>
              <option value="user">Utilizatori</option>
            </select>
            
            <Button
              variant="outline"
              onClick={() => updateFilterAndSortSettings({ newSortOrder: sortOrder === "asc" ? "desc" : "asc" })}
            >
              {sortOrder === "desc" ? <SortDesc className="h-4 w-4" /> : <SortAsc className="h-4 w-4" />}
            </Button>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {sortedAndFilteredUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-3 border rounded-md transition-colors duration-500 hover:bg-accent/50">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">{user.email}</p>
                    <Badge variant={user.role === "admin" ? "default" : "secondary"}>{user.role}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">Creat: {formatDate(user.createdAt)}</p>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" onClick={() => handleExportData(user.id, user.email)}><Download className="h-4 w-4" /></Button>
                  <Button variant="outline" size="icon" onClick={() => handlePasswordResetClick(user)}><Key className="h-4 w-4" /></Button>
                  <Button variant="outline" size="icon" onClick={() => handleEmailEditClick(user)}><Mail className="h-4 w-4" /></Button>
                  <Button 
                    variant="destructive" 
                    size="icon" 
                    onClick={() => handleDeleteClick(user)}
                    disabled={user.id === currentSession?.userId}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Schimbă Email</DialogTitle></DialogHeader>
          <input 
            type="email" 
            value={newEmailInput} 
            onChange={(e) => setNewEmailInput(e.target.value)}
            className="w-full border p-2 rounded-md"
          />
          <DialogFooter>
            <Button onClick={handleEmailUpdateConfirm}>Salvează</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Confirmă Ștergerea</DialogTitle></DialogHeader>
          <p>Ești sigur că vrei să ștergi utilizatorul {userToDelete?.email}?</p>
          <DialogFooter>
            <Button variant="destructive" onClick={handleDeleteConfirm}>Șterge</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
