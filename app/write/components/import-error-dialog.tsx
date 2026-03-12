// app/write/components/import-error-dialog.tsx
"use client"

import * as React from "react"
import { XCircle } from "lucide-react"

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"

interface ImportErrorDialogProps {
  // Flag-ul care controlează vizibilitatea dialogului
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  // Mesajul specific de eroare de afișat
  errorMessage: string
}

export function ImportErrorDialog({
  isOpen,
  onOpenChange,
  errorMessage,
}: ImportErrorDialogProps) {
  // Funcție simplă de închidere
  const handleClose = () => {
    onOpenChange(false)
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-[425px]">
        <AlertDialogHeader className="items-center">
          {/* Iconița Roșie de Eroare */}
          <XCircle className="w-8 h-8 text-red-600 mb-2" />
          <AlertDialogTitle className="text-red-600 text-center">
            Eroare la Import
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            <span className="font-semibold block mb-2">Importul nu a reușit.</span> 
            <span className="text-red-500 block">
              {errorMessage}
            </span>
            <br/>
            Te rugăm să verifici fișierul și să încerci din nou.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {/* Un singur buton "OK" pentru a închide dialogul */}
          <Button onClick={handleClose}>
            OK, Am înțeles
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}