// components/edit-note-dialog.tsx

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

interface EditNoteDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  noteText: string // Textul curent al notiței
  setNoteText: (text: string) => void // Funcția de actualizare a textului
  onConfirmEdit: () => void // Funcția de salvare a notiței
}

export function EditNoteDialog({ 
  isOpen, 
  onOpenChange, 
  noteText, 
  setNoteText, 
  onConfirmEdit 
}: EditNoteDialogProps) {
  
  // Închide dialogul la apăsarea tastei Escape sau la click în exterior
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // Păstrăm modificările în state până la Confirm, dar închidem vizual
      onOpenChange(false)
    } else {
      onOpenChange(true)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editează Notița</DialogTitle>
          <DialogDescription>
            Poți modifica conținutul notiței, inclusiv adăugarea de rânduri noi.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Introduceți textul notiței..."
            className="min-h-[150px] resize-none"
            spellCheck={false}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Anulează
          </Button>
          <Button onClick={onConfirmEdit}>
            Salvează Modificările
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}