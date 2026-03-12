// components/user-profile-panel.tsx

"use client"

import { useState, useRef, useEffect } from "react" 
import { getCurrentSession, updateUserProfile, deleteUser, changePassword } from "../lib/auth" 
import { getUserData, saveUserData } from "../lib/storage" 
import { Button } from "../../../components/ui/button" 
import { Input } from "../../../components/ui/input"
import { Label } from "../../../components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card"
import { AlertCircle, User, Mail, Lock, Trash2, Download, Upload, CheckCircle, Save, PaintBucket } from "lucide-react" 
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../../components/ui/dialog"
import { useRouter } from "next/navigation"
import { DeleteConfirmationDialog } from "./delete-confirmation-dialog" 

// -------------------------------------------------------------
// LOGICA ȘI UI-UL PENTRU SCHIMBAREA TEMELOR (ADMIN ONLY)
// -------------------------------------------------------------

// NOU: Cheie de localStorage pentru a memora MODUL (light/dark)
const APP_MODE_KEY = 'app-mode'

// Definiția temelor extinse (INCLUSIV NOILE CULORI)
const THEME_OPTIONS = {
    light: [
      { id: 'alb', name: 'Alb (Implicit)', backgroundColor: 'oklch(1 0 0)' },
      { id: 'cream', name: 'Crem', backgroundColor: 'oklch(0.985 0.01 70)' },
      { id: 'vernil', name: 'Vernil (Verde pal)', backgroundColor: 'oklch(0.95 0.05 140)' },
      { id: 'pearl', name: 'Pearl (Sidef)', backgroundColor: 'oklch(0.97 0.005 300)' },
      { id: 'blush', name: 'Roz Pal (Blush)', backgroundColor: 'oklch(0.97 0.01 15)' },
      { id: 'blue_dust', name: 'Albastru Prafuit', backgroundColor: 'oklch(0.92 0.04 250)' },
      { id: 'linen', name: 'Gri Deschis Cald (Linen)', backgroundColor: 'oklch(0.96 0.008 85)' },
    ],
    dark: [
      { id: 'negru', name: 'Negru (Implicit)', backgroundColor: 'oklch(0.145 0 0)' },
      { id: 'navy', name: 'Navy (Indigo Profund)', backgroundColor: 'oklch(0.20 0.06 270)' },
      { id: 'midnight', name: 'Midnight (Gri-Albăstrui)', backgroundColor: 'oklch(0.10 0.03 270)' },
      { id: 'dark_cinder', name: 'Cenușiu Întunecat', backgroundColor: 'oklch(0.18 0.01 90)' },
      { id: 'dark_forest', name: 'Verde Forestier Închis', backgroundColor: 'oklch(0.15 0.06 145)' },
      { id: 'espresso', name: 'Maro Espresso', backgroundColor: 'oklch(0.17 0.08 75)' },
      { id: 'night_blue', name: 'Albastru Nocturn', backgroundColor: 'oklch(0.12 0.04 235)' },
    ]
}

// Determină dacă o temă este Dark (actualizată cu noile ID-uri)
const isThemeDark = (themeName: string) => THEME_OPTIONS.dark.map(t => t.id).includes(themeName)

// Obține tema salvată pentru un mod specific (Light sau Dark)
const getSavedThemeForMode = (isDark: boolean) => {
    const key = isDark ? 'app-theme-dark' : 'app-theme-light'
    // Folosește prima temă din listă ca default
    const defaultTheme = isDark ? THEME_OPTIONS.dark[0].id : THEME_OPTIONS.light[0].id
    return localStorage.getItem(key) || defaultTheme
}

// Aplică tema și o salvează în cheia corectă (app-theme-light/dark) ȘI 'app-mode'
const applyTheme = (themeName: string, saveToStorage: boolean = true) => {
    const root = document.documentElement
    const isDarkTheme = isThemeDark(themeName)
    const mode = isDarkTheme ? "dark" : "light" 

    // 1. GESTIONAREA LIGHT/DARK MODE (clasa .dark)
    root.classList.toggle('dark', isDarkTheme)

    // 2. GESTIONAREA CULORII SPECIFICE (data-theme)
    // Folosește 'default' pentru alb și negru, altfel folosește ID-ul temei
    const dataTheme = (themeName === 'alb' || themeName === 'negru') ? 'default' : themeName
    root.setAttribute('data-theme', dataTheme)
    
    // 3. SALVARE ÎN LOCALSTORAGE (folosește cheia specifică modului ȘI cheia modului)
    if (saveToStorage) {
        const key = isDarkTheme ? 'app-theme-dark' : 'app-theme-light' 
        localStorage.setItem(key, themeName)
        localStorage.setItem(APP_MODE_KEY, mode) 
    }
}

// Funcție ajutătoare: Determină modul (Light/Dark) din clasa <html>
const isHtmlElementDark = () => document.documentElement.classList.contains('dark')


export const UserProfilePanel = ({ onClose }: { onClose: () => void }) => {
  const router = useRouter()
  const [currentSession, setCurrentSession] = useState(getCurrentSession()) 
  
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Inițializare pe baza stării curente a HTML-ului
  const initialIsDark = isHtmlElementDark()
  const initialTheme = getSavedThemeForMode(initialIsDark)
  
  const [currentTheme, setCurrentTheme] = useState(initialTheme) 
  const [isCurrentModeDark, setIsCurrentModeDark] = useState(initialIsDark) 
  
  // ... (restul state-urilor)
  const [importError, setImportError] = useState("")
  const [importSuccess, setImportSuccess] = useState("") 
  const [profileDialogOpen, setProfileDialogOpen] = useState(false) 
  const [newNameInput, setNewNameInput] = useState(currentSession?.name || currentSession?.email.split('@')[0] || "") 
  const [newEmailInput, setNewEmailInput] = useState(currentSession?.email || "")
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)
  const [oldPasswordInput, setOldPasswordInput] = useState("")
  const [newPasswordInput, setNewPasswordInput] = useState("")
  const [confirmNewPasswordInput, setConfirmNewPasswordInput] = useState("")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false) 
  const oldPasswordRef = useRef<HTMLInputElement>(null)
  const newPasswordRef = useRef<HTMLInputElement>(null)
  const confirmNewPasswordRef = useRef<HTMLInputElement>(null)
  const changePasswordButtonRef = useRef<HTMLButtonElement>(null) 
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null) 
  const fileInputRef = useRef<HTMLInputElement>(null) 
  
  // UseEffect pentru a asculta clasa 'dark' pe <html> (MutationObserver)
  useEffect(() => {
      const targetNode = document.documentElement;
      const config = { attributes: true, attributeFilter: ['class'] }; 

      const callback = function(mutationsList: MutationRecord[]) {
          for(const mutation of mutationsList) {
              if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                  const newIsDark = targetNode.classList.contains('dark');
                  
                  // 1. Actualizează starea Modului (Light/Dark)
                  setIsCurrentModeDark(newIsDark);
                  
                  // 2. Logica de sincronizare a temei afișate:
                  const themeToApply = getSavedThemeForMode(newIsDark)
                  
                  // Aplică tema specifică modului (pentru a seta data-theme corect), dar NU o salvează din nou.
                  applyTheme(themeToApply, false) 
                  
                  // Actualizează componenta Panou pentru a afișa tema selectată corect
                  setCurrentTheme(themeToApply)
              }
          }
      };

      const observer = new MutationObserver(callback);
      observer.observe(targetNode, config);

      return () => observer.disconnect();
  }, []); 

  // ... (Funcțiile displayMessage și displayImportMessage)
  const displayMessage = (msg: string, isSuccess: boolean = false) => {
    if (isSuccess) {
      setSuccess(msg)
      setError("")
    } else {
      setError(msg)
      setSuccess("")
    }
    setTimeout(() => {
      setError("")
      setSuccess("")
    }, 4000)
  }
  
  const displayImportMessage = (msg: string, isSuccess: boolean = false) => {
    if (isSuccess) {
      setImportSuccess(msg)
      setImportError("")
    } else {
      setImportError(msg)
      setImportSuccess("")
    }
    setTimeout(() => {
      setImportError("")
      setImportSuccess("")
    }, 4000)
  }


  // Funcția care actualizează tema (la click-ul utilizatorului în Panoul de Teme)
  const handleThemeChange = (themeName: string) => {
    // Aici SALVĂM TEMA ȘI MODUL în localStorage, folosind applyTheme(..., true)
    applyTheme(themeName, true) 
    setCurrentTheme(themeName)
    // Actualizează și starea modului pentru a sincroniza interfața
    setIsCurrentModeDark(isThemeDark(themeName))
    
    // Mesajul de succes a fost eliminat la cererea utilizatorului.
  }

  // ... (Restul logicii - neschimbată)
  const handleProfileUpdateConfirm = () => {
    if (!currentSession) return
    const trimmedName = newNameInput.trim()
    const trimmedEmail = newEmailInput.trim()
    if (!trimmedName || !trimmedEmail || !trimmedEmail.includes('@')) {
        displayMessage("Numele și Emailul sunt obligatorii și trebuie să fie valide.", false)
        setProfileDialogOpen(false)
        return
    }
    if (trimmedName === currentSession.name && trimmedEmail === currentSession.email) {
        displayMessage("Nu ați făcut nicio modificare.", false)
        setProfileDialogOpen(false)
        return
    }
    const result = updateUserProfile(currentSession.userId, trimmedName, trimmedEmail, currentSession)
    if (result === true) {
      const updatedSession = getCurrentSession()
      setCurrentSession(updatedSession) 
      displayMessage("Numele și emailul au fost actualizate cu succes!", true)
    } else if (result === "email_exists") {
      displayMessage("Acest email este deja utilizat de alt cont!", false)
    } else {
        displayMessage("Eroare la actualizarea profilului.", false)
    }
    setProfileDialogOpen(false)
  }

  const handleChangePasswordConfirm = () => {
    if (!currentSession) return
    if (!oldPasswordInput || !newPasswordInput || !confirmNewPasswordInput) {
        displayMessage("Toate câmpurile sunt obligatorii.", false)
        return
    }
    if (newPasswordInput.length < 6) {
        displayMessage("Parola nouă trebuie să aibă minim 6 caractere.", false)
        return
    }
    if (newPasswordInput !== confirmNewPasswordInput) {
        displayMessage("Parola nouă și confirmarea nu se potrivesc.", false)
        return
    }
    if (oldPasswordInput === newPasswordInput) {
        displayMessage("Parola nouă trebuie să fie diferită de cea veche.", false)
        return
    }
    const result = changePassword(currentSession.userId, oldPasswordInput, newPasswordInput)
    if (result === true) {
        displayMessage("Parola a fost schimbată cu succes!", true)
        setPasswordDialogOpen(false)
        setOldPasswordInput("")
        setNewPasswordInput("")
        setConfirmNewPasswordInput("")
    } else if (result === "wrong_password") {
        displayMessage("Parola veche este incorectă.", false)
    } else {
        displayMessage("Eroare la schimbarea parolei.", false)
    }
  }

  const handleExportData = () => {
    if (!currentSession) return
    const userData = getUserData(currentSession.userId) 
    if (!userData) {
        displayMessage(`Nu s-au găsit date pentru contul tău.`, false)
        return
    }
    let jsonStr: string
    try {
        jsonStr = JSON.stringify(userData, null, 2) 
    } catch (e) {
        console.error("Eroare la conversia datelor în JSON:", e)
        displayMessage("Eroare la pregătirea datelor pentru exportul JSON.", false)
        return
    }
    const mimeType = "application/json"
    const filename = `date_${(currentSession.name || 'cont').replace(/\s/g, '_').toLowerCase()}_export.json` 
    const blob = new Blob([jsonStr], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const downloadAnchorNode = document.createElement('a')
    downloadAnchorNode.setAttribute("href", url)
    downloadAnchorNode.setAttribute("download", filename)
    document.body.appendChild(downloadAnchorNode)
    downloadAnchorNode.click()
    document.body.removeChild(downloadAnchorNode) 
    URL.revokeObjectURL(url)
    displayMessage(`Toate datele contului au fost exportate cu succes (.json)!`, true) 
  }
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files ? event.target.files[0] : null
      setSelectedFile(file)
      setImportError("")
      setImportSuccess("") 
  }

  const handleImportConfirm = () => {
      if (!currentSession || !selectedFile) {
          displayImportMessage("Nu a fost selectat niciun fișier.", false)
          return
      }
      const reader = new FileReader()
      reader.onload = (e) => {
          const fileContent = e.target?.result
          if (typeof fileContent !== 'string') {
              displayImportMessage("Eroare la citirea fișierului. Conținutul nu este un text valid.", false)
              setSelectedFile(null)
              if (fileInputRef.current) fileInputRef.current.value = "" 
              return
          }
          try {
              const importedData = JSON.parse(fileContent)
              if (!importedData || typeof importedData !== 'object' || !importedData.userId) {
                  displayImportMessage("Eroare: Fișierul JSON nu pare a fi un export de date valid. Asigură-te că include cheia 'userId'.", false)
                  setSelectedFile(null)
                  if (fileInputRef.current) fileInputRef.current.value = "" 
                  return
              }
              saveUserData({
                  ...importedData, 
                  userId: currentSession.userId
              })
              displayMessage(`Datele contului (${selectedFile.name}) au fost importate cu succes! Datele vechi au fost suprascrise.`, true) 
              setImportDialogOpen(false) 
              window.location.reload() 
          } catch (error) {
              console.error("Eroare la pararea/procesarea JSON:", error)
              displayImportMessage("Eroare la import. Asigură-te că fișierul este un JSON valid.", false) 
              setSelectedFile(null)
              if (fileInputRef.current) fileInputRef.current.value = "" 
          }
      }
      reader.onerror = () => {
          displayImportMessage("Eroare la citirea fișierului.", false)
          setSelectedFile(null)
          if (fileInputRef.current) fileInputRef.current.value = ""
      }
      reader.readAsText(selectedFile)
  }
  
  const handleFinalDeleteConfirm = () => {
    if (!currentSession) return
    const success = deleteUser(currentSession.userId)
    if (success) {
      localStorage.removeItem("currentUser") 
      router.push("/login") 
    } else {
      displayMessage("Eroare la ștergerea contului. Te rugăm să încerci din nou.", false) 
    }
  }


  if (!currentSession) {
    return null
  }
  
  const isAdmin = currentSession.role === "admin"


  return (
    <div className="space-y-4 transition-colors duration-500 ease-in-out">
      
      <Card className="transition-colors duration-500 ease-in-out">
        <CardHeader>
          <div className="flex items-center gap-2 transition-colors duration-500 ease-in-out">
            <User className="h-5 w-5 text-blue-500 transition-colors duration-500 ease-in-out" />
            <CardTitle className="transition-colors duration-500 ease-in-out">Profilul Tău ({currentSession.name || currentSession.email})</CardTitle> 
          </div>
          <CardDescription className="transition-colors duration-500 ease-in-out">
            Gestionează-ți detaliile contului (nume/email/parolă), exportă/importă datele și șterge contul.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* SECȚIUNEA 1: DETALII CONT CURENT */}
          <div className="flex items-center gap-4 mb-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-md border border-blue-200 dark:border-blue-800 transition-colors duration-500 ease-in-out">
            <Mail className="h-5 w-5 text-blue-600 transition-colors duration-500 ease-in-out" />
            <div>
              <p className="text-sm font-medium transition-colors duration-500 ease-in-out">Nume curent: {currentSession.name || currentSession.email}</p>
              <p className="text-sm font-medium transition-colors duration-500 ease-in-out">Email curent: {currentSession.email}</p>
              <p className="text-xs text-muted-foreground transition-colors duration-500 ease-in-out">
                Rol: {currentSession.role === "admin" ? "Administrator" : "Scriitor (Utilizator)"}
              </p>
            </div>
          </div>

          {/* SECȚIUNEA 2: NOUA BARĂ COMPACTĂ DE TEME */}
          {isAdmin && (
              <div className="mb-4 space-y-3 p-3 bg-secondary/50 dark:bg-card/50 rounded-lg border border-border transition-colors duration-500 ease-in-out">
                  {/* Titlu compact, pe același rând */}
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold transition-colors duration-500 ease-in-out">
                        <PaintBucket className="h-4 w-4 inline mr-2 align-text-bottom text-purple-500" />
                        Alege Temă (Mod {isCurrentModeDark ? 'Dark' : 'Light'}):
                    </p>
                    {/* Lista de Cercuri de Culoare */}
                    <div className="flex flex-wrap gap-3 items-center justify-end">
                        {(isCurrentModeDark ? THEME_OPTIONS.dark : THEME_OPTIONS.light).map((theme) => (
                            <div 
                                key={theme.id}
                                onClick={() => handleThemeChange(theme.id)}
                                // MODIFICAT: Afișează doar numele temei la hover
                                title={theme.name}
                                className={`h-8 w-8 rounded-full border-2 cursor-pointer shadow-md transition-all duration-300 ease-in-out 
                                    ${currentTheme === theme.id 
                                        ? 'border-4 border-blue-500 ring-2 ring-blue-500/50 scale-110' // Stil pentru tema selectată
                                        : 'border-border hover:scale-105 hover:shadow-lg' // Stil default
                                    }
                                `}
                                // Folosim direct backgroundColor din THEME_OPTIONS. Aceasta asigură culoarea cercului
                                style={{ backgroundColor: theme.backgroundColor }}
                            >
                            </div>
                        ))}
                    </div>
                  </div>
              </div>
          )}

          {/* SECȚIUNEA 3: MESAJE DE EROARE/SUCCES */}
          {(error || success) && (
            <div className={`flex items-center gap-2 text-sm p-3 rounded-md mb-4 ${success ? "text-green-600 bg-green-50 dark:bg-green-950/20 border-green-200" : "text-red-500 bg-red-50 dark:bg-red-950/20 border-red-200"} border transition-colors duration-500 ease-in-out`}>
              {success ? <CheckCircle className="h-4 w-4 flex-shrink-0 transition-colors duration-500 ease-in-out" /> : <AlertCircle className="h-4 w-4 flex-shrink-0 transition-colors duration-500 ease-in-out" />}
              <span className="transition-colors duration-500 ease-in-out">{success || error}</span>
            </div>
          )}
          
          {/* SECȚIUNEA 4: BUTOANE DE ACȚIUNE (inclusiv "Editează Numele...") */}
          <div className="space-y-3">
            <Button 
                variant="outline" 
                className="w-full justify-start gap-2 transition-colors duration-500 ease-in-out"
                onClick={() => {
                    setNewNameInput(currentSession.name || currentSession.email.split('@')[0])
                    setNewEmailInput(currentSession.email) 
                    setProfileDialogOpen(true)
                }}
            >
                <User className="h-4 w-4 transition-colors duration-500 ease-in-out" />
                Editează Numele și Adresa de Email
            </Button>

            <Button 
                variant="outline" 
                className="w-full justify-start gap-2 transition-colors duration-500 ease-in-out"
                onClick={() => setPasswordDialogOpen(true)}
            >
                <Lock className="h-4 w-4 transition-colors duration-500 ease-in-out" />
                Schimbă Parola
            </Button>
            
            <div className="flex gap-3">
                <Button 
                    variant="outline" 
                    className="flex-1 justify-center gap-2 transition-colors duration-500 ease-in-out"
                    onClick={handleExportData}
                >
                    <Download className="h-4 w-4 transition-colors duration-500 ease-in-out" />
                    Exportă Datele (.json)
                </Button>
                
                <Button 
                    variant="outline" 
                    className="flex-1 justify-center gap-2 transition-colors duration-500 ease-in-out"
                    onClick={() => {
                        setImportDialogOpen(true)
                        setImportError("")
                        setImportSuccess("")
                    }}
                >
                    <Upload className="h-4 w-4 transition-colors duration-500 ease-in-out" /> 
                    Importă Datele (.json)
                </Button>
            </div> 
            <Button 
                variant="destructive" 
                className="w-full justify-center gap-2 transition-colors duration-500 ease-in-out" 
                onClick={() => setDeleteDialogOpen(true)}
            >
                <Trash2 className="h-4 w-4 transition-colors duration-500 ease-in-out" />
                Șterge Contul Definitiv
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* ... (Dialogurile rămân neschimbate) ... */}
      <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
        <DialogContent className="transition-colors duration-500 ease-in-out">
          <DialogHeader>
            <DialogTitle className="transition-colors duration-500 ease-in-out">Editează Numele și Emailul</DialogTitle>
            <DialogDescription className="transition-colors duration-500 ease-in-out">
              Actualizează numele și adresa de email pentru contul tău.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <div className="space-y-2">
                <Label htmlFor="edit-name" className="transition-colors duration-500 ease-in-out">Nume</Label>
                <Input
                    id="edit-name"
                    type="text"
                    value={newNameInput}
                    onChange={(e) => setNewNameInput(e.target.value)}
                    placeholder="Numele tău complet"
                    className="transition-colors duration-500 ease-in-out"
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="edit-email" className="transition-colors duration-500 ease-in-out">Email</Label>
                <Input
                    id="edit-email"
                    type="email"
                    value={newEmailInput}
                    onChange={(e) => setNewEmailInput(e.target.value)}
                    placeholder="Noua adresă de email"
                    className="transition-colors duration-500 ease-in-out"
                />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProfileDialogOpen(false)} className="transition-colors duration-500 ease-in-out">
              Anulează
            </Button>
            <Button 
                onClick={handleProfileUpdateConfirm} 
                disabled={!newNameInput.trim() || !newEmailInput.trim()}
                className="transition-colors duration-500 ease-in-out"
            >
              <Save className="h-4 w-4 mr-2 transition-colors duration-500 ease-in-out"/> Salvează Profilul
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent className="transition-colors duration-500 ease-in-out">
          <DialogHeader>
            <DialogTitle className="transition-colors duration-500 ease-in-out">Schimbă Parola</DialogTitle>
            <DialogDescription className="transition-colors duration-500 ease-in-out">
              Introdu parola veche și noua parolă (minim 6 caractere).
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <input
              ref={oldPasswordRef}
              type="password"
              value={oldPasswordInput}
              onChange={(e) => setOldPasswordInput(e.target.value)}
              onKeyDown={(e) => { 
                if (e.key === 'Enter') {
                  e.preventDefault()
                  newPasswordRef.current?.focus()
                }
              }}
              placeholder="Parola Veche"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm transition-colors duration-500 ease-in-out"
            />
            <input
              ref={newPasswordRef}
              type="password"
              value={newPasswordInput}
              onChange={(e) => setNewPasswordInput(e.target.value)}
              onKeyDown={(e) => { 
                if (e.key === 'Enter') {
                  e.preventDefault()
                  confirmNewPasswordRef.current?.focus()
                }
              }}
              placeholder="Parola Nouă (min. 6 caractere)"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm transition-colors duration-500 ease-in-out"
            />
            <input
              ref={confirmNewPasswordRef}
              type="password"
              value={confirmNewPasswordInput}
              onChange={(e) => setConfirmNewPasswordInput(e.target.value)}
              onKeyDown={(e) => { 
                if (e.key === 'Enter' && newPasswordInput.length >= 6 && newPasswordInput === confirmNewPasswordInput && oldPasswordInput) {
                  e.preventDefault()
                  handleChangePasswordConfirm()
                } else if (e.key === 'Enter') {
                  e.preventDefault()
                  changePasswordButtonRef.current?.focus()
                }
              }}
              placeholder="Confirmă Parola Nouă"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm transition-colors duration-500 ease-in-out"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPasswordDialogOpen(false)} className="transition-colors duration-500 ease-in-out">
              Anulează
            </Button>
            <Button 
                ref={changePasswordButtonRef}
                onClick={handleChangePasswordConfirm} 
                disabled={newPasswordInput.length < 6 || newPasswordInput !== confirmNewPasswordInput || !oldPasswordInput}
                className="transition-colors duration-500 ease-in-out"
            >
              Setează Parola
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <DeleteConfirmationDialog 
        isOpen={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleFinalDeleteConfirm}
        itemToDelete={`contul tău (${currentSession.email})`}
      />

      <Dialog open={importDialogOpen} onOpenChange={(open) => {
        setImportDialogOpen(open)
        if (!open) {
          setSelectedFile(null) 
          setImportError("")
          setImportSuccess("")
          if (fileInputRef.current) fileInputRef.current.value = ""
        }
      }}>
        <DialogContent className="transition-colors duration-500 ease-in-out">
          <DialogHeader>
            <DialogTitle className="transition-colors duration-500 ease-in-out">Importă Datele Contului (JSON)</DialogTitle>
            <DialogDescription className="transition-colors duration-500 ease-in-out">
              Selectează fișierul <span className="font-mono font-semibold">.json</span> exportat anterior. <br />
              <span className="text-red-500 font-medium transition-colors duration-500 ease-in-out">ATENȚIE: Această acțiune va ! SUPRASCRIE ! toate datele curente (cărți, notițe etc.)!</span>
              
              {(importError || importSuccess) && (
                <div className={`flex items-center gap-2 text-sm p-3 rounded-md mt-4 ${importSuccess ? "text-green-600 bg-green-50 dark:bg-green-950/20 border-green-200" : "text-red-500 bg-red-50 dark:bg-red-950/20 border-red-200"} border transition-colors duration-500 ease-in-out`}>
                  <AlertCircle className="h-4 w-4 flex-shrink-0 transition-colors duration-500 ease-in-out" />
                  <span className="transition-colors duration-500 ease-in-out">{importSuccess || importError}</span>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3">
            
            <input
              ref={fileInputRef}
              type="file"
              accept=".json" 
              onChange={handleFileChange}
              className="hidden" 
            />
            
            <Button 
                variant="outline"
                className="w-full justify-start text-left transition-colors duration-500 ease-in-out"
                onClick={() => fileInputRef.current?.click()} 
            >
                <Upload className="h-4 w-4 mr-2 transition-colors duration-500 ease-in-out" />
                {selectedFile ? `Fișier selectat: ${selectedFile.name}` : "Alege Fișierul .json..."}
            </Button>
            
            {!selectedFile && (
                <p className="text-sm text-muted-foreground italic transition-colors duration-500 ease-in-out">
                    Niciun fișier ales. Doar fișierele exportate din această aplicație vor funcționa.
                </p>
            )}

          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
                setImportDialogOpen(false)
                setSelectedFile(null) 
                if (fileInputRef.current) fileInputRef.current.value = "" 
            }} className="transition-colors duration-500 ease-in-out">
              Anulează
            </Button>
            <Button 
                onClick={handleImportConfirm} 
                variant="default"
                disabled={!selectedFile}
                className="transition-colors duration-500 ease-in-out"
            >
              Confirmă Importul și Suprascrierea
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}