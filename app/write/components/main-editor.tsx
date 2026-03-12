// main-editor.tsx

"use client"

import type React from "react"
// NOU: Importăm useState pentru dialogul secret
import { useState } from "react" 
import Image from "next/image" // Importul pentru afișarea imaginii

import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
// NOU: Importăm componentele Dialog pentru mesajul secret
import { 
    Dialog, 
    DialogContent, 
    DialogDescription, 
    DialogHeader, 
    DialogTitle 
} from "@/components/ui/dialog" 
// Am adăugat Wand2 pentru iconița secretă
import { FileText, Wand2 } from "lucide-react" 
import type { Book, Chapter } from "@/types/book"

interface MainEditorProps {
  selectedBook: string | null
  selectedChapter: string | null
  currentBook?: Book
  currentChapter?: Chapter
  content: string
  onContentChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  isBookFormatActive: boolean
  mainContentClass: string
  textareaRef: React.RefObject<HTMLTextAreaElement>
  onOpenReferences: () => void
  // CORECTAT: Funcție pentru a transmite intervalul de selecție (start și end)
  onSelectionRangeChange: (start: number, end: number) => void 
}

export function MainEditor({
  selectedBook,
  selectedChapter,
  currentBook,
  currentChapter,
  content,
  onContentChange,
  isBookFormatActive,
  mainContentClass,
  textareaRef,
  onOpenReferences,
  onSelectionRangeChange, // PRELUAT
}: MainEditorProps) {
  
  // NOU: Stare pentru a controla vizibilitatea dialogului secret
  const [secretDialogOpen, setSecretDialogOpen] = useState(false) 

  // Handler care urmărește schimbarea selecției sau poziția cursorului
  const handleSelectionChange = (e: React.FormEvent<HTMLTextAreaElement>) => {
    // Trimite poziția de start ȘI de sfârșit a selecției
    onSelectionRangeChange(e.currentTarget.selectionStart, e.currentTarget.selectionEnd) 
  }
  
  // NOU: Funcție pentru a deschide dialogul secret la Ctrl + Click
  const handleSecretClick = (e: React.MouseEvent) => {
    // Verifică dacă tasta Ctrl (sau Cmd pe Mac - e.metaKey) este apăsată
    if (e.ctrlKey || e.metaKey) { 
      e.preventDefault() // Oprește comportamentul implicit al browser-ului (ex. deschide meniul context)
      setSecretDialogOpen(true)
    }
  }
  
  if (selectedChapter) {
    return (
      <Textarea
        ref={textareaRef}
        value={content}
        onChange={onContentChange}
        // NOU: Ascultă evenimentele onMouseUp, onKeyUp pentru a obține intervalul de selecție
        onMouseUp={handleSelectionChange} 
        onKeyUp={handleSelectionChange} 
        placeholder="Începe să scrii..."
        className={`min-h-[500px] h-[calc(100vh-130px)] leading-relaxed 
          ${mainContentClass} 
          ${isBookFormatActive ? "font-serif text-justify paragraph-format" : "font-sans text-left"}`}
        spellCheck={false}
      />
    )
  }

  if (selectedBook && !selectedChapter) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        {/* ICON 1 (Cartea selectată, fără capitol) - ADAUGĂ TRANZIȚIA SOFT */}
        <Image 
          src="/open-book.png" 
          alt="Carte deschisă" 
          width={128} 
          height={128} 
          // FIX TEMĂ aplicat. ADAUGĂ CLASELE PENTRU TRANZIȚIE SOFT!
          className="grayscale opacity-50 mx-auto mb-4 invert dark:invert-0 transition-all duration-500 ease-in-out" 
        />
        <p>Cartea "{currentBook?.title}" este selectată.</p>
        <p className="mt-2">Selectează un capitol sau apasă "+ Capitol nou" pentru a începe scrierea.</p>
        <p className="mt-4">
          {/* BUTON REFERINȚE - ADAUGĂ TRANZIȚIA SOFT */}
          <Button 
            onClick={onOpenReferences} 
            variant="link" 
            className="gap-1 transition-all duration-500 ease-in-out"
          >
            <FileText className="w-4 h-4" /> Vizualizează/Editează Referințele Cărții
          </Button>
        </p>
      </div>
    )
  }

  return (
    <div className="text-center py-12 text-muted-foreground">
      {/* ICON 2 (Nicio selecție) - ARE handlerul secret. PĂSTREAZĂ TRANZIȚIA SOFT */}
      <Image 
        src="/open-book.png" 
        alt="Carte deschisă" 
        width={150} 
        height={150} 
        // ADAUGĂ HANDLERUL SECRET
        onMouseDown={handleSecretClick}
        // FIX TEMĂ aplicat. CLASA cursor-pointer A FOST ELIMINATĂ!
        className="grayscale opacity-50 mx-auto mb-4 invert dark:invert-0 transition-all duration-500 ease-in-out" 
      />
      <p className="text-lg mb-2">Bine ai venit în tărâmul poveștilor tale!</p>
      <p>Aici poți edita și gestiona cărțile tale în mod complet</p>

      {/* NOU: DIALOGUL SECRET */}
      <Dialog open={secretDialogOpen} onOpenChange={setSecretDialogOpen}>
        {/* MODIFICAT: Adăugat: [&>button]:hidden pentru a ascunde butonul de închidere (X) */}
        <DialogContent className="sm:max-w-[425px] [&>button]:hidden"> 
          <DialogHeader className="flex flex-row items-center gap-2">
            <Wand2 className="h-6 w-6 text-yellow-500 flex-shrink-0" />
            <DialogTitle>Mesaj Secret: Proiect Alfa</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            Această funcționalitate a fost implementată ca un ou de Paște (Easter Egg), activabilă prin Ctrl + Click pe pictograma centrală.
          </DialogDescription>
          <div className="py-4 space-y-3 text-sm">
            <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-md border border-gray-200 dark:border-gray-800 space-y-1">
                <p>
                    <span className="font-semibold text-primary">Dezvoltator:</span> Rădulescu Luca-Ioan
                </p>
                <p>
                    <span className="font-semibold text-primary">Data Creării:</span> 03.11.2025
                </p>
                <p>
                    <span className="font-semibold text-primary">Mentor:</span> Oana Carmen Niculescu–Faida
                </p>
                <p>
                    <span className="font-semibold text-primary">Mesaj mentor:</span> "Personajele sunt o parte din tine, iar fiecare cuvânt creaza o lume nouă sculptata de tine."
                </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}