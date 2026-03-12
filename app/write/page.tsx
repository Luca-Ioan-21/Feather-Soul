// app/write/page.tsx
"use client"

import type React from "react"
import { useState, useRef, useMemo, useEffect, useLayoutEffect, useCallback } from "react" 
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
// Iconițe necesare
import { Plus, BookOpen, FileText, Menu, LogOut, Shield, Download, User, ArrowRight, NotebookText, Upload, Book, File, ArrowUp, ClipboardPen, Feather } from "lucide-react" 
import { Sidebar } from "./components/sidebar"
import { MainEditor } from "./components/main-editor"
import { ToolsPanel } from "./components/tools-panel"
import { Dialogs } from "./components/dialogs"
import { BookReferencesDialog } from "./components/book-references-dialog"
import { AdminPanel } from "./components/admin-panel"
import { UserProfilePanel } from "./components/user-profile-panel" 
import { useFontSize } from "./functions/theme" 
import { capitalizeText } from "./functions/utils" 
import { getFilteredBooks } from "./functions/search" 
import {
  createNewBook,
  toggleBookPin,
  triggerDeleteBook,
  handleConfirmDeleteBook,
  renameBook,
  handleDropBook,
} from "./functions/books" 
import {
  createNewChapter,
  triggerDeleteChapter,
  handleConfirmDeleteChapter,
  renameChapter,
  handleDropChapter,
} from "./functions/chapters" 
import { getCurrentSession, logout, initializeDefaultAdmin, isAdmin } from "./lib/auth"
import { getUserData, saveUserBooks } from "./lib/storage"
import type { UserSession } from "./types/auth"
import type { Book, Chapter, Character } from "./types/book" 
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel 
} from "@/components/ui/dropdown-menu"

import { EditNoteDialog } from "./components/edit-note-dialog" 
import { ViewNoteDialog } from "./components/view-note-dialog" 
import { ImportErrorDialog } from "./components/import-error-dialog" 
import { DeleteConfirmationDialog } from "./components/delete-confirmation-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import type { BookStructureContent } from "./components/book-structure-editor"
// 🟢 IMPORTĂM TIPUL PENTRU DICȚIONAR
import type { TermDefinition } from "./components/character-reference-table"

// Interfața pentru conținutul importat (doar conținutul, nu referințele)
interface ImportedContent {
    type: "chapter" | "book";
    title: string;
    content: string | Array<{ 
        title: string; 
        content: string; 
        scratchpadContent?: string; 
        generalNotesContent?: string; 
    }>;
    scratchpadContent?: string;
    generalNotesContent?: string;
}

// Structura inițială (obiect) pentru Structura Cărții
const initialBookStructureContent: BookStructureContent = {
    generalStructure: "",
    styleAndTone: "",
    keyIdeas: "",
    narrativePerspective: "",
    customNotes: "",
}

// Funcție helper pentru formatarea sigură a datelor
const formatDate = (isoString: string | undefined): string => {
    if (!isoString) return "Dată necunoscută"
    try {
        const date = new Date(isoString)
        if (isNaN(date.getTime())) {
            return "Dată Invalidă (Lipsă)"
        }
        return date.toLocaleDateString("ro-RO")
    } catch (e) {
        return "Dată Invalidă (Eroare Parsare)"
    }
}

/**
 * Funcție helper pentru a parsa structura cărții salvată ca string JSON din storage
 */
const parseBookStructure = (data: any): BookStructureContent => {
    if (!data) return initialBookStructureContent
    
    if (typeof data === 'object' && !Array.isArray(data)) { 
        return {
            ...initialBookStructureContent,
            ...data
        } as BookStructureContent
    }
    
    if (typeof data === 'string' && data.trim().startsWith('{')) {
        try {
            const parsed = JSON.parse(data)
            if (typeof parsed === 'object' && !Array.isArray(parsed)) {
                return {
                    ...initialBookStructureContent,
                    ...parsed
                } as BookStructureContent
            }
        } catch (e) {
            console.error("Eroare la parsarea structurii JSON. Se folosește ca structură generală.", e)
        }
    }
    
    if (typeof data === 'string') {
         return {
            ...initialBookStructureContent,
            generalStructure: data, 
        }
    }

    return initialBookStructureContent
}

/**
 * Funcție Unificată pentru Exportul de Conținut (txt, md, json)
 */
function exportContent(
    type: "book" | "chapter",
    format: "txt" | "md" | "json",
    bookId: string,
    chapterId: string | null,
    books: Book[],
    range?: { start: number, end: number } 
) {
    const book = books.find((b) => b.id === bookId)
    if (!book) return

    let contentToExport = ""
    let filename = ""
    let mimeType = ""

    const date = new Date().toISOString()
    const safeBookTitle = book.title.replace(/[^a-z0-9]/gi, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
    
    // --- EXPORT CHAPTER ---
    if (type === "chapter" && chapterId && !range) {
        const chapter = book.chapters.find((c) => c.id === chapterId)
        if (!chapter) return

        const safeChapterTitle = chapter.title.replace(/[^a-zA-Z0-9]/gi, '-').replace(/-+/g, '-').replace(/-$/g, '')
        filename = `Capitol-${safeChapterTitle}`
        
        if (format === "json") {
            const exportData: ImportedContent = {
                type: "chapter",
                title: chapter.title,
                content: chapter.content,
                scratchpadContent: chapter.scratchpadContent || "",
                generalNotesContent: (chapter as any).generalNotesContent || "",
            }
            contentToExport = JSON.stringify(exportData, null, 2)
            mimeType = "application/json"
        } else { // txt or md
            const header = `========================================================\n`
            const headerText = `${header}CARTEA: ${book.title.toUpperCase()}\nCAPITOLUL: ${chapter.title.toUpperCase()}\nDATA EXPORTULUI: ${formatDate(date)}\n${header}\n\n`
            
            contentToExport = headerText
            contentToExport += chapter.content
            
            if (chapter.scratchpadContent) {
                contentToExport += `\n\n--------------------------------------------------------\n`
                contentToExport += `### NOTIȚE INDEXATE CAPITOL (SCRATCHPAD) ###\n`
                contentToExport += `--------------------------------------------------------\n`
                contentToExport += chapter.scratchpadContent
            }
            
            if ((chapter as any).generalNotesContent) { 
                 contentToExport += `\n\n--------------------------------------------------------\n`
                 contentToExport += `### NOTIȚE GENERALE CAPITOL ###\n`
                 contentToExport += `--------------------------------------------------------\n`
                 contentToExport += (chapter as any).generalNotesContent
            }
            
            mimeType = `text/${format === "md" ? "markdown" : "plain"};charset=utf-8`
        }

    // --- EXPORT BOOK (ALL CHAPTERS SAU RANGE) ---
    } else if (type === "book" || (type === "chapter" && range)) { 
        
        let chaptersToExport = book.chapters
        
        if (range) {
            const startIndex = Math.max(0, range.start - 1)
            const endIndex = Math.min(book.chapters.length, range.end) 
            chaptersToExport = book.chapters.slice(startIndex, endIndex)
            filename = `Carte-${safeBookTitle}-Capitole-${range.start}-la-${range.end}`
        } else {
            filename = `Carte-${safeBookTitle}-COMPLET`
        }
        
        if (format === "json") {
            const exportData: ImportedContent = {
                type: "book",
                title: book.title + (range ? ` (Range C${range.start}-C${range.end})` : ''),
                content: chaptersToExport.map(chapter => ({
                    title: chapter.title,
                    content: chapter.content,
                    scratchpadContent: chapter.scratchpadContent || "",
                    generalNotesContent: (chapter as any).generalNotesContent || "",
                })),
            }
            contentToExport = JSON.stringify(exportData, null, 2)
            mimeType = "application/json"
        } else { // txt or md
            const header = `========================================================\n`
            const headerText = `${header}CARTEA: ${book.title.toUpperCase()}\nDATA EXPORTULUI: ${formatDate(date)}\n`
            
            if (range) {
                 contentToExport += `${headerText}`
                 contentToExport += `EXPORT PARȚIAL: CAPITOLE DE LA ${range.start} LA ${range.end}\n`
                 contentToExport += `${header}\n\n`
            } else {
                 contentToExport += `${headerText}${header}\n\n`
            }

            chaptersToExport.forEach((chapter, index) => {
                const chapterIndex = (range?.start || 1) + index // Indexul real
                contentToExport += `\n\n${header}`
                contentToExport += `CAPITOLUL ${chapterIndex}: ${chapter.title.toUpperCase()}`
                contentToExport += `${header}\n\n`
                contentToExport += chapter.content
                
                if (chapter.scratchpadContent) {
                    contentToExport += `\n\n--- NOTIȚE INDEXATE CAPITOL ---\n`
                    contentToExport += chapter.scratchpadContent
                }
                
                if ((chapter as any).generalNotesContent) { 
                     contentToExport += `\n\n--- NOTIȚE GENERALE CAPITOL ---\n`
                     contentToExport += (chapter as any).generalNotesContent
                }
            })
            
            mimeType = `text/${format === "md" ? "markdown" : "plain"};charset=utf-8`
        }
    } else {
        return 
    }
    
    // --- DESCARCARE ---
    const blob = new Blob([contentToExport], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${filename}.${format}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
}

// Componentul inline pentru a selecta intervalul de capitole de exportat
const ExportChapterRangeDialog: React.FC<{
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (start: number, end: number, format: 'txt' | 'md' | 'json') => void
  book: Book | undefined | null
  start: number
  setStart: (v: number) => void
  end: number
  setEnd: (v: number) => void
  format: 'txt' | 'md' | 'json' | null
}> = ({ isOpen, onOpenChange, onConfirm, book, start, setStart, end, setEnd, format }) => {
  const maxChapters = book?.chapters.length || 0
  const actualEnd = end === 0 ? maxChapters : end
  
  useEffect(() => {
      if (isOpen && maxChapters > 0) {
          if (end === 0 || end > maxChapters) {
             setEnd(maxChapters)
          }
      }
  }, [isOpen, maxChapters, end, setEnd])

  const isValid = start >= 1 && actualEnd <= maxChapters && start <= actualEnd && format !== null

  const handleConfirm = () => {
      if (isValid && format) {
          onConfirm(start, actualEnd, format)
          onOpenChange(false)
      }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Export Interval de Capitole</DialogTitle>
          <DialogDescription>
            Selectează capitolele pe care vrei să le incluzi în export ({format ? format.toUpperCase() : 'Neselectat'}). Cartea are {maxChapters} capitole.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="start" className="text-right">De la Capitolul:</Label>
            <Input id="start" type="number" value={start} onChange={(e) => setStart(parseInt(e.target.value) || 1)} min={1} max={maxChapters} className="col-span-3"/>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="end" className="text-right">Până la Capitolul:</Label>
            <Input id="end" type="number" value={actualEnd} onChange={(e) => setEnd(parseInt(e.target.value) || maxChapters)} min={start} max={maxChapters} className="col-span-3"/>
          </div>
          {book && (
              <p className="text-sm text-center text-muted-foreground mt-2">
                  Se vor exporta {Math.max(0, actualEnd - start + 1)} capitole: de la "{book.chapters[start - 1]?.title || 'Capitol lipsă'}" la "{book.chapters[actualEnd - 1]?.title || 'Capitol lipsă'}".
              </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Anulează</Button>
          <Button onClick={handleConfirm} disabled={!isValid}>Exportă {isValid ? `(${Math.max(0, actualEnd - start + 1)} capitole)` : ''}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function DecryptedPage() {
  const router = useRouter()

  const [currentSession, setCurrentSession] = useState<UserSession | null>(null)
  const [showAdminPanel, setShowAdminPanel] = useState(false)
  const [showUserProfilePanel, setShowUserProfilePanel] = useState(false) 

  const [books, setBooks] = useState<Book[]>([])
  const [selectedBook, setSelectedBook] = useState<string | null>(null)
  const [selectedChapter, setSelectedChapter] = useState<string | null>(null)
  const [content, setContent] = useState("")
  const [autoSaveStatus, setAutoSaveStatus] = useState("Salvat")
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [editingBook, setEditingBook] = useState<string | null>(null)
  const [editingChapter, setEditingChapter] = useState<string | null>(null) 
  const [newTitle, setNewTitle] = useState("")
  
  const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false)
  const [tempGoalInput, setTempGoalInput] = useState(1000) 
  const onSetGoal = () => {
    console.log("Obiectiv setat:", tempGoalInput)
    setIsGoalDialogOpen(false)
  }
  
  const [currentScratchpadContent, setCurrentScratchpadContent] = useState("")
  const [currentGeneralNotesContent, setCurrentGeneralNotesContent] = useState("")
  
  const [currentBookStructureContent, setCurrentBookStructureContent] = useState<BookStructureContent>(initialBookStructureContent)
  
  const [isToolsPanelOpen, setIsToolsPanelOpen] = useState(false)
  const [isReferencesDialogOpen, setIsReferencesDialogOpen] = useState(false)
  const [currentCharacters, setCurrentCharacters] = useState<Character[]>([])
  const [currentLocationsContent, setCurrentLocationsContent] = useState("")
  const [currentTimelineContent, setCurrentTimelineContent] = useState("")
  const [currentKeyItemsLore, setCurrentKeyItemsLore] = useState("")
  
  // 🟢 STARE NOUĂ PENTRU DICȚIONAR
  const [currentDictionary, setCurrentDictionary] = useState<TermDefinition[]>([]) 

  const [deletingBook, setDeletingBook] = useState<string | null>(null)
  const [deletingChapter, setDeletingChapter] = useState<{ bookId: string; chapterId: string } | null>(null)
  const [draggedChapterId, setDraggedChapterId] = useState<string | null>(null)
  const [dragOverChapterId, setDragOverChapterId] = useState<string | null>(null)
  const [draggedBookId, setDraggedBookId] = useState<string | null>(null)
  const [dragOverBookId, setDragOverBookId] = useState<string | null>(null)
  const [isBookFormatActive, setIsBookFormatActive] = useState(false)
  
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false) 
  const [currentSelectionRange, setCurrentSelectionRange] = useState({ start: 0, end: 0 }) 
  const [isEditNoteDialogOpen, setIsEditNoteDialogOpen] = useState(false)
  const [noteToEditId, setNoteToEditId] = useState<number | null>(null)
  const [editNoteText, setEditNoteText] = useState("")
  const [editingNoteType, setEditingNoteType] = useState<'scratchpad' | 'general' | null>(null) 
  const [isViewNoteDialogOpen, setIsViewNoteDialogOpen] = useState(false)
  const [viewNoteTitle, setViewNoteTitle, ] = useState("")
  const [viewNoteText, setViewNoteText] = useState("")
  
  const [isRangeExportDialogOpen, setIsRangeExportDialogOpen] = useState(false)
  const [exportRangeStart, setExportRangeStart] = useState(1)
  const [exportRangeEnd, setExportRangeEnd] = useState(0)
  const [pendingExportFormat, setPendingExportFormat] = useState<'txt' | 'md' | 'json' | null>(null)
  
  const [pendingImportType, setPendingImportType] = useState<'chapter' | 'book' | null>(null) 
  const [isImportErrorOpen, setIsImportErrorOpen] = useState(false)
  const [importErrorMessage, setImportErrorMessage] = useState("")
  const [isContentImportConfirmationOpen, setIsContentImportConfirmationOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [pendingImportedContent, setPendingImportedContent] = useState<ImportedContent | null>(null)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const scratchpadRef = useRef<HTMLTextAreaElement>(null) 
  const generalNotesRef = useRef<HTMLTextAreaElement>(null) 
  const chaptersListRef = useRef<HTMLDivElement>(null)
  const [shouldScrollToScratchpad, setShouldScrollToScratchpad] = useState(false)

  const [cursorPosition, setCursorPosition] = useState<{ start: number | null; end: number | null }>({
    start: null,
    end: null,
  })
  const [lastUpdatedField, setLastUpdatedField] = useState<
    "content" | "scratchpad" | "generalNotes" | "locations" | "timeline" | "keyItemsLore" | null
  >(null)

  const { currentFontSize, toggleFontSize, fontSizeClasses } = useFontSize()
  const { mainContentClass, scratchpadClass, iconClass } = fontSizeClasses[currentFontSize]

  const handleSessionRefresh = () => {
    const updatedSession = getCurrentSession()
    setCurrentSession(updatedSession)
  }
  
  const handleInitiateRangeExport = (format: 'txt' | 'md' | 'json') => {
      if (!selectedBook || !currentBook || currentBook.chapters.length === 0) return 
      
      setPendingExportFormat(format)
      setExportRangeStart(1)
      setExportRangeEnd(currentBook.chapters.length) 
      setIsRangeExportDialogOpen(true)
  }
  
  const handleConfirmRangeExport = (start: number, end: number, format: 'txt' | 'md' | 'json') => {
      if (selectedBook) {
          exportContent("book", format, selectedBook, null, books, { start, end })
      }
      setPendingExportFormat(null)
  }
  
  const handleInitiateImport = (type: 'chapter' | 'book') => {
    if (!selectedBook || (type === 'chapter' && !selectedChapter)) {
        if (type === 'chapter' && !selectedChapter) {
            setImportErrorMessage("Trebuie să ai un capitol selectat pentru a importa conținutul în el.")
            setIsImportErrorOpen(true)
        }
        return 
    }
    
    setPendingImportType(type) 
    
    if (fileInputRef.current) {
        fileInputRef.current.accept = '.json';
    }
    fileInputRef.current?.click() 
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !selectedBook || !pendingImportType) {
         event.target.value = ''
         return 
    }

    const currentImportType = pendingImportType 
    
    const reader = new FileReader()
    reader.onload = (e) => {
        try {
            const jsonContent = e.target?.result as string
            const importedData: ImportedContent = JSON.parse(jsonContent)
            
            if (importedData.type !== currentImportType) {
                 setImportErrorMessage(`Fișierul selectat este de tip "${importedData.type.toUpperCase()}", dar ai inițiat un import de tip "${currentImportType.toUpperCase()}". Importul a fost anulat.`)
                 setIsImportErrorOpen(true)
                 return
            }

            if (importedData.type === 'chapter' && selectedChapter &&
                typeof importedData.title === 'string' &&
                typeof importedData.content === 'string'
            ) {
                setPendingImportedContent(importedData)
                setIsContentImportConfirmationOpen(true)
            } 
            else if (importedData.type === 'book' &&
                typeof importedData.title === 'string' &&
                Array.isArray(importedData.content) &&
                importedData.content.every(ch => typeof ch.title === 'string' && typeof ch.content === 'string')
            ) {
                 setPendingImportedContent(importedData)
                 setIsContentImportConfirmationOpen(true)
            } 
            else {
                setImportErrorMessage(`Structura datelor din fișierul JSON este invalidă pentru importul de tip "${importedData.type}". Asigură-te că fișierul nu a fost modificat manual sau corupt.`)
                setIsImportErrorOpen(true)
            }
        } catch (error) {
            setImportErrorMessage("Fișierul selectat nu este un fișier JSON valid sau a eșuat la parsare.")
            setIsImportErrorOpen(true)
        } finally {
            event.target.value = ''
            setPendingImportType(null) 
        }
    }
    reader.readAsText(file)
  }
  
  const handleConfirmContentImport = () => {
      if (!pendingImportedContent || !selectedBook) {
          setIsContentImportConfirmationOpen(false)
          return
      }

      const imported = pendingImportedContent
      
      if (imported.type === 'chapter' && selectedChapter) {
          setBooks((prevBooks) =>
              prevBooks.map((book) => {
                  if (book.id !== selectedBook) return book
                  return {
                      ...book,
                      chapters: book.chapters.map((chapter) =>
                          chapter.id === selectedChapter
                              ? {
                                  ...chapter,
                                  title: imported.title, 
                                  content: imported.content as string,
                                  scratchpadContent: imported.scratchpadContent || "",
                                  generalNotesContent: imported.generalNotesContent || "",
                              }
                              : chapter,
                      ),
                  }
              }),
          )
          setContent(imported.content as string)
          setCurrentScratchpadContent(imported.scratchpadContent || "")
          setCurrentGeneralNotesContent(imported.generalNotesContent || "")
          
      } else if (imported.type === 'book') {
          setBooks((prevBooks) =>
              prevBooks.map((book) => {
                  if (book.id !== selectedBook) return book

                  const newChapters = (imported.content as any[]).map((chap, index) => {
                      return {
                          id: `chapter-${Date.now()}-${index}`, 
                          title: chap.title,
                          content: chap.content,
                          scratchpadContent: chap.scratchpadContent || "",
                          generalNotesContent: chap.generalNotesContent || "",
                      } as Chapter
                  })
                  
                  setSelectedChapter(null)
                  setContent("")
                  setCurrentScratchpadContent("")
                  setCurrentGeneralNotesContent("")
                  
                  return {
                      ...book,
                      title: imported.title, 
                      chapters: newChapters,
                  }
              }),
          )
          
      } 

      setIsContentImportConfirmationOpen(false)
      setPendingImportedContent(null)
  }


  // LOGICĂ INPUT
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value
    const transformedText = capitalizeText(newText)
    const start = e.target.selectionStart
    const end = e.target.selectionEnd;

    if (transformedText.length > newText.length) {
      setCursorPosition({
        start: start + (transformedText.length - newText.length),
        end: end + (transformedText.length - newText.length),
      })
    } else {
      setCursorPosition({ start, end })
    }

    setLastUpdatedField("content")
    setContent(transformedText)
  }

  const handleScratchpadChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value
    const start = e.target.selectionStart
    const end = e.target.selectionEnd
    setCursorPosition({ start, end })
    setLastUpdatedField("scratchpad")
    setCurrentScratchpadContent(newText)
  }
  
  const handleGeneralNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value
    const start = e.target.selectionStart
    const end = e.target.selectionEnd
    setCursorPosition({ start, end })
    setLastUpdatedField("generalNotes")
    setCurrentGeneralNotesContent(newText)
  }

  // --- EFFECT: LOAD DATA ---
  useEffect(() => {
    initializeDefaultAdmin()
    const session = getCurrentSession()

    if (!session) {
      router.push("/login")
      return
    }

    setCurrentSession(session)

    // Load user data
    const userData = getUserData(session.userId)
    const loadedBooks: Book[] = userData.books.map((book: any) => ({
      ...book,
      isPinned: book.isPinned === undefined ? false : book.isPinned,
      characters: Array.isArray(book.characters)
        ? book.characters.map((char: any) => ({
            ...char,
            detailedCharacteristics: Array.isArray(char.detailedCharacteristics) ? char.detailedCharacteristics : [],
            isPinned: char.isPinned === undefined ? false : char.isPinned,
            role: char.role || "secondary",
            socialRank: char.socialRank || "commoner",
            isAlive: char.isAlive === undefined ? true : char.isAlive,
          }))
        : [],
      locations: book.locations || "",
      timeline: book.timeline || "",
      keyItemsLore: book.keyItemsLore || "",
      bookStructure: parseBookStructure(book.bookStructure), 
      // 🟢 ÎNCĂRCARE DICȚIONAR (gestionare compatibilitate)
      dictionary: Array.isArray(book.dictionary) ? book.dictionary : [], 
      chapters: book.chapters.map((chapter: any) => ({
        ...chapter,
        scratchpadContent: chapter.scratchpadContent || "",
        generalNotesContent: chapter.generalNotesContent || "", 
      })),
    }))

    setBooks(loadedBooks)
    
    setCurrentSelectionRange({ start: 0, end: 0 }) 

    setIsLoading(false)
  }, [router])

  // EFFECT 1: Salvarea structurii books în localStorage
  useEffect(() => {
    if (!currentSession || isLoading) return

    const saveTimer = setTimeout(() => {
      const booksToSave = books.map(book => ({
          ...book,
          bookStructure: typeof (book as any).bookStructure === 'object'
            ? JSON.stringify((book as any).bookStructure)
            : (book as any).bookStructure, 
      }))

      saveUserBooks(currentSession.userId, booksToSave as Book[])
    }, 1000)

    return () => clearTimeout(saveTimer)
  }, [books, currentSession, isLoading])

  // EFFECT 3 CRITIC: AUTO-SAVE Content
  useEffect(() => {
    if (!selectedChapter || isLoading) return

    const currentBook = books.find((b) => b.id === selectedBook)
    const currentChapter = currentBook?.chapters.find((c) => c.id === selectedChapter)

    const isContentDifferent = currentChapter?.content !== content
    const isScratchpadDifferent = currentChapter?.scratchpadContent !== currentScratchpadContent
    const isGeneralNotesDifferent = (currentChapter as any)?.generalNotesContent !== currentGeneralNotesContent
    
    if (!isContentDifferent && !isScratchpadDifferent && !isGeneralNotesDifferent) {
        return
    }

    setAutoSaveStatus("Se salvează...")
    
    const contentUpdateTimer = setTimeout(() => {
        setBooks((prevBooks) =>
            prevBooks.map((book) => {
                if (book.id !== selectedBook) return book

                return {
                    ...book,
                    chapters: book.chapters.map((chapter) =>
                        chapter.id === selectedChapter
                            ? {
                                ...chapter,
                                content: content, 
                                scratchpadContent: currentScratchpadContent, 
                                generalNotesContent: currentGeneralNotesContent, 
                            }
                            : chapter,
                    ),
                }
            }),
        )
        setAutoSaveStatus("Salvat")
    }, 1000)

    return () => {
        clearTimeout(contentUpdateTimer)
    }
  }, [content, currentScratchpadContent, currentGeneralNotesContent, selectedChapter, selectedBook, isLoading]) 

  /**
   * EFFECT 4 CRITIC: Sincronizarea datelor din panoul de referințe cu structura cărții
   */
  useEffect(() => {
    if (!selectedBook || isLoading) return

    const currentBook = books.find((b) => b.id === selectedBook)
    if (!currentBook) return

    const savedBookStructureObject = parseBookStructure((currentBook as any)?.bookStructure)

    const locationsChanged = currentLocationsContent !== currentBook.locations
    const timelineChanged = currentTimelineContent !== currentBook.timeline
    const keyItemsLoreChanged = currentKeyItemsLore !== currentBook.keyItemsLore
    const charactersChanged = JSON.stringify(currentCharacters) !== JSON.stringify(currentBook.characters)
    const bookStructureChanged = JSON.stringify(currentBookStructureContent) !== JSON.stringify(savedBookStructureObject)
    
    // 🟢 VERIFICARE SCHIMBARE DICȚIONAR
    const dictionaryChanged = JSON.stringify(currentDictionary) !== JSON.stringify(currentBook.dictionary || [])

    if (!charactersChanged && !locationsChanged && !timelineChanged && !keyItemsLoreChanged && !bookStructureChanged && !dictionaryChanged) {
        return
    }

    setBooks((prevBooks) =>
      prevBooks.map((book) =>
        book.id === selectedBook
          ? {
              ...book,
              characters: currentCharacters,
              locations: currentLocationsContent,
              timeline: currentTimelineContent,
              keyItemsLore: currentKeyItemsLore,
              bookStructure: currentBookStructureContent,
              dictionary: currentDictionary, // 🟢 ACTUALIZARE DICȚIONAR ÎN CARTE
            }
          : book,
      ),
    )
  }, [
    currentCharacters,
    currentLocationsContent,
    currentTimelineContent,
    currentKeyItemsLore,
    currentBookStructureContent, 
    currentDictionary, // 🟢 Dependency nou
    selectedBook,
    isLoading,
  ])
  
  // EFFECT 6: Aplicarea cursorului și scroll-ului
  useLayoutEffect(() => {
    if (!lastUpdatedField) return

    let targetTextarea: HTMLTextAreaElement | null = null

    switch (lastUpdatedField) {
      case "content":
        targetTextarea = textareaRef.current
        break
      case "scratchpad":
        targetTextarea = scratchpadRef.current
        if (targetTextarea && shouldScrollToScratchpad) {
            targetTextarea.scrollTop = targetTextarea.scrollHeight
            setShouldScrollToScratchpad(false)
        }
        break
      case "generalNotes":
          targetTextarea = generalNotesRef.current
          break
      default:
        break
    }

    if (targetTextarea && cursorPosition.start !== null && cursorPosition.end !== null) {
      const newStart = Math.min(cursorPosition.start, targetTextarea.value.length)
      const newEnd = Math.min(cursorPosition.end, targetTextarea.value.length)

      targetTextarea.setSelectionRange(newStart, newEnd)
      targetTextarea.focus()

      setCursorPosition({ start: null, end: null })
      setLastUpdatedField(null)
    }
  }, [lastUpdatedField, cursorPosition, shouldScrollToScratchpad])

  const wordCount = useMemo(() => {
    if (!content) return 0
    const words = content.match(/\b\w+\b/g)
    return words ? words.length : 0
  }, [content])
  
  // Funcții de control pentru Dialog-uri
  const handleLogoutConfirmation = () => { setIsLogoutDialogOpen(true) }
  const handleConfirmLogout = () => { setIsLogoutDialogOpen(false); logout(); router.push("/login") }
  const handleToggleUserProfilePanel = () => { setShowUserProfilePanel(!showUserProfilePanel); if (showAdminPanel) setShowAdminPanel(false) }
  const handleToggleAdminPanel = () => { setShowAdminPanel(!showAdminPanel); if (showUserProfilePanel) setShowUserProfilePanel(false) }
  const handleSelectionRangeChange = (start: number, end: number) => { setCurrentSelectionRange({ start, end }) }

  const handleNavigateToSelection = (start: number, end: number) => {
      if (!textareaRef.current) return
      const safeStart = Math.min(start, content.length)
      const safeEnd = Math.min(end, content.length)
      textareaRef.current.focus()
      textareaRef.current.setSelectionRange(safeStart, safeEnd) 
      setTimeout(() => {
          if (textareaRef.current) {
            const textarea = textareaRef.current
            const textareaHeight = textarea.clientHeight
            const measureDiv = document.createElement('div')
            measureDiv.style.visibility = 'hidden'
            measureDiv.style.position = 'absolute'
            measureDiv.style.width = `${textarea.clientWidth}px`
            measureDiv.style.fontSize = getComputedStyle(textarea).fontSize
            measureDiv.style.fontFamily = getComputedStyle(textarea).fontFamily
            measureDiv.style.whiteSpace = 'pre-wrap' 
            measureDiv.textContent = textarea.value.substring(0, safeStart)
            document.body.appendChild(measureDiv)
            const selectionTop = measureDiv.offsetHeight 
            document.body.removeChild(measureDiv) 
            const scrollTopTarget = Math.max(0, selectionTop - (textareaHeight / 3))
            textarea.scrollTop = scrollTopTarget
          }
      }, 50);
  }
  
  const handleAddNote = (notePrefix: string) => {
      const newLine = currentScratchpadContent.length > 0 && !currentScratchpadContent.endsWith('\n') ? '\n' : '' // Corrected variable usage
      const newContent = currentScratchpadContent + newLine + notePrefix + '\n'
      setCurrentScratchpadContent(newContent)
      const newCursorPosition = newContent.length - 1 
      setCursorPosition({ start: newCursorPosition, end: newCursorPosition })
      setLastUpdatedField("scratchpad")
      setShouldScrollToScratchpad(true)
  }

  const manipulateNoteContent = (type: 'scratchpad' | 'general', noteId: number, updateFn: (line: string) => string) => {
      const contentState = type === 'scratchpad' ? currentScratchpadContent : currentGeneralNotesContent
      const setContentState = type === 'scratchpad' ? setCurrentScratchpadContent : setCurrentGeneralNotesContent
      const lines = contentState.split('\n')
      if (noteId >= 0 && noteId < lines.length) {
          lines[noteId] = updateFn(lines[noteId])
          setContentState(lines.join('\n'))
      }
  }

  const handleOpenEditDialog = (type: 'scratchpad' | 'general', noteId: number) => {
    const contentState = type === 'scratchpad' ? currentScratchpadContent : currentGeneralNotesContent
    const lines = contentState.split('\n')
    if (noteId >= 0 && noteId < lines.length) {
        const noteLine = lines[noteId]
        const textWithoutPin = noteLine.replace(/^🚩\s*/, '')
        let contentMatch;
        if (type === 'scratchpad') {
             contentMatch = textWithoutPin.match(/(^•\s*\[#\d+:\d+\]:\s*|^•\s*\[#\d+\]:\s*)(.*)/s)
        } else {
             contentMatch = textWithoutPin.match(/(^•\s*)(.*)/s)
        }
        if (contentMatch) {
            setNoteToEditId(noteId)
            setEditingNoteType(type) 
            const actualText = contentMatch[2] || '';
            setEditNoteText(actualText);
            setIsEditNoteDialogOpen(true)
        } else {
             console.error("Linia nu este o notiță validă pentru editare.")
        }
    }
  }
  
  const handleConfirmEditNote = () => {
    if (noteToEditId === null || editingNoteType === null) return
    const type = editingNoteType
    const realIndex = noteToEditId
    manipulateNoteContent(type, realIndex, (line) => {
        const hasPin = line.trim().startsWith("🚩")
        const lineWithoutPin = line.replace(/^🚩\s*/, '')
        let prefixMatch;
        if (type === 'scratchpad') {
             prefixMatch = lineWithoutPin.match(/(^•\s*\[#\d+:\d+\]:\s*|^•\s*\[#\d+\]:\s*)/)
        } else {
             prefixMatch = lineWithoutPin.match(/(^•\s*)/)
        }
        let newNoteLine = (prefixMatch ? prefixMatch[0] : '• ') + editNoteText
        if (hasPin) newNoteLine = '🚩 ' + newNoteLine.trimStart()
        return newNoteLine
    })
    setIsEditNoteDialogOpen(false)
    setEditNoteText("")
    setNoteToEditId(null)
    setEditingNoteType(null)
  }
  
  const handleTogglePinNote = (type: 'scratchpad' | 'general', noteId: number) => {
    manipulateNoteContent(type, noteId, (line) => {
        if (line.trim().startsWith("🚩")) return line.replace(/^🚩\s*/, '')
        else return '🚩 ' + line.trimStart() 
    })
  }
  
  const handleDeleteNote = (type: 'scratchpad' | 'general', noteId: number) => {
    const contentState = type === 'scratchpad' ? currentScratchpadContent : currentGeneralNotesContent
    const setContentState = type === 'scratchpad' ? setCurrentScratchpadContent : setCurrentGeneralNotesContent
    const lines = contentState.split('\n')
    if (noteId >= 0 && noteId < lines.length) {
        const newLines = lines.filter((_, index) => index !== noteId)
        setContentState(newLines.join('\n'))
    }
  }
  
  const handleOpenViewDialog = (title: string, text: string) => {
      setViewNoteTitle(title)
      setViewNoteText(text)
      setIsViewNoteDialogOpen(true)
  }


  const handleSelectBookOnly = (bookId: string | null) => {
    if (!bookId) {
      setSelectedBook(null)
      setSelectedChapter(null)
      setCurrentCharacters([])
      setCurrentLocationsContent("")
      setCurrentTimelineContent("")
      setCurrentKeyItemsLore("")
      setCurrentBookStructureContent(initialBookStructureContent) 
      setCurrentDictionary([]) // 🟢 RESET DICTIONARY
      setContent("")
      setCurrentScratchpadContent("") 
      setCurrentGeneralNotesContent("") 
      return
    }

    const book = books.find((b) => b.id === bookId)
    if (!book) return

    setSelectedBook(bookId)
    setSelectedChapter(null)
    setCurrentCharacters(book.characters || [])
    setCurrentLocationsContent(book.locations || "")
    setCurrentTimelineContent(book.timeline || "")
    setCurrentKeyItemsLore(book.keyItemsLore || "")
    setCurrentBookStructureContent(parseBookStructure((book as any).bookStructure)) 
    // 🟢 LOAD DICTIONARY
    setCurrentDictionary(book.dictionary || []) 
    setContent("")
    setCurrentScratchpadContent("") 
    setCurrentGeneralNotesContent("• ") 
  }

  const handleLoadChapter = (bookId: string, chapterId: string) => {
    const book = books.find((b) => b.id === bookId)
    if (!book) return

    const chapter = book.chapters.find((c) => c.id === chapterId)
    if (!chapter) return

    setSelectedBook(bookId)
    setSelectedChapter(chapterId)
    setContent(chapter.content)
    setCurrentScratchpadContent(chapter.scratchpadContent || "")
    
    const loadedGeneralNotes = (chapter as any).generalNotesContent || ""
    setCurrentGeneralNotesContent(loadedGeneralNotes.trim() === '' ? '• ' : loadedGeneralNotes)
    
    setCurrentCharacters(book.characters || [])
    setCurrentLocationsContent(book.locations || "")
    setCurrentTimelineContent(book.timeline || "")
    setCurrentKeyItemsLore(book.keyItemsLore || "")
    setCurrentBookStructureContent(parseBookStructure((book as any).bookStructure))
    // 🟢 LOAD DICTIONARY
    setCurrentDictionary(book.dictionary || [])
  }

  const currentBook = books.find((b) => b.id === selectedBook)
  const currentChapter = currentBook?.chapters.find((c) => c.id === selectedChapter)
  const filteredBooks = getFilteredBooks(books, searchQuery)
  
  const onCreateDynamicAction = selectedBook 
      ? () => createNewChapter(
          selectedBook,
          books,
          setBooks,
          setSelectedChapter,
          setContent,
          setCurrentScratchpadContent,
          chaptersListRef,
        )
      : () => createNewBook(
          books,
          setBooks,
          setSelectedBook,
          setContent,
          setCurrentScratchpadContent,
          setCurrentCharacters,
          setCurrentLocationsContent,
          setCurrentTimelineContent,
          setCurrentKeyItemsLore,
          setCurrentBookStructureContent,
          setCurrentDictionary // 🟢 PASS SETTER
        )


  if (isLoading || !currentSession) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-xl font-semibold">Se încarcă...</p>
      </div>
    )
  }

  return (
    <div className={`flex h-screen bg-background transition-colors duration-500 ease-in-out`}>
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" style={{ display: 'none' }} />
      
      <Sidebar
        books={books}
        selectedBook={selectedBook}
        selectedChapter={selectedChapter}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        editingBook={editingBook}
        setEditingBook={setEditingBook}
        editingChapter={editingChapter} 
        setEditingChapter={setEditingChapter}
        newTitle={newTitle}
        setNewTitle={setNewTitle}
        onRenameBook={() => renameBook(editingBook!, newTitle, setBooks, setEditingBook)}
        onRenameChapter={() => renameChapter(selectedBook!, editingChapter!, newTitle, setBooks, setEditingChapter)}
        onCreateAction={onCreateDynamicAction}
        onSelectBookOnly={handleSelectBookOnly}
        onLoadChapter={handleLoadChapter}
        onToggleBookPin={(bookId) => toggleBookPin(bookId, setBooks)}
        onTriggerDeleteBook={(bookId) => triggerDeleteBook(bookId, books, setDeletingBook)}
        onTriggerDeleteChapter={(bookId, chapterId) => triggerDeleteChapter(bookId, chapterId, setDeletingChapter)}
        onDropChapter={(bookId, targetChapterId) => handleDropChapter(bookId, targetChapterId, draggedChapterId, setBooks, setDraggedChapterId, setDragOverChapterId)}
        onDropBook={(targetBookId) => handleDropBook(targetBookId, draggedBookId, setBooks)}
        filteredBooks={filteredBooks}
        chaptersListRef={chaptersListRef}
        draggedChapterId={draggedChapterId}
        setDraggedChapterId={setDraggedChapterId}
        dragOverChapterId={dragOverChapterId}
        setDragOverChapterId={setDragOverChapterId}
        draggedBookId={draggedBookId}
        setDraggedBookId={setDraggedBookId}
        dragOverBookId={dragOverBookId}
        setDragOverBookId={setDragOverBookId}
        onLogout={handleLogoutConfirmation}
        onSetGoal={() => setIsGoalDialogOpen(true)} 
      />

      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b flex justify-between items-center bg-background transition-colors duration-500 ease-in-out">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold transition-colors duration-500 ease-in-out">
              {selectedChapter && currentChapter ? currentChapter.title : selectedBook && currentBook ? currentBook.title : "Selectează o carte"}
            </h1>
            <span className="text-sm text-muted-foreground transition-colors duration-500 ease-in-out">• {currentSession?.name}</span> 
          </div>

          <div className="flex gap-3">
            <Button variant="outline" size="icon" onClick={handleToggleUserProfilePanel} className={`gap-2 ${showUserProfilePanel ? "text-blue-500 border-blue-500" : ""} transition-colors duration-500 ease-in-out`}>
              <User className="h-4 w-4" />
            </Button>
            
            {isAdmin(currentSession) && (
              <Button variant="outline" size="icon" onClick={handleToggleAdminPanel} className={`gap-2 ${showAdminPanel ? "text-amber-500 border-amber-500" : ""} transition-colors duration-500 ease-in-out`}>
                <Shield className="w-4 h-4" />
              </Button>
            )}

            {selectedChapter && (
              <>
                <Button onClick={toggleFontSize} size="sm" variant="outline" className="gap-2 p-0 h-9 w-9 bg-transparent transition-colors duration-500 ease-in-out">
                  <span className={`font-normal ${iconClass}`}>A</span>
                </Button>
                <Button onClick={() => setIsBookFormatActive(!isBookFormatActive)} size="sm" variant={isBookFormatActive ? "default" : "outline"} className="gap-2 p-0 h-9 w-9 transition-colors duration-500 ease-in-out">
                  <BookOpen className="w-4 h-4" />
                </Button>
              </>
            )}

            {selectedChapter && (
              <Button size="sm" variant={isToolsPanelOpen ? "default" : "outline"} className={`gap-2 transition-colors duration-500 ease-in-out`} onClick={() => setIsToolsPanelOpen(!isToolsPanelOpen)} title="Panou Notițe și Unelte">
                <NotebookText className="w-4 h-4" /> 
              </Button>
            )}
            
            {selectedBook && selectedChapter && ( 
              <Button onClick={() => setIsReferencesDialogOpen(true)} size="sm" variant="outline" className="gap-2 transition-colors duration-500 ease-in-out" title="Referințe Carte">
                <FileText className="w-4 h-4" />
              </Button>
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline" className="gap-2 transition-colors duration-500 ease-in-out" title="Export/Import Conținut">
                  <Menu className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72">
                {selectedChapter && (
                  <>
                    <DropdownMenuLabel className="font-bold text-sm flex items-center gap-2 text-blue-600">
                      <File className="w-4 h-4" /> Exportă Capitolul Curent
                    </DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => exportContent("chapter", "json", selectedBook!, selectedChapter, books)} className="cursor-pointer font-semibold ml-2 hover:bg-blue-50/50">
                       <Download className="w-4 h-4 mr-2 text-blue-700/80" /> .json (Backup/Import)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => exportContent("chapter", "txt", selectedBook!, selectedChapter, books)} className="cursor-pointer ml-2 hover:bg-blue-50/50">
                       <Download className="w-4 h-4 mr-2 text-blue-700/80" /> .txt (Text Simplu)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => exportContent("chapter", "md", selectedBook!, selectedChapter, books)} className="cursor-pointer ml-2 hover:bg-blue-50/50">
                       <Download className="w-4 h-4 mr-2 text-blue-700/80" /> .md (Markdown)
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                
                {currentBook && currentBook.chapters.length > 1 && (
                    <>
                      <DropdownMenuLabel className="font-bold text-sm flex items-center gap-2 text-indigo-600">
                         <FileText className="w-4 h-4" /> Exportă Interval de Capitole
                      </DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => handleInitiateRangeExport('json')} className="cursor-pointer font-semibold ml-2 hover:bg-indigo-50/50">
                        <Download className="w-4 h-4 mr-2 text-indigo-700/80" /> .json (Backup)
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleInitiateRangeExport('txt')} className="cursor-pointer ml-2 hover:bg-indigo-50/50">
                        <Download className="w-4 h-4 mr-2 text-indigo-700/80" /> .txt (Text Simplu)
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleInitiateRangeExport('md')} className="cursor-pointer ml-2 hover:bg-indigo-50/50">
                        <Download className="w-4 h-4 mr-2 text-indigo-700/80" /> .md (Markdown)
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                )}
                
                {selectedBook && (
                  <>
                    <DropdownMenuLabel className="font-bold text-sm flex items-center gap-2 text-blue-600">
                      <Book className="w-4 h-4" /> Exportă Toată Cartea (Complet)
                    </DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => exportContent("book", "json", selectedBook, null, books)} className="cursor-pointer font-semibold ml-2 hover:bg-blue-50/50">
                      <Download className="w-4 h-4 mr-2 text-blue-700/80" /> .json (Backup/Import Complet)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => exportContent("book", "txt", selectedBook, null, books)} className="cursor-pointer ml-2 hover:bg-blue-50/50">
                      <Download className="w-4 h-4 mr-2 text-blue-700/80" /> .txt (Text Simplu)
                    </DropdownMenuItem>
                     <DropdownMenuItem onClick={() => exportContent("book", "md", selectedBook, null, books)} className="cursor-pointer ml-2 hover:bg-blue-50/50">
                      <Download className="w-4 h-4 mr-2 text-blue-700/80" /> .md (Markdown)
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}

                <DropdownMenuLabel className="font-bold text-sm flex items-center gap-2 text-green-600">
                  <Upload className="w-4 h-4" /> Importă Conținut (.json)
                </DropdownMenuLabel>

                <DropdownMenuItem onClick={() => handleInitiateImport('chapter')} className={`cursor-pointer ml-2 ${!selectedChapter ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-50/50'}`} disabled={!selectedChapter}>
                  <ClipboardPen className="w-4 h-4 mr-2 text-green-700/80" /> {selectedChapter ? "În Capitolul Curent" : "Capitolul Curent (Neselectat)"}
                </DropdownMenuItem>
                
                 <DropdownMenuItem onClick={() => handleInitiateImport('book')} className="cursor-pointer ml-2 font-semibold hover:bg-green-50/50">
                  <Feather className="w-4 h-4 mr-2 text-green-700/80" /> În Toată Cartea (Capitole)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {selectedChapter && (
              <Button size="sm" variant={autoSaveStatus === "Salvat" ? "secondary" : "default"} disabled={autoSaveStatus === "Salvat" || autoSaveStatus === "Se salvează..."} className="transition-colors duration-500 ease-in-out">
                {autoSaveStatus}
              </Button>
            )}
          </div>
        </div>

        {showAdminPanel && isAdmin(currentSession) && (
          <div className="p-4 border-b bg-background transition-colors duration-500 ease-in-out">
            <AdminPanel />
          </div>
        )}

        {showUserProfilePanel && (
          <div className="p-4 border-b bg-background transition-colors duration-500 ease-in-out">
            <UserProfilePanel onClose={() => setShowUserProfilePanel(false)} onSessionUpdate={handleSessionRefresh} />
          </div>
        )}

        <div className="flex flex-1 overflow-hidden transition-colors duration-500 ease-in-out">
          <div className={`flex-1 ${isToolsPanelOpen ? "w-2/3" : "w-full"} p-4 overflow-y-auto bg-background transition-colors duration-500 ease-in-out`}>
            <MainEditor
              selectedBook={selectedBook}
              selectedChapter={selectedChapter}
              currentBook={currentBook}
              currentChapter={currentChapter}
              content={content}
              onContentChange={handleContentChange}
              isBookFormatActive={isBookFormatActive}
              mainContentClass={mainContentClass}
              textareaRef={textareaRef}
              onOpenReferences={() => setIsReferencesDialogOpen(true)}
              onSelectionRangeChange={handleSelectionRangeChange} 
            />
          </div>

          {selectedChapter && isToolsPanelOpen && (
            <ToolsPanel
              wordCount={wordCount}
              currentScratchpadContent={currentScratchpadContent}
              onScratchpadChange={handleScratchpadChange}
              scratchpadRef={scratchpadRef}
              currentGeneralNotesContent={currentGeneralNotesContent}
              onGeneralNotesChange={handleGeneralNotesChange}
              generalNotesRef={generalNotesRef}
              isBookFormatActive={isBookFormatActive}
              scratchpadClass={scratchpadClass}
              onNavigateToSelection={handleNavigateToSelection} 
              currentSelectionRange={currentSelectionRange}
              onAddNote={handleAddNote}
              onTogglePinNote={handleTogglePinNote}
              onDeleteNote={handleDeleteNote}
              onEditNote={handleOpenEditDialog} 
              onViewNote={handleOpenViewDialog}
            />
          )}
        </div>
      </div>

      <Dialogs
        isGoalDialogOpen={isGoalDialogOpen}
        setIsGoalDialogOpen={setIsGoalDialogOpen}
        tempGoalInput={tempGoalInput}
        setTempGoalInput={setTempGoalInput}
        onSetGoal={onSetGoal}
        editingBook={editingBook}
        setEditingBook={setEditingBook}
        newTitle={newTitle}
        setNewTitle={setNewTitle}
        onRenameBook={() => renameBook(editingBook!, newTitle, setBooks, setEditingBook)}
        onRenameChapter={() => renameChapter(selectedBook!, editingChapter!, newTitle, setBooks, setEditingChapter)}
        editingChapter={editingChapter}
        setEditingChapter={setEditingChapter} 
        deletingBook={deletingBook}
        setDeletingBook={setDeletingBook}
        books={books}
        onConfirmDeleteBook={() =>
          handleConfirmDeleteBook(
            deletingBook,
            books,
            setBooks,
            selectedBook,
            setSelectedBook,
            setSelectedChapter,
            setContent,
            setCurrentScratchpadContent,
            setCurrentCharacters,
            setCurrentLocationsContent,
            setCurrentTimelineContent,
            setCurrentKeyItemsLore,
            setCurrentBookStructureContent, 
            setIsToolsPanelOpen, 
            setDeletingBook,
            setCurrentDictionary // 🟢 PASS SETTER TO DELETE LOGIC
          )
        }
        deletingChapter={deletingChapter}
        setDeletingChapter={setDeletingChapter}
        onConfirmDeleteChapter={() => handleConfirmDeleteChapter(deletingChapter, books, setBooks, selectedChapter, setSelectedChapter, setContent, setCurrentScratchpadContent, setIsToolsPanelOpen, setDeletingChapter)}
        isLogoutDialogOpen={isLogoutDialogOpen}
        setIsLogoutDialogOpen={setIsLogoutDialogOpen}
        onConfirmLogout={handleConfirmLogout} 
      />

      <BookReferencesDialog
        isOpen={isReferencesDialogOpen}
        onOpenChange={setIsReferencesDialogOpen}
        bookTitle={currentBook?.title || ""}
        currentCharacters={currentCharacters}
        setCurrentCharacters={setCurrentCharacters}
        currentLocationsContent={currentLocationsContent}
        setCurrentLocationsContent={setCurrentLocationsContent}
        currentTimelineContent={currentTimelineContent}
        setCurrentTimelineContent={setCurrentTimelineContent}
        currentKeyItemsLore={currentKeyItemsLore}
        setCurrentKeyItemsLore={setCurrentKeyItemsLore}
        currentStructureContent={currentBookStructureContent}
        setCurrentStructureContent={setCurrentBookStructureContent}
        // 🟢 PROPS PENTRU DIALOG
        currentDictionary={currentDictionary}
        setCurrentDictionary={setCurrentDictionary}
      />
      
      <EditNoteDialog
        isOpen={isEditNoteDialogOpen}
        onOpenChange={setIsEditNoteDialogOpen}
        noteText={editNoteText}
        setNoteText={setEditNoteText}
        onConfirmEdit={handleConfirmEditNote}
      />
      
      <ViewNoteDialog
        isOpen={isViewNoteDialogOpen}
        onOpenChange={setIsViewNoteDialogOpen}
        noteTitle={viewNoteTitle}
        noteText={viewNoteText}
      />
      
      <ImportErrorDialog
        isOpen={isImportErrorOpen}
        onOpenChange={setIsImportErrorOpen}
        errorMessage={importErrorMessage}
      />
      
      <DeleteConfirmationDialog 
        isOpen={isContentImportConfirmationOpen}
        onOpenChange={setIsContentImportConfirmationOpen}
        onConfirm={handleConfirmContentImport}
        itemToDelete={
            pendingImportedContent?.type === 'chapter' && selectedChapter ? `Conținutul Capitolului: ${currentChapter?.title || 'Fără Titlu'}.`
          : pendingImportedContent?.type === 'book' ? `Conținutul Cărții: ${currentBook?.title || 'Fără Titlu'} (Toate Capitolele).`
          : "Conținutul selectat."
        } 
        dialogTitle={`Confirmare Import Conținut: ${pendingImportedContent?.type === 'chapter' ? 'Capitol' : 'Toată Cartea'}`}
        dialogDescription={`Ești sigur că vrei să imporți fișierul de tip **${pendingImportedContent?.type === 'chapter' ? 'Capitol' : 'Carte'}**? Această acțiune va **suprascrie** ${
            pendingImportedContent?.type === 'chapter' ? `conținutul capitolului curent (**${currentChapter?.title || 'Fără Titlu'}**)`
          : `toate capitolele din cartea curentă (**${currentBook?.title || 'Fără Titlu'}**)`
        } cu datele din fișierul JSON.`}
        confirmButtonText="Da, Importă și Suprascrie"
        cancelButtonText="Anulează Importul"
        isDestructive={true} 
      />
      
      <ExportChapterRangeDialog 
        isOpen={isRangeExportDialogOpen}
        onOpenChange={setIsRangeExportDialogOpen}
        onConfirm={handleConfirmRangeExport}
        book={currentBook}
        start={exportRangeStart}
        setStart={setExportRangeStart}
        end={exportRangeEnd}
        setEnd={setExportRangeEnd}
        format={pendingExportFormat}
      />
    </div>
  )
}