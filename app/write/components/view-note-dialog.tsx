// components/view-note-dialog.tsx

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

interface ViewNoteDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  noteTitle: string // Intervalul de selecție sau indexul
  noteText: string // Textul complet al notiței
}

export function ViewNoteDialog({ isOpen, onOpenChange, noteTitle, noteText }: ViewNoteDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          {/* Afișează titlul notiței (ex: #1874-2002: ) */}
          <DialogTitle>Vizualizare Notiță {noteTitle}</DialogTitle>
          <DialogDescription>
            Textul complet al notiței atașate selecției din capitol.
          </DialogDescription>
        </DialogHeader>
        <div className="py-2">
          <p className="whitespace-pre-wrap text-sm text-foreground">{noteText}</p>
        </div>
      </DialogContent>
    </Dialog>
  )
}