// app/write/login/page.tsx

"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { login, register, getCurrentSession, initializeDefaultAdmin, resetPassword } from "@/app/write/lib/auth"
import { AlertCircle, CheckCircle, Eye, EyeClosed, ArrowLeft } from "lucide-react" 

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("") 
  
  // State-uri și funcții de temă au fost eliminate

  const [isResettingPassword, setIsResettingPassword] = useState(false) 

  // State-uri pentru vizibilitatea parolelor
  const [showLoginPassword, setShowLoginPassword] = useState(false)
  const [showRegisterPassword, setShowRegisterPassword] = useState(false)
  const [showRegisterConfirmPassword, setShowRegisterConfirmPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false)

  // Login state
  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")

  // Register state
  const [registerEmail, setRegisterEmail] = useState("")
  const [registerPassword, setRegisterPassword] = useState("")
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState("")
  const [registerName, setRegisterName] = useState("") 

  // Reset Password state
  const [resetEmail, setResetEmail] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmNewPassword, setConfirmNewPassword] = useState("")
  
  // useEffect inițial (doar pentru sesiune și admin)
  useEffect(() => {
    // Inițializează adminul predefinit și verifică sesiunea
    initializeDefaultAdmin()
    const session = getCurrentSession()
    if (session) {
      router.push("/write")
    }
  }, [router]) 
  
  // Funcții utilitare și de handler
  const clearMessages = () => {
    setError("")
    setSuccessMessage("")
  }

  const handleToggleReset = (shouldReset: boolean) => {
    clearMessages()
    setIsResettingPassword(shouldReset)
    if (shouldReset) {
      setResetEmail(loginEmail) 
    } else {
      setResetEmail("")
      setNewPassword("")
      setConfirmNewPassword("")
    }
  }


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    clearMessages()
    setIsLoading(true)
    try {
      const session = login(loginEmail, loginPassword)
      if (session) {
        setSuccessMessage("Autentificare reușită! Se redirecționează...")
        setTimeout(() => {
            router.push("/write")
        }, 1000)
      } else {
        setError("Email sau parolă incorectă")
      }
    } catch (err) {
      setError("A apărut o eroare. Vă rugăm încercați din nou.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    clearMessages()
    
    if (!registerName.trim()) {
        setError("Numele este obligatoriu")
        return
    }
    
    if (registerPassword !== registerConfirmPassword) {
      setError("Parolele nu se potrivesc")
      return
    }

    if (registerPassword.length < 6) {
      setError("Parola trebuie să aibă minim 6 caractere")
      return
    }

    if (!registerEmail.includes("@")) {
      setError("Email invalid")
      return
    }

    setIsLoading(true)

    try {
      const session = register(registerName.trim(), registerEmail.trim(), registerPassword)
      if (session) {
        setSuccessMessage("Înregistrare reușită! Se redirecționează...")
        setTimeout(() => {
            router.push("/write")
        }, 1000)
      } else {
        setError("Acest email este deja înregistrat")
      }
    } catch (err) {
      setError("A apărut o eroare. Vă rugăm încercați din nou.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    clearMessages()

    if (newPassword !== confirmNewPassword) {
      setError("Parolele noi nu se potrivesc")
      return
    }
    if (newPassword.length < 6) {
      setError("Parola nouă trebuie să aibă minim 6 caractere")
      return
    }
    if (!resetEmail.includes("@")) {
      setError("Email invalid")
      return
    }

    setIsLoading(true)

    try {
      const success = resetPassword(resetEmail, newPassword)

      if (success) {
        setSuccessMessage("Parola a fost resetată cu succes! Vă puteți autentifica acum.")
      } else {
        setError("Eroare la resetare. Asigurați-vă că email-ul este corect.")
      }
    } catch (err) {
      setError("A apărut o eroare la resetarea parolei.")
    } finally {
      setIsLoading(false)
    }
  }


  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            
            <Image 
                src="/open-book.png" 
                alt="Suflet de Peniță Logo"
                width={48} 
                height={48} 
                // 🟢 CORECTAT: Adăugat `invert dark:invert-0` pentru a face logo-ul negru în Light Mode
                className="invert dark:invert-0" 
            />
            
            <h1 className="text-4xl font-bold text-foreground">Suflet de Peniță</h1>
          </div>
          <p className="text-muted-foreground">Organizează-ți poveștile și personajele</p>
        </div>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4"> 
            <TabsTrigger value="login" onClick={() => handleToggleReset(false)}>Autentificare</TabsTrigger> 
            <TabsTrigger value="register" onClick={() => handleToggleReset(false)}>Cont Nou</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle>{isResettingPassword ? "Parolă Uitată" : "Autentificare"}</CardTitle>
                <CardDescription>
                  {isResettingPassword 
                    ? "Introdu email-ul și o parolă nouă pentru a reseta contul"
                    : "Introdu email-ul și parola pentru a accesa contul tău"
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                
                {isResettingPassword ? (
                    
                    <form onSubmit={handleResetPassword} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="reset-email">Email</Label>
                            <Input
                            id="reset-email"
                            type="email"
                            placeholder="email@exemplu.ro"
                            value={resetEmail}
                            onChange={(e) => setResetEmail(e.target.value)}
                            required
                            disabled={isLoading}
                            />
                            <p className="text-xs text-muted-foreground">Trebuie să fie un email înregistrat.</p>
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="new-password">Parolă Nouă</Label>
                            <div className="relative">
                                <Input
                                id="new-password"
                                type={showNewPassword ? "text" : "password"}
                                placeholder="••••••••"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                disabled={isLoading}
                                minLength={6}
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    className="absolute right-0 top-0 h-full px-3 py-2 text-muted-foreground hover:bg-transparent"
                                    onClick={() => setShowNewPassword(prev => !prev)}
                                    disabled={isLoading}
                                >
                                    {showNewPassword ? <Eye className="h-4 w-4" /> : <EyeClosed className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="confirm-new-password">Confirmă Parola Nouă</Label>
                            <div className="relative">
                                <Input
                                id="confirm-new-password"
                                type={showConfirmNewPassword ? "text" : "password"}
                                placeholder="••••••••"
                                value={confirmNewPassword}
                                onChange={(e) => setConfirmNewPassword(e.target.value)}
                                required
                                disabled={isLoading}
                                minLength={6}
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    className="absolute right-0 top-0 h-full px-3 py-2 text-muted-foreground hover:bg-transparent"
                                    onClick={() => setShowConfirmNewPassword(prev => !prev)}
                                    disabled={isLoading}
                                >
                                    {showConfirmNewPassword ? <Eye className="h-4 w-4" /> : <EyeClosed className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>
                        
                        {(error || successMessage) && (
                            <div className={`flex items-center gap-2 text-sm p-3 rounded-md ${error ? 'text-red-500 bg-red-50 dark:bg-red-950/20' : 'text-green-600 bg-green-50 dark:bg-green-950/20'}`}>
                                {error ? <AlertCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                                <span>{error || successMessage}</span>
                            </div>
                        )}

                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? "Se resetează..." : "Resetează Parola"}
                        </Button>

                        <Button 
                            type="button" 
                            variant="link" 
                            className="w-full text-sm text-slate-500 hover:text-slate-400 p-0 h-auto"
                            onClick={() => handleToggleReset(false)}
                            disabled={isLoading}
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Înapoi la Autentificare
                        </Button>

                    </form>

                ) : (
                    
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="login-email">Email</Label>
                            <Input
                            id="login-email"
                            type="email"
                            placeholder="email@exemplu.ro"
                            value={loginEmail}
                            onChange={(e) => setLoginEmail(e.target.value)}
                            required
                            disabled={isLoading}
                            />
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="login-password">Parolă</Label>
                            <div className="relative">
                            <Input
                                id="login-password"
                                type={showLoginPassword ? "text" : "password"} 
                                placeholder="••••••••"
                                value={loginPassword}
                                onChange={(e) => setLoginPassword(e.target.value)}
                                required
                                disabled={isLoading}
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                className="absolute right-0 top-0 h-full px-3 py-2 text-muted-foreground hover:bg-transparent"
                                onClick={() => setShowLoginPassword(prev => !prev)}
                                disabled={isLoading}
                            >
                                {showLoginPassword ? <Eye className="h-4 w-4" /> : <EyeClosed className="h-4 w-4" />}
                            </Button>
                            </div>
                        </div>

                        <Button 
                            type="button" 
                            variant="link" 
                            className="w-full text-right text-sm text-amber-400 hover:text-amber-300 p-0 h-auto"
                            onClick={() => handleToggleReset(true)}
                            disabled={isLoading}
                        >
                            Am uitat parola
                        </Button>


                        {error && (
                            <div className="flex items-center gap-2 text-sm text-red-500 bg-red-50 dark:bg-red-950/20 p-3 rounded-md">
                            <AlertCircle className="h-4 w-4" />
                            <span>{error}</span>
                            </div>
                        )}
                        {successMessage && (
                            <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 dark:bg-green-950/20 p-3 rounded-md">
                            <CheckCircle className="h-4 w-4" />
                            <span>{successMessage}</span>
                            </div>
                        )}

                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? "Se încarcă..." : "Autentificare"}
                        </Button>
                    </form>

                )}

              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="register">
            <Card>
              <CardHeader>
                <CardTitle>Creează Cont Nou</CardTitle>
                <CardDescription>Completează formularul pentru a-ți crea un cont</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleRegister} className="space-y-4">
                  
                  <div className="space-y-2">
                    <Label htmlFor="register-name">Nume</Label>
                    <Input
                      id="register-name"
                      type="text"
                      placeholder="Numele tău complet"
                      value={registerName}
                      onChange={(e) => setRegisterName(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="register-email">Email</Label>
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="email@exemplu.ro"
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="register-password">Parolă</Label>
                    <div className="relative">
                        <Input
                          id="register-password"
                          type={showRegisterPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={registerPassword}
                          onChange={(e) => setRegisterPassword(e.target.value)}
                          required
                          disabled={isLoading}
                          minLength={6}
                        />
                         <Button
                            type="button"
                            variant="ghost"
                            className="absolute right-0 top-0 h-full px-3 py-2 text-muted-foreground hover:bg-transparent"
                            onClick={() => setShowRegisterPassword(prev => !prev)}
                            disabled={isLoading}
                        >
                            {showRegisterPassword ? <Eye className="h-4 w-4" /> : <EyeClosed className="h-4 w-4" />}
                        </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">Minim 6 caractere</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="register-confirm-password">Confirmă Parola</Label>
                    <div className="relative">
                        <Input
                          id="register-confirm-password"
                          type={showRegisterConfirmPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={registerConfirmPassword}
                          onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                          required
                          disabled={isLoading}
                          minLength={6}
                        />
                        <Button
                            type="button"
                            variant="ghost"
                            className="absolute right-0 top-0 h-full px-3 py-2 text-muted-foreground hover:bg-transparent"
                            onClick={() => setShowRegisterConfirmPassword(prev => !prev)}
                            disabled={isLoading}
                        >
                            {showRegisterConfirmPassword ? <Eye className="h-4 w-4" /> : <EyeClosed className="h-4 w-4" />}
                        </Button>
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 text-sm text-red-500 bg-red-50 dark:bg-red-950/20 p-3 rounded-md">
                      <AlertCircle className="h-4 w-4" />
                      <span>{error}</span>
                    </div>
                  )}
                   {successMessage && (
                    <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 dark:bg-green-950/20 p-3 rounded-md">
                      <CheckCircle className="h-4 w-4" />
                      <span>{successMessage}</span>
                    </div>
                  )}

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Se încarcă..." : "Creează Cont"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </div>
    </div>
  )
}