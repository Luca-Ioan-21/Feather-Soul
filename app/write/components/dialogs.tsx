// dialogs.tsx (REPARAT)

"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import type { Book } from "../types/book"
import { Shield } from "lucide-react" 

interface DialogsProps {
  // Goal Dialog
  isGoalDialogOpen: boolean
  setIsGoalDialogOpen: (open: boolean) => void
  tempGoalInput: number
  setTempGoalInput: (value: number) => void
  onSetGoal: () => void

  // Edit Book Dialog
  editingBook: string | null
  setEditingBook: (id: string | null) => void
  newTitle: string
  setNewTitle: (title: string) => void
  onRenameBook: () => void

  // Edit Chapter Dialog
  editingChapter: string | null
  setEditingChapter: (id: string | null) => void // ⬅️ REPARAȚIE: Adăugat aici!
  onRenameChapter: () => void

  // Delete Book Dialog
  deletingBook: string | null
  setDeletingBook: (id: string | null) => void
  books: Book[]
  onConfirmDeleteBook: () => void

  // Delete Chapter Dialog
  deletingChapter: { bookId: string; chapterId: string } | null
  setDeletingChapter: (data: { bookId: string; chapterId: string } | null) => void
  onConfirmDeleteChapter: () => void

  // Logout Confirmation Dialog
  isLogoutDialogOpen: boolean
  setIsLogoutDialogOpen: (isOpen: boolean) => void
  onConfirmLogout: () => void
}

export function Dialogs({
  isGoalDialogOpen,
  setIsGoalDialogOpen,
  tempGoalInput,
  setTempGoalInput,
  onSetGoal,
  editingBook,
  setEditingBook,
  newTitle,
  setNewTitle,
  onRenameBook,
  editingChapter,
  setEditingChapter, // ⬅️ REPARAȚIE: Deconstruit aici!
  onRenameChapter,
  deletingBook,
  setDeletingBook,
  books,
  onConfirmDeleteBook,
  deletingChapter,
  setDeletingChapter,
  onConfirmDeleteChapter,
  isLogoutDialogOpen, 
  setIsLogoutDialogOpen, 
  onConfirmLogout, 
}: DialogsProps) {
  // Funcții ajutătoare pentru a găsi titlul corect
  const getBookTitle = (id: string | null) => books.find((b) => b.id === id)?.title || "Cartea"
  const getChapterTitle = (info: { bookId: string; chapterId: string } | null) => {
    const book = books.find((b) => b.id === info?.bookId)
    return book?.chapters.find((c) => c.id === info?.chapterId)?.title || "Capitolul"
  }

  // --- 1. Dialog Obiectiv Cuvinte (Goal) ---
  const renderGoalDialog = () => (
    <Dialog open={isGoalDialogOpen} onOpenChange={setIsGoalDialogOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Setează Obiectivul de Cuvinte</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <p className="text-sm text-muted-foreground">
            Setează numărul de cuvinte pe care vrei să-l atingi zilnic (sau pe sesiune).
          </p>
          <Input
            id="word-goal"
            type="number"
            value={tempGoalInput}
            onChange={(e) => setTempGoalInput(Number.parseInt(e.target.value))}
            min={1}
            className="col-span-3"
          />
        </div>
        <Button onClick={onSetGoal}>Salvează Obiectivul</Button>
      </DialogContent>
    </Dialog>
  )

  // --- 2. Dialog Redenumire (Rename) ---
  const renderRenameDialog = () => {
    const isBook = !!editingBook && !editingChapter
    const isChapter = !!editingChapter

    // ⬅️ Linia 128 (din imaginea de eroare) este acum funcțională!
    return (
      <Dialog open={isBook || isChapter} onOpenChange={() => { setEditingBook(null); setEditingChapter(null) }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Redenumește {isBook ? "Cartea" : "Capitolul"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Input
              id="new-title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="col-span-3"
            />
          </div>
          <Button onClick={isBook ? onRenameBook : onRenameChapter}>Salvează Noul Titlu</Button>
        </DialogContent>
      </Dialog>
    )
  }

  // --- 3. Dialog Ștergere Carte (Delete Book) ---
  const renderDeleteBookDialog = () => {
    const isPinned = books.find((b) => b.id === deletingBook)?.isPinned
    return (
      <Dialog open={!!deletingBook} onOpenChange={setDeletingBook}>
        <DialogContent className="[&>button]:hidden">
          <DialogHeader>
            <DialogTitle className={isPinned ? "text-yellow-500" : "text-destructive"}>
              {isPinned ? "Eroare: Cartea este Fixată" : "Confirmă Ștergerea Cărții"}
            </DialogTitle>
            <DialogDescription>
              {isPinned
                ? `Cartea ${getBookTitle(deletingBook)} este fixată (pinned) și nu poate fi ștearsă. Desprinde-o mai întâi.`
                : `Ești sigur că vrei să ștergi cartea "${getBookTitle(deletingBook)}"?`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingBook(null)}>
              Anulează
            </Button>
            <Button
              variant="destructive"
              onClick={onConfirmDeleteBook}
              disabled={isPinned}
            >
              Șterge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  // --- 4. Dialog Ștergere Capitol (Delete Chapter) ---
  const renderDeleteChapterDialog = () => (
    <Dialog open={!!deletingChapter} onOpenChange={() => setDeletingChapter(null)}>
      <DialogContent className="[&>button]:hidden">
        <DialogHeader>
          <DialogTitle className="text-destructive">Confirmă Ștergerea Capitolului</DialogTitle>
          <DialogDescription>
            Ești sigur că vrei să ștergi "{getChapterTitle(deletingChapter)}"? 
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setDeletingChapter(null)}>
            Anulează
          </Button>
          <Button variant="destructive" onClick={onConfirmDeleteChapter}>
            Șterge
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )

  // --- 5. Dialog Confirmare Delogare (Logout Confirmation) - NOU MESAJ! ---
  const renderLogoutDialog = () => (
    <AlertDialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-yellow-500" />
            Vrei să ieși din aplicație?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Datele tale sunt salvate automat, dar va trebui să te autentifici din nou pentru a continua să scrii.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Rămâi Logat</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirmLogout}>
            Deloghează-te
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )

  return (
    <>
      {renderGoalDialog()}
      {renderRenameDialog()}
      {renderDeleteBookDialog()}
      {renderDeleteChapterDialog()}
      {renderLogoutDialog()} 
    </>
  )
}