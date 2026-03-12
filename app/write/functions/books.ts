import type React from "react"
// Asigură-te că calea către tipuri este corectă pentru proiectul tău
import type { Book, Character } from "../types/book" 

export function createNewBook(
  books: Book[],
  setBooks: React.Dispatch<React.SetStateAction<Book[]>>,
  setSelectedBook: React.Dispatch<React.SetStateAction<string | null>>,
  setContent: React.Dispatch<React.SetStateAction<string>>,
  setCurrentScratchpadContent: React.Dispatch<React.SetStateAction<string>>,
  setCurrentCharacters: React.Dispatch<React.SetStateAction<Character[]>>,
  setCurrentLocationsContent: React.Dispatch<React.SetStateAction<string>>,
  setCurrentTimelineContent: React.Dispatch<React.SetStateAction<string>>,
  setCurrentKeyItemsLore: React.Dispatch<React.SetStateAction<string>>,
  setCurrentBookStructureContent: React.Dispatch<React.SetStateAction<any>>,
  // 🟢 Argument nou pentru Dicționar
  setCurrentDictionary: React.Dispatch<React.SetStateAction<any[]>>, 
) {
  const newBook: Book = {
    id: Date.now().toString(),
    title: `Carte Nouă ${books.length + 1}`,
    chapters: [],
    isPinned: false,
    characters: [],
    locations: "",
    timeline: "",
    keyItemsLore: "",
    // 🟢 Inițializăm dicționarul gol
    dictionary: [], 
    // Inițializăm și structura, dacă nu era deja
    bookStructure: {
        generalStructure: "",
        styleAndTone: "",
        keyIdeas: "",
        narrativePerspective: "",
        customNotes: "",
    }
  } as Book 

  setBooks([...books, newBook])
  setSelectedBook(newBook.id)
  
  // Resetăm toate stările editorului
  setContent("")
  setCurrentScratchpadContent("")
  setCurrentCharacters([])
  setCurrentLocationsContent("")
  setCurrentTimelineContent("")
  setCurrentKeyItemsLore("")
  setCurrentBookStructureContent({
    generalStructure: "",
    styleAndTone: "",
    keyIdeas: "",
    narrativePerspective: "",
    customNotes: "",
  })
  // 🟢 Resetăm starea dicționarului
  setCurrentDictionary([]) 
}

export function toggleBookPin(bookId: string, setBooks: React.Dispatch<React.SetStateAction<Book[]>>) {
  setBooks((prevBooks) => prevBooks.map((book) => (book.id === bookId ? { ...book, isPinned: !book.isPinned } : book)))
}

export function triggerDeleteBook(
  bookId: string,
  books: Book[],
  setDeletingBook: React.Dispatch<React.SetStateAction<string | null>>,
) {
  const book = books.find((b) => b.id === bookId)
  if (book && !book.isPinned) {
    setDeletingBook(bookId)
  }
}

export function handleConfirmDeleteBook(
  deletingBook: string | null,
  books: Book[],
  setBooks: React.Dispatch<React.SetStateAction<Book[]>>,
  selectedBook: string | null,
  setSelectedBook: React.Dispatch<React.SetStateAction<string | null>>,
  setSelectedChapter: React.Dispatch<React.SetStateAction<string | null>>,
  setContent: React.Dispatch<React.SetStateAction<string>>,
  setCurrentScratchpadContent: React.Dispatch<React.SetStateAction<string>>,
  setCurrentCharacters: React.Dispatch<React.SetStateAction<Character[]>>,
  setCurrentLocationsContent: React.Dispatch<React.SetStateAction<string>>,
  setCurrentTimelineContent: React.Dispatch<React.SetStateAction<string>>,
  setCurrentKeyItemsLore: React.Dispatch<React.SetStateAction<string>>,
  setCurrentBookStructureContent: React.Dispatch<React.SetStateAction<any>>,
  setIsToolsPanelOpen: React.Dispatch<React.SetStateAction<boolean>>,
  setDeletingBook: React.Dispatch<React.SetStateAction<string | null>>,
  // 🟢 Argument nou (opțional pentru a nu sparge alte apeluri dacă există, dar folosit în page.tsx)
  setCurrentDictionary?: React.Dispatch<React.SetStateAction<any[]>>, 
) {
  if (!deletingBook) return

  const book = books.find((b) => b.id === deletingBook)
  if (book && book.isPinned) {
    setDeletingBook(null)
    return
  }

  setBooks(books.filter((b) => b.id !== deletingBook))

  // Dacă ștergem cartea care este momentan selectată, curățăm editorul
  if (selectedBook === deletingBook) {
    setSelectedBook(null)
    setSelectedChapter(null)
    setContent("")
    setCurrentScratchpadContent("")
    setCurrentCharacters([])
    setCurrentLocationsContent("")
    setCurrentTimelineContent("")
    setCurrentKeyItemsLore("")
    setCurrentBookStructureContent({
        generalStructure: "", styleAndTone: "", keyIdeas: "", narrativePerspective: "", customNotes: ""
    })
    
    // 🟢 Resetăm dicționarul
    if (setCurrentDictionary) setCurrentDictionary([]) 
      
    setIsToolsPanelOpen(false)
  }

  setDeletingBook(null)
}

export function renameBook(
  bookId: string | null,
  newTitle: string,
  setBooks: React.Dispatch<React.SetStateAction<Book[]>>,
  setEditingBook: React.Dispatch<React.SetStateAction<string | null>>,
) {
  if (!bookId || !newTitle.trim()) return

  setBooks((prevBooks) => prevBooks.map((book) => (book.id === bookId ? { ...book, title: newTitle } : book)))

  setEditingBook(null)
}

export function handleDropBook(
  targetBookId: string,
  draggedBookId: string | null,
  setBooks: React.Dispatch<React.SetStateAction<Book[]>>,
) {
  if (!draggedBookId || draggedBookId === targetBookId) return

  setBooks((prevBooks) => {
    const draggedIndex = prevBooks.findIndex((b) => b.id === draggedBookId)
    const targetIndex = prevBooks.findIndex((b) => b.id === targetBookId)

    if (draggedIndex === -1 || targetIndex === -1) return prevBooks

    const newBooks = [...prevBooks]
    const [draggedBook] = newBooks.splice(draggedIndex, 1)
    newBooks.splice(targetIndex, 0, draggedBook)

    return newBooks
  })
}

/**
 * Funcția legacy de exportText din acest fișier.
 * Nota: page.tsx folosește acum propria funcție `exportContent` care este mai avansată (include range).
 * Păstrăm această funcție pentru compatibilitate sau utilizări secundare.
 */
export function exportText(
  type: "chapter" | "book",
  bookId: string,
  chapterId: string | null,
  books: Book[],
) {
  const book = books.find((b) => b.id === bookId)
  if (!book) return

  let contentToExport = ""
  let fileName = ""

  if (type === "chapter" && chapterId) {
    const chapter = book.chapters.find((c) => c.id === chapterId)
    if (!chapter) return

    contentToExport = `${book.title.toUpperCase()}\n\n${"=".repeat(book.title.length + 10)}\n\nCAPITOL: ${chapter.title}\n\n${"-".repeat(
      `CAPITOL: ${chapter.title}`.length,
    )}\n\n${chapter.content}`
    fileName = `${book.title.replace(/\s/g, "_")}-${chapter.title.replace(/\s/g, "_")}-Capitol.txt`
  } else if (type === "book") {
    contentToExport += `TITLUL CĂRȚII: ${book.title.toUpperCase()}\n\n${"=".repeat(
      `TITLUL CĂRȚII: ${book.title.toUpperCase()}`.length,
    )}\n\n`
    
    book.chapters.forEach((chapter, index) => {
      contentToExport += `\n\n${"~".repeat(50)}\n\nCAPITOLUL ${index + 1}: ${chapter.title.toUpperCase()}\n\n${"-".repeat(
        `CAPITOLUL ${index + 1}: ${chapter.title.toUpperCase()}`.length,
      )}\n\n${chapter.content}`
    })

    fileName = `${book.title.replace(/\s/g, "_")}-CarteCompleta.txt`
  } else {
      return 
  }

  const blob = new Blob([contentToExport], { type: "text/plain;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}