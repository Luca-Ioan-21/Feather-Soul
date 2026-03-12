/**
 * FUNCȚII PENTRU CĂUTARE ȘI FILTRARE
 * - Filtrează cărți și capitole după query
 */

import type { Book } from "@/types/book"

/**
 * Filtrează cărțile și capitolele pe baza unei interogări de căutare
 * Efectuează căutare pe titluri de cărți și capitole
 * @param books - Lista de cărți
 * @param searchQuery - Textul de căutat
 * @returns Lista filtrată de cărți
 */
export const getFilteredBooks = (books: Book[], searchQuery: string): Book[] => {
  return books
    .map((book) => {
      const query = searchQuery.toLowerCase()

      const matchingChapters = book.chapters.filter((chapter) => chapter.title.toLowerCase().includes(query))

      const matchesBookTitle = book.title.toLowerCase().includes(query)

      const shouldIncludeBook = matchesBookTitle || matchingChapters.length > 0

      if (shouldIncludeBook) {
        const chaptersToDisplay = matchesBookTitle ? book.chapters : matchingChapters

        return {
          ...book,
          chapters: chaptersToDisplay,
        }
      }

      return null
    })
    .filter((book): book is Book => book !== null)
}
