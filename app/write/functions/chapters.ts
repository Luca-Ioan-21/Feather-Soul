import type React from "react"
/**
 * FUNCȚII PENTRU GESTIONAREA CAPITOLELOR
 * Incluye: creare, ștergere, redenumire, drag & drop
 */

import type { Book, Chapter } from "@/types/book"

/**
 * Creează un capitol nou în cartea selectată
 * @param selectedBook - ID-ul cărții selectate
 * @param books - Lista de cărți
 * @param setBooks - Setter pentru actualizarea listei
 * @param setSelectedChapter - Setter pentru capitolul selectat
 * @param setContent - Setter pentru conținut
 * @param chaptersListRef - Referință la lista de capitole pentru scroll
 */
export const createNewChapter = (
  selectedBook: string | null,
  books: Book[],
  setBooks: React.Dispatch<React.SetStateAction<Book[]>>,
  setSelectedChapter: React.Dispatch<React.SetStateAction<string | null>>,
  setContent: React.Dispatch<React.SetStateAction<string>>,
  setCurrentScratchpadContent: React.Dispatch<React.SetStateAction<string>>,
  chaptersListRef: React.RefObject<HTMLDivElement>,
) => {
  if (!selectedBook) return

  const newChapter: Chapter = {
    id: Date.now().toString(),
    title: "Capitol nou",
    content: "",
    scratchpadContent: "",
  }

  setBooks(
    books.map((book) => (book.id === selectedBook ? { ...book, chapters: [...book.chapters, newChapter] } : book)),
  )

  setSelectedChapter(newChapter.id)
  setContent("")
  setCurrentScratchpadContent("")

  // Auto-scroll la ultimul capitol
  setTimeout(() => {
    chaptersListRef.current?.scrollTo({
      top: chaptersListRef.current.scrollHeight,
      behavior: "smooth",
    })
  }, 50)
}

/**
 * Încarcă un capitol pentru editare
 * Toggle: dacă e deja selectat, deselectează-l
 * @param bookId - ID-ul cărții
 * @param chapterId - ID-ul capitolului
 */
export const loadChapter = (
  bookId: string,
  chapterId: string,
  selectedBook: string | null,
  selectedChapter: string | null,
  books: Book[],
  setSelectedBook: React.Dispatch<React.SetStateAction<string | null>>,
  setSelectedChapter: React.Dispatch<React.SetStateAction<string | null>>,
  setContent: React.Dispatch<React.SetStateAction<string>>,
  setCurrentScratchpadContent: React.Dispatch<React.SetStateAction<string>>,
  setCurrentCharacters: React.Dispatch<React.SetStateAction<any[]>>,
  setCurrentLocationsContent: React.Dispatch<React.SetStateAction<string>>,
  setCurrentTimelineContent: React.Dispatch<React.SetStateAction<string>>,
  setCurrentKeyItemsLore: React.Dispatch<React.SetStateAction<string>>,
  setIsToolsPanelOpen: React.Dispatch<React.SetStateAction<boolean>>,
  setAutoSaveStatus: React.Dispatch<React.SetStateAction<string>>,
  setCursorPosition: React.Dispatch<React.SetStateAction<{ start: number | null; end: number | null }>>,
  setLastUpdatedField: React.Dispatch<
    React.SetStateAction<"content" | "scratchpad" | "locations" | "timeline" | "keyItemsLore" | null>
  >,
) => {
  // Toggle logic: dacă e deja selectat, deselectează-l
  if (selectedBook === bookId && selectedChapter === chapterId) {
    setSelectedBook(null)
    setSelectedChapter(null)
    setContent("")
    setCurrentScratchpadContent("")
    setCurrentCharacters([])
    setCurrentLocationsContent("")
    setCurrentTimelineContent("")
    setCurrentKeyItemsLore("")
    setIsToolsPanelOpen(false)
    setAutoSaveStatus("Salvat")
    return
  }

  setAutoSaveStatus("Salvat")
  setSelectedBook(bookId)
  setSelectedChapter(chapterId)

  const book = books.find((b) => b.id === bookId)
  const chapter = book?.chapters.find((c) => c.id === chapterId)

  setContent(chapter?.content || "")
  setCurrentScratchpadContent(chapter?.scratchpadContent || "")
  setCurrentCharacters(book?.characters || [])
  setCurrentLocationsContent(book?.locations || "")
  setCurrentTimelineContent(book?.timeline || "")
  setCurrentKeyItemsLore(book?.keyItemsLore || "")

  // Setează cursor la sfârșitul textului
  setCursorPosition({ start: chapter?.content.length || 0, end: chapter?.content.length || 0 })
  setLastUpdatedField("content")
}

/**
 * Selectează o carte pentru a vedea referințele fără a selecta un capitol
 * @param bookId - ID-ul cărții
 */
export const selectBookOnly = (
  bookId: string | null,
  selectedBook: string | null,
  books: Book[],
  setSelectedBook: React.Dispatch<React.SetStateAction<string | null>>,
  setSelectedChapter: React.Dispatch<React.SetStateAction<string | null>>,
  setContent: React.Dispatch<React.SetStateAction<string>>,
  setCurrentScratchpadContent: React.Dispatch<React.SetStateAction<string>>,
  setCurrentCharacters: React.Dispatch<React.SetStateAction<any[]>>,
  setCurrentLocationsContent: React.Dispatch<React.SetStateAction<string>>,
  setCurrentTimelineContent: React.Dispatch<React.SetStateAction<string>>,
  setCurrentKeyItemsLore: React.Dispatch<React.SetStateAction<string>>,
  setIsToolsPanelOpen: React.Dispatch<React.SetStateAction<boolean>>,
  setAutoSaveStatus: React.Dispatch<React.SetStateAction<string>>,
) => {
  const isCurrentlySelected = selectedBook === bookId
  const newSelectedBook = isCurrentlySelected ? null : bookId

  setSelectedBook(newSelectedBook)
  setSelectedChapter(null)
  setContent("")
  setCurrentScratchpadContent("")
  setIsToolsPanelOpen(false)
  setAutoSaveStatus("Salvat")

  if (newSelectedBook) {
    const book = books.find((b) => b.id === newSelectedBook)
    setCurrentCharacters(book?.characters || [])
    setCurrentLocationsContent(book?.locations || "")
    setCurrentTimelineContent(book?.timeline || "")
    setCurrentKeyItemsLore(book?.keyItemsLore || "")
  } else {
    setCurrentCharacters([])
    setCurrentLocationsContent("")
    setCurrentTimelineContent("")
    setCurrentKeyItemsLore("")
  }
}

/**
 * Inițiază ștergerea unui capitol
 * @param bookId - ID-ul cărții
 * @param chapterId - ID-ul capitolului
 */
export const triggerDeleteChapter = (
  bookId: string,
  chapterId: string,
  setDeletingChapter: React.Dispatch<React.SetStateAction<{ bookId: string; chapterId: string } | null>>,
) => {
  setDeletingChapter({ bookId, chapterId })
}

/**
 * Confirmă și execută ștergerea capitolului
 * @param deletingChapter - Obiectul cu bookId și chapterId
 * @param books - Lista de cărți
 * @param setBooks - Setter pentru actualizarea listei
 * @param selectedChapter - Capitolul selectat curent
 */
export const handleConfirmDeleteChapter = (
  deletingChapter: { bookId: string; chapterId: string } | null,
  books: Book[],
  setBooks: React.Dispatch<React.SetStateAction<Book[]>>,
  selectedChapter: string | null,
  setSelectedChapter: React.Dispatch<React.SetStateAction<string | null>>,
  setContent: React.Dispatch<React.SetStateAction<string>>,
  setCurrentScratchpadContent: React.Dispatch<React.SetStateAction<string>>,
  setIsToolsPanelOpen: React.Dispatch<React.SetStateAction<boolean>>,
  setDeletingChapter: React.Dispatch<React.SetStateAction<{ bookId: string; chapterId: string } | null>>,
) => {
  if (!deletingChapter) return
  const { bookId, chapterId } = deletingChapter

  setBooks(
    books.map((book) =>
      book.id === bookId ? { ...book, chapters: book.chapters.filter((c) => c.id !== chapterId) } : book,
    ),
  )

  if (selectedChapter === chapterId) {
    setSelectedChapter(null)
    setContent("")
    setCurrentScratchpadContent("")
    setIsToolsPanelOpen(false)
  }

  setDeletingChapter(null)
}

/**
 * Redenumește un capitol
 * @param bookId - ID-ul cărții
 * @param chapterId - ID-ul capitolului
 * @param newTitle - Noul titlu
 */
export const renameChapter = (
  bookId: string,
  chapterId: string,
  newTitle: string,
  setBooks: React.Dispatch<React.SetStateAction<Book[]>>,
  setEditingChapter: React.Dispatch<React.SetStateAction<string | null>>,
) => {
  if (!newTitle.trim()) return

  setBooks((books) =>
    books.map((book) =>
      book.id === bookId
        ? {
            ...book,
            chapters: book.chapters.map((chapter) =>
              chapter.id === chapterId ? { ...chapter, title: newTitle } : chapter,
            ),
          }
        : book,
    ),
  )

  setEditingChapter(null)
}

/**
 * Gestionează drag & drop pentru reordonarea capitolelor
 * @param bookId - ID-ul cărții
 * @param targetChapterId - ID-ul capitolului țintă
 * @param draggedChapterId - ID-ul capitolului tras
 */
export const handleDropChapter = (
  bookId: string,
  targetChapterId: string,
  draggedChapterId: string | null,
  setBooks: React.Dispatch<React.SetStateAction<Book[]>>,
  setDraggedChapterId: React.Dispatch<React.SetStateAction<string | null>>,
  setDragOverChapterId: React.Dispatch<React.SetStateAction<string | null>>,
) => {
  if (!draggedChapterId || draggedChapterId === targetChapterId) {
    setDraggedChapterId(null)
    setDragOverChapterId(null)
    return
  }

  setBooks((prevBooks) =>
    prevBooks.map((book) => {
      if (book.id !== bookId) return book

      const chapters = [...book.chapters]
      const draggedIndex = chapters.findIndex((c) => c.id === draggedChapterId)
      const targetIndex = chapters.findIndex((c) => c.id === targetChapterId)

      if (draggedIndex === -1 || targetIndex === -1) return book

      const [removed] = chapters.splice(draggedIndex, 1)
      chapters.splice(targetIndex, 0, removed)

      return { ...book, chapters }
    }),
  )

  setDraggedChapterId(null)
  setDragOverChapterId(null)
}
