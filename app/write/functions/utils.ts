/**
 * UTILITAR: Funcții auxiliare generale
 * - countWords: Numără cuvintele dintr-un text
 * - toTitleCase: Convertește textul la Title Case (ex: "Hello World")
 * - capitalizeText: Capitalizează automat textul la începutul propoziției
 */

/**
 * Numără cuvintele dintr-un text
 * @param text - Textul de analizat
 * @returns Numărul de cuvinte
 */
export const countWords = (text: string): number => {
  if (!text) return 0
  const words = text.match(/\b\w+\b/g)
  return words ? words.length : 0
}

/**
 * Convertește textul la Title Case
 * Exemplu: "hello world" -> "Hello World"
 * @param str - Textul de convertit
 * @returns Textul în Title Case
 */
export const toTitleCase = (str: string): string => {
  if (!str) return str
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => {
      if (!word) return ""
      return word.charAt(0).toUpperCase() + word.slice(1)
    })
    .join(" ")
}

/**
 * Capitalizează automat textul conform regulilor de punctuație
 * - Majusculă la început de text
 * - Majusculă după punctuație (., ?, !, :)
 * - Majusculă după line break
 * Suportă caractere românești (ă, â, î, ș, ț)
 * @param text - Textul de capitalizat
 * @returns Textul capitalizat automat
 */
export const capitalizeText = (text: string): string => {
  if (!text.length) {
    return text
  }

  let capitalized = text

  // Capitalizează prima literă
  const firstLetterMatch = capitalized.match(/^(\s*)([a-zăâîșț])/)
  if (firstLetterMatch) {
    capitalized = capitalized.replace(firstLetterMatch[0], firstLetterMatch[1] + firstLetterMatch[2].toUpperCase())
  }

  // Capitalizează după punctuație
  capitalized = capitalized.replace(/([.?!:])(\s+)([a-zăâîșț])/g, (match, punc, space, letter) => {
    return punc + space + letter.toUpperCase()
  })

  // Capitalizează după line break
  capitalized = capitalized.replace(/(\n)(\s*)([a-zăâîșț])/g, (match, newline, space, letter) => {
    return newline + space + letter.toUpperCase()
  })

  return capitalized
}
