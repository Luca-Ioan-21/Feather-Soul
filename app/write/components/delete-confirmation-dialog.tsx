// app/write/components/delete-confirmation-dialog.tsx
"use client"

import * as React from "react"
import { useState, useMemo } from "react"
import { AlertTriangle, Lock } from "lucide-react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button" 
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
// CORECȚIE EROARE COMPILARE: Schimbă calea de import din "g/lib/auth" sau "../lib/auth" în "../lib/auth"
import { getCurrentSession, checkPassword } from "../lib/auth" 

interface DeleteConfirmationDialogProps {
  // Flag-ul care controlează vizibilitatea dialogului
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  // Callback-ul de executat la ștergerea confirmată
  onConfirm: () => void
  // Eticheta pentru elementul care urmează să fie șters (ex: "Referințele Cărții")
  itemToDelete: string 
}

export function DeleteConfirmationDialog({
  isOpen,
  onOpenChange,
  onConfirm,
  itemToDelete,
}: DeleteConfirmationDialogProps) {
  // Starea pentru confirmarea vizuală (primul pas: avertismentul)
  const [isConfirmed, setIsConfirmed] = useState(false)
  // Starea pentru parola introdusă (al doilea pas)
  const [password, setPassword] = useState("")
  // Starea pentru mesajele de eroare (parolă)
  const [passwordError, setPasswordError] = useState("")
  // Starea pentru dezactivarea butonului de acțiune în timpul procesării
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Obține datele sesiunii curente
  const currentSession = useMemo(() => {
    if (typeof window !== "undefined") {
      return getCurrentSession()
    }
    return null
  }, [])
  
  // Resetează starea la închiderea dialogului
  const handleClose = () => {
    onOpenChange(false)
    setTimeout(() => {
        setIsConfirmed(false)
        setPassword("")
        setPasswordError("")
        setIsSubmitting(false)
    }, 150); 
  }

  // Primul pas: Confirmarea vizuală inițială
  const handleInitialConfirm = () => {
    setIsConfirmed(true)
    setPassword("") 
    setPasswordError("")
  }

  // Al doilea pas: Verificarea parolei și execuția acțiunii finale
  const handleFinalConfirm = () => {
    if (!currentSession) {
      setPasswordError("Sesiune expirată sau negăsită.")
      return
    }

    if (password.length === 0) {
        setPasswordError("Parola este obligatorie pentru ștergere.")
        return
    }

    // Blocăm butonul de acțiune
    setIsSubmitting(true)
    setPasswordError("")

    // 1. Verifică parola
    const isPasswordValid = checkPassword(currentSession.userId, password)

    if (isPasswordValid) {
        // Succes: 
        // 2. Execută acțiunea (ștergerea)
        onConfirm() 
        
        // 3. Închide dialogul și resetează starea
        // Am scos apelul la handleClose() de aici și l-am lăsat la AlertDialogAction, 
        // dar pentru că folosiți Button în loc de AlertDialogAction, trebuie să-l punem înapoi manual.
        // CORECȚIE UX: Nu mai folosesc AlertDialogAction pentru a controla închiderea manual.
        handleClose() 

    } else {
        // Eșec:
        // CORECȚIE UX: NU SE MAI ÎNCHIDE DIALOGUL. Se afișează doar mesajul de eroare.
        setPasswordError("Parolă incorectă. Ștergerea a fost anulată.")
        setIsSubmitting(false) 
    }
  }

  // CORECȚIE: Înlocuim AlertDialogAction din Pasul 2 cu Button pentru a prelua controlul închiderii
  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-[425px]">
        
        {/* Pasul 1: Mesajul de avertizare inițial */}
        {!isConfirmed && (
          <>
            <AlertDialogHeader className="items-center">
              <AlertTriangle className="w-8 h-8 text-red-600 mb-2" />
              <AlertDialogTitle className="text-red-600 text-center">
                Ești ABSOLUT sigur(ă)?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-center">
                Această acțiune NU POATE FI ANULATĂ! 
                <br />
                Toate datele din {itemToDelete} vor fi șterse definitiv. 
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={handleClose}>Anulează</AlertDialogCancel>
              <Button 
                onClick={handleInitialConfirm} 
                className="bg-red-600 hover:bg-red-700"
              >
                Da, înțeleg riscul
              </Button>
            </AlertDialogFooter>
          </>
        )}

        {/* Pasul 2: Solicitarea parolei */}
        {isConfirmed && (
          <>
            <AlertDialogHeader className="items-center">
              <Lock className="w-8 h-8 text-amber-500 mb-2" />
              <AlertDialogTitle className="text-amber-500 text-center">
                Confirmă ștergerea cu Parola
              </AlertDialogTitle>
              <AlertDialogDescription className="text-center">
                Pentru a finaliza ștergerea definitivă a {itemToDelete}, 
                te rog introdu parola contului tău.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-4">
              <Label htmlFor="password">Parola ta</Label>
              <Input
                id="password"
                type="password"
                placeholder="Introdu parola..."
                value={password}
                onChange={(e) => {
                    setPassword(e.target.value)
                    if (passwordError) setPasswordError("")
                }}
                onKeyDown={(e) => {
                    // Permite confirmarea la Enter
                    if (e.key === 'Enter' && !isSubmitting && password.length > 0) {
                      e.preventDefault() 
                      handleFinalConfirm()
                    }
                }}
                disabled={isSubmitting}
              />
              {passwordError && (
                <p className="text-sm text-red-500 font-medium">
                    {passwordError}
                </p>
              )}
            </div>
            <AlertDialogFooter>
              <Button 
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Anulează
              </Button>
              {/* Folosim Button în loc de AlertDialogAction pentru a controla închiderea */}
              <Button 
                onClick={handleFinalConfirm} 
                disabled={isSubmitting || password.length === 0}
                className="bg-red-600 hover:bg-red-700"
              >
                {isSubmitting ? "Verifică..." : "Șterge Definitiv"}
              </Button>
            </AlertDialogFooter>
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
  )
}