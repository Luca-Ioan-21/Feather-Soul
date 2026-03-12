"use client"

import type React from "react"
import { useState } from "react"
// Am ajustat calea importului (pentru a se potrivi cu structura ta unică)
import { Button } from "../../../components/ui/button" 
import { Input } from "../../../components/ui/input"
import { Separator } from "../../../components/ui/separator"
// Am eliminat 'ArrowLeft' și am adăugat 'LogOut' la importuri
import { Search, Plus, Edit2, Trash2, Pin, ChevronLeft, ChevronRight, LogOut } from "lucide-react" 
import { ThemeToggle } from "./theme-toggle"
// CORECȚIE CRITICĂ: Eliminăm importul local 'router' care cauza eroarea!\
// import { router } from "../functions/theme" 
import type { Book } from "../types/book"

interface SidebarProps {
  books: Book[]
  selectedBook: string | null
  selectedChapter: string | null
  searchQuery: string
  setSearchQuery: (query: string) => void
  editingBook: string | null
  setEditingBook: (id: string | null) => void
  // Prop-uri pentru editarea capitolului (rezolvă problemele anterioare)
  editingChapter: string | null
  setEditingChapter: (id: string | null) => void
  newTitle: string
  setNewTitle: (title: string) => void
  // MODIFICAT: Acțiune dinamică în loc de onCreateBook
  onCreateAction: () => void
  onSelectBookOnly: (bookId: string) => void
  onLoadChapter: (bookId: string, chapterId: string) => void
  onToggleBookPin: (bookId: string) => void
  onTriggerDeleteBook: (bookId: string) => void
  onTriggerDeleteChapter: (bookId: string, chapterId: string) => void
  onCreateChapter: () => void
  onDropChapter: (bookId: string, targetChapterId: string) => void
  onDropBook: (targetBookId: string) => void
  filteredBooks: Book[]
  chaptersListRef: React.RefObject<HTMLDivElement>
  draggedChapterId: string | null
  setDraggedChapterId: (id: string | null) => void
  dragOverChapterId: string | null
  setDragOverChapterId: (id: string | null) => void
  draggedBookId: string | null
  setDraggedBookId: (id: string | null) => void
  dragOverBookId: string | null
  setDragOverBookId: (id: string | null) => void
  // Prop-ul onLogout (rezolvă problema anterioară)
  onLogout: () => void 
}

export function Sidebar({
  books,
  selectedBook,
  selectedChapter,
  searchQuery,
  setSearchQuery,
  editingBook,
  setEditingBook,
  editingChapter,
  setEditingChapter,
  newTitle,
  setNewTitle,
  // MODIFICAT: Primesc onCreateAction
  onCreateAction,
  onSelectBookOnly,
  onLoadChapter,
  onToggleBookPin,
  onTriggerDeleteBook,
  onTriggerDeleteChapter,
  onCreateChapter,
  onDropChapter,
  onDropBook,
  filteredBooks,
  chaptersListRef,
  draggedChapterId,
  setDraggedChapterId,
  dragOverChapterId,
  setDragOverChapterId,
  draggedBookId,
  setDraggedBookId,
  dragOverBookId,
  setDragOverBookId,
  onLogout,
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  const handleDropBook = (targetBookId: string) => {
    if (!draggedBookId || draggedBookId === targetBookId) {
      setDraggedBookId(null)
      setDragOverBookId(null)
      return
    }

    onDropBook(targetBookId)
    setDraggedBookId(null)
    setDragOverBookId(null)
  }

  if (isCollapsed) {
    return (
      // APLICĂ TRANZIȚIA PE CONTAINERUL RESTRÂNS
      <div className="w-16 border-r flex flex-col items-center py-4 space-y-4 bg-background transition-colors duration-500 ease-in-out">
        {/* Buton Expand - ADAUGĂ TRANZIȚIE */}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setIsCollapsed(false)} 
          aria-label="Expand sidebar"
          className="transition-colors duration-500 ease-in-out"
        >
          <ChevronRight className="w-5 h-5" />
        </Button>

        <ThemeToggle />

        <div className="flex-1 flex items-center justify-center">
          <p className="text-3xl font-bold whitespace-nowrap transform -rotate-90 origin-center tracking-wide text-foreground transition-colors duration-500 ease-in-out">
            S&nbsp;&nbsp;u&nbsp;&nbsp;f&nbsp;&nbsp;l&nbsp;&nbsp;e&nbsp;&nbsp;t&nbsp;&nbsp; &nbsp;&nbsp;d&nbsp;&nbsp;e&nbsp;&nbsp; &nbsp;&nbsp;P&nbsp;&nbsp;e&nbsp;&nbsp;n&nbsp;&nbsp;i&nbsp;&nbsp;ț&nbsp;&nbsp;ă
          </p>
        </div>

        {/* Buton Delogare Stare Restrânsă - ADAUGĂ TRANZIȚIE */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onLogout}
          aria-label="Delogare"
          // TRANZIȚIE ASIGURATĂ AICI
          className="mt-auto text-destructive hover:text-destructive/80 transition-colors duration-500 ease-in-out"
        >
          <LogOut className="w-5 h-5" />
        </Button>
      </div>
    )
  }

  return (
    // APLICĂ TRANZIȚIA PE CONTAINERUL EXTINS
    <div className="w-[300px] border-r flex flex-col p-4 space-y-4 bg-background transition-colors duration-500 ease-in-out">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold transition-colors duration-500 ease-in-out">Suflet de Peniță</h2>
        <div className="flex gap-1">
          <ThemeToggle />
          {/* Buton Collapse - ADAUGĂ TRANZIȚIE */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsCollapsed(true)} 
            aria-label="Collapse sidebar"
            className="transition-colors duration-500 ease-in-out"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-2 top-3 h-4 w-4 text-muted-foreground transition-colors duration-500 ease-in-out" />
        <Input
          placeholder="Caută carte sau capitol..."
          className="pl-8 transition-colors duration-500 ease-in-out"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Buton Carte/Capitol nou - ADAUGĂ TRANZIȚIE */}
      <Button onClick={onCreateAction} className="w-full gap-2 transition-colors duration-500 ease-in-out">
        <Plus className="w-4 h-4" /> {selectedBook ? "Capitol nou" : "Carte nouă"}
      </Button>

      <Separator />

      <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto" ref={chaptersListRef}>
        {filteredBooks.map((book) => (
          <div
            key={book.id}
            className="space-y-1"
            draggable={selectedBook !== book.id}
            onDragStart={(e) => {
              if (selectedBook !== book.id) {
                setDraggedBookId(book.id)
                e.dataTransfer.effectAllowed = "move"
              }
            }}
            onDragOver={(e) => {
              e.preventDefault()
              setDragOverBookId(book.id)
            }}
            onDragEnter={(e) => e.preventDefault()}
            onDragLeave={() => setDragOverBookId(null)}
            onDrop={() => handleDropBook(book.id)}
            onDragEnd={() => {
              setDraggedBookId(null)
              setDragOverBookId(null)
            }}
          >
            <div
              className={`flex items-center gap-1 ${dragOverBookId === book.id && draggedBookId !== book.id ? "border-2 border-dashed border-primary rounded-md bg-primary/5 transition-colors duration-500 ease-in-out" : ""}`}
            >
              {/* ICONIȚA PIN (Fixează cartea) - ADAUGĂ TRANZIȚIE */}
              <Button
                size="icon"
                variant="ghost"
                className={`h-8 w-8 transition-all duration-500 ease-in-out ${book.isPinned ? "text-primary hover:bg-primary/10" : "text-muted-foreground hover:bg-muted"}`}
                onClick={() => onToggleBookPin(book.id)}
                title={book.isPinned ? "Desprinde cartea" : "Fixează cartea"}
              >
                <Pin className={`w-4 h-4 ${book.isPinned ? "rotate-45" : "rotate-0"} transition-transform duration-500 ease-in-out`} />
              </Button>
              <button
                onClick={() => {
                  if (selectedBook === book.id && !selectedChapter) {
                    onSelectBookOnly(null)
                  } else {
                    onSelectBookOnly(book.id)
                  }
                }}
                className={`flex-1 text-left px-3 py-2 rounded-md text-sm font-medium transition-colors duration-500 ease-in-out ${
                  selectedBook === book.id && !selectedChapter
                    ? "bg-primary text-primary-foreground"
                    : selectedBook === book.id
                      ? "bg-primary/80 text-primary-foreground"
                      : "hover:bg-muted"
                }`}
              >
                {book.title}
              </button>
              {/* Buton Editare Carte - ADAUGĂ TRANZIȚIE */}
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 transition-colors duration-500 ease-in-out"
                onClick={() => {
                  setEditingBook(book.id)
                  setNewTitle(book.title)
                }}
              >
                <Edit2 className="w-3 h-3" />
              </Button>
              {/* Buton Ștergere Carte - ADAUGĂ TRANZIȚIE */}
              <Button
                size="icon"
                variant="ghost"
                className={`h-8 w-8 transition-colors duration-500 ease-in-out ${book.isPinned ? "text-gray-400 cursor-not-allowed" : "text-destructive hover:text-destructive/80"}`}
                onClick={() => onTriggerDeleteBook(book.id)}
                disabled={book.isPinned}
                title={book.isPinned ? "Desprinde-o pentru a șterge" : "Șterge cartea"}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>

            {selectedBook === book.id && (
              <div className="ml-4 space-y-1">
                {book.chapters.map((chapter) => (
                  <div
                    key={chapter.id}
                    className="flex items-center gap-1 group/chapter"
                    draggable
                    onDragStart={(e) => {
                      setDraggedChapterId(chapter.id)
                      e.dataTransfer.effectAllowed = "move"
                    }}
                    onDragOver={(e) => {
                      e.preventDefault()
                      setDragOverChapterId(chapter.id)
                    }}
                    onDragEnter={(e) => e.preventDefault()}
                    onDragLeave={() => setDragOverChapterId(null)}
                    onDrop={() => onDropChapter(book.id, chapter.id)}
                  >
                    <button
                      onClick={() => onLoadChapter(book.id, chapter.id)}
                      className={`flex-1 text-left px-3 py-2 rounded-md text-sm transition-colors duration-500 ease-in-out ${
                        selectedChapter === chapter.id
                          ? "bg-secondary text-secondary-foreground font-semibold"
                          : "hover:bg-muted font-normal"
                      } ${dragOverChapterId === chapter.id ? "border border-dashed border-primary" : ""}`}
                    >
                      {chapter.title}
                    </button>
                    {/* BUTON EDITARE CAPITOL - ADAUGĂ ease-in-out */}
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 opacity-0 group-hover/chapter:opacity-100 transition-opacity duration-300 ease-in-out"
                      onClick={() => {
                        // CORECȚIE FINALĂ: Folosim setEditingChapter
                        setEditingChapter(chapter.id) 
                        setNewTitle(chapter.title)
                      }}
                    >
                      <Edit2 className="w-3 h-3" />
                    </Button>
                    {/* BUTON ȘTERGERE CAPITOL - ADAUGĂ ease-in-out */}
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive hover:text-destructive/80 opacity-0 group-hover/chapter:opacity-100 transition-opacity duration-300 ease-in-out"
                      onClick={() => onTriggerDeleteChapter(book.id, chapter.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <Separator />
      {/* BUTON DELOGARE - ADAUGĂ TRANZIȚIA SOFT */}
      <Button 
        onClick={onLogout} 
        variant="link" 
        // TRANZIȚIE ASIGURATĂ AICI
        className="text-sm text-destructive hover:text-destructive/80 transition-colors duration-500 ease-in-out"
      >
        <LogOut className="w-4 h-4 mr-2" />
        Delogare
      </Button>
    </div>
  )
}