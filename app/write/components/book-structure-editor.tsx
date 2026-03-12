// components/book-structure-editor.tsx

"use client"

import type React from "react"
import { useState, useEffect, useMemo, useCallback } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  LayoutGrid,
  Plus,
  X,
  ChevronDown,
  ChevronUp,
  Trash2,
  Search,
  Pencil,
  Triangle,
  Square,
  Pentagon,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

// --- DEFINIȚII PENTRU MĂRIMEA FONTULUI (Menținute) ---
type FontSize = "sm" | "base" | "lg"
const LS_PREFIX = "book_structure_editor_"
const fontSizeClasses: Record<FontSize, string> = {
  sm: "!text-sm",
  base: "!text-base", // Dimensiune implicită
  lg: "!text-lg",
}

const fontSizeIcons: Record<FontSize, React.ElementType> = {
  sm: Triangle,
  base: Square,
  lg: Pentagon,
}
const iconSizes: Record<FontSize, string> = {
  sm: "h-3 w-3",
  base: "h-4 w-4",
  lg: "h-5 w-5",
}
// --- NOU: DEFINIȚII PENTRU TITLURILE SCALABILE ---
const titleSizeClasses: Record<FontSize, string> = {
  sm: "text-lg",
  base: "text-xl",
  lg: "text-2xl",
}
const sectionTitleSizeClasses: Record<FontSize, string> = {
  sm: "text-base",
  base: "text-lg",
  lg: "text-xl",
}
// --- SFÂRȘIT DEFINIȚII FONT ---

/**
 * Capitalizează automat:
 * - Prima literă a întregului text
 * - Prima literă după punctuație (.?!:)
 * - Prima literă după linie nouă (\n)
 */
const capitalizeText = (text: string): string => {
  if (!text) return text

  return text
    .split(/(\n)/)
    .map((segment, segmentIndex) => {
      if (segment === "\n") return segment

      return segment.replace(/([.?!:]\s+|^)(\p{L})/gu, (match, punctuation, letter) => {
        return punctuation + letter.toUpperCase()
      })
    })
    .join("")
}
// </CHANGE>

// Interfețele și constanțele rămân neschimbate
export interface SubGenreItem {
  name: string
  description: string
}
export interface StructureItem {
  id: string
  actOrChapter: string
  objective: string
  eventSummary: string
  toneAndPerspective: string
}
export interface BookStructureContent {
  mainGenre: string
  mainGenreDescription: string
  subGenres: SubGenreItem[]
  generalStructureNotes: string
  detailedStructure: StructureItem[]
  styleAndTone: string
  keyThemesText: string
  narrativePerspective: string
  customNotes: string
}
interface BookStructureEditorProps {
  content: BookStructureContent
  onChange?: (content: BookStructureContent) => void
}

// ... Restul constantelor și logicii (neschimbate)
const SUBGENRE_TOGGLE_KEY = LS_PREFIX + "subgenres_open"
const SECTION_TOGGLES_KEY = LS_PREFIX + "section_toggles"

type SectionKey = "mainGenre" | "generalStructure" | "detailedStructure" | "style" | "ideas" | "perspective" | "notes"
type ToggleStates = Record<SectionKey, boolean>

const DEFAULT_TOGGLE_STATES: ToggleStates = {
  mainGenre: true,
  generalStructure: true,
  detailedStructure: true,
  style: true,
  ideas: true,
  perspective: true,
  notes: true,
}

const getToggleStates = (): ToggleStates => {
  if (typeof window === "undefined") return DEFAULT_TOGGLE_STATES
  try {
    const stored = localStorage.getItem(SECTION_TOGGLES_KEY)
    return stored ? { ...DEFAULT_TOGGLE_STATES, ...JSON.parse(stored) } : DEFAULT_TOGGLE_STATES
  } catch {
    return DEFAULT_TOGGLE_STATES
  }
}
const setToggleStates = (states: ToggleStates) => {
  if (typeof window !== "undefined") {
    localStorage.setItem(SECTION_TOGGLES_KEY, JSON.stringify(states))
  }
}
const generateId = () => Math.random().toString(36).substring(2, 9)

/**
 * Componentă pentru editarea structurii generale a cărții, stilului și notelor de planificare.
 */
export function BookStructureEditor({ content, onChange }: BookStructureEditorProps) {
  // Inițializare defensivă a conținutului (neschimbată)
  const safeContent: BookStructureContent =
    content && typeof content === "object"
      ? {
          mainGenre: content.mainGenre || "",
          mainGenreDescription: content.mainGenreDescription || "",
          subGenres: Array.isArray(content.subGenres) ? content.subGenres : [],
          generalStructureNotes: (content as any).generalStructureNotes || (content as any).generalStructure || "",
          detailedStructure: Array.isArray((content as any).detailedStructure)
            ? (content as any).detailedStructure
            : [],
          styleAndTone: content.styleAndTone || "",
          keyThemesText: (content as any).keyThemesText || (content as any).keyIdeas || "",
          narrativePerspective: content.narrativePerspective || "",
          customNotes: content.customNotes || "",
        }
      : ({
          mainGenre: "",
          mainGenreDescription: "",
          subGenres: [],
          generalStructureNotes: "",
          detailedStructure: [],
          styleAndTone: "",
          keyThemesText: "",
          narrativePerspective: "",
          customNotes: "",
        } as BookStructureContent)

  const [localSubGenres, setLocalSubGenres] = useState<SubGenreItem[]>(safeContent.subGenres)
  const [localDetailedStructure, setLocalDetailedStructure] = useState<StructureItem[]>(safeContent.detailedStructure)

  const [isKeyIdeasEditing, setIsKeyIdeasEditing] = useState(false)
  const [isStyleAndToneEditing, setIsStyleAndToneEditing] = useState(false)
  const [isNarrativePerspectiveEditing, setIsNarrativePerspectiveEditing] = useState(false)
  const [isCustomNotesEditing, setIsCustomNotesEditing] = useState(false)

  const [searchTerm, setSearchTerm] = useState("")

  const [showSubGenres, setShowSubGenres] = useState(() => {
    if (typeof window !== "undefined") {
      const storedState = localStorage.getItem(SUBGENRE_TOGGLE_KEY)
      if (storedState !== null) {
        return storedState === "true"
      }
    }
    return Array.isArray(safeContent.subGenres) && safeContent.subGenres.length > 0
  })

  const [isDeleteConfirmDialogOpen, setIsDeleteConfirmDialogOpen] = useState(false)
  const [subGenreToDeleteIndex, setSubGenreToDeleteIndex] = useState<number | null>(null)

  const [isStructureDeleteConfirmDialogOpen, setIsStructureDeleteConfirmDialogOpen] = useState(false)
  const [structureItemToDeleteIndex, setStructureItemToDeleteIndex] = useState<number | null>(null)

  const [isStructureItemDialogOpen, setIsStructureItemDialogOpen] = useState(false)
  const [editingStructureItem, setEditingStructureItem] = useState<StructureItem | null>(null)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)

  // Folosit pentru a forța focusul pe noul subgen adăugat
  const [focusIndex, setFocusIndex] = useState<number | null>(null)

  const [sectionToggles, setSectionToggles] = useState<ToggleStates>(getToggleStates)

  // --- STATE PENTRU MĂRIMEA FONTULUI (Menținut) ---
  const [fontSize, setFontSize] = useState<FontSize>(() => {
    if (typeof window !== "undefined") {
      const storedSize = localStorage.getItem(LS_PREFIX + "font_size") as FontSize | null
      return storedSize || "base"
    }
    return "base"
  })

  const handleFontSizeChange = useCallback((newSize: FontSize) => {
    setFontSize(newSize)
    if (typeof window !== "undefined") {
      localStorage.setItem(LS_PREFIX + "font_size", newSize)
    }
  }, [])
  // --- SFÂRȘIT LOGICĂ FONT ---

  // LOGICĂ NOUĂ: Focus pe noul subgen adăugat
  useEffect(() => {
    if (focusIndex !== null) {
      const elementId = `subgenre-name-input-${focusIndex}`
      const element = document.getElementById(elementId)
      if (element) {
        element.focus()
      }
      setFocusIndex(null)
    }
  }, [focusIndex, localSubGenres.length])

  // Functiile de logica
  const isSectionVisible = (key: SectionKey) => sectionToggles[key]

  const updateField = useCallback(
    (field: keyof BookStructureContent, value: string | SubGenreItem[] | StructureItem[]) => {
      if (typeof onChange === "function") {
        const newContent = {
          ...safeContent,
          [field]: value,
          subGenres: localSubGenres,
          detailedStructure: localDetailedStructure,
        } as BookStructureContent

        if (field === "subGenres") {
          newContent.subGenres = value as SubGenreItem[]
        }
        if (field === "detailedStructure") {
          newContent.detailedStructure = value as StructureItem[]
        }

        if (field === "generalStructureNotes") {
          delete (newContent as any).generalStructure
        }

        onChange(newContent)
      }
    },
    [safeContent, localSubGenres, localDetailedStructure, onChange],
  )

  // Toate hook-urile useEffect pentru capitalizare au fost mutate aici, după definirea updateField.

  // Capitalizare pentru mainGenre
  useEffect(() => {
    const timer = setTimeout(() => {
      const capitalized = capitalizeText(safeContent.mainGenre)
      if (capitalized !== safeContent.mainGenre) {
        updateField("mainGenre", capitalized)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [safeContent.mainGenre, updateField])

  // Capitalizare pentru mainGenreDescription
  useEffect(() => {
    const timer = setTimeout(() => {
      const capitalized = capitalizeText(safeContent.mainGenreDescription)
      if (capitalized !== safeContent.mainGenreDescription) {
        updateField("mainGenreDescription", capitalized)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [safeContent.mainGenreDescription, updateField])

  // Capitalizare pentru generalStructureNotes
  useEffect(() => {
    const timer = setTimeout(() => {
      const capitalized = capitalizeText(safeContent.generalStructureNotes)
      if (capitalized !== safeContent.generalStructureNotes) {
        updateField("generalStructureNotes", capitalized)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [safeContent.generalStructureNotes, updateField])

  // Capitalizare pentru styleAndTone
  useEffect(() => {
    const timer = setTimeout(() => {
      const capitalized = capitalizeText(safeContent.styleAndTone)
      if (capitalized !== safeContent.styleAndTone) {
        updateField("styleAndTone", capitalized)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [safeContent.styleAndTone, updateField])

  useEffect(() => {
    const timer = setTimeout(() => {
      const capitalized = capitalizeText(safeContent.keyThemesText)
      if (capitalized !== safeContent.keyThemesText) {
        updateField("keyThemesText", capitalized)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [safeContent.keyThemesText, updateField])

  // Capitalizare pentru narrativePerspective
  useEffect(() => {
    const timer = setTimeout(() => {
      const capitalized = capitalizeText(safeContent.narrativePerspective)
      if (capitalized !== safeContent.narrativePerspective) {
        updateField("narrativePerspective", capitalized)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [safeContent.narrativePerspective, updateField])

  // Capitalizare pentru customNotes
  useEffect(() => {
    const timer = setTimeout(() => {
      const capitalized = capitalizeText(safeContent.customNotes)
      if (capitalized !== safeContent.customNotes) {
        updateField("customNotes", capitalized)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [safeContent.customNotes, updateField])

  // Capitalizare pentru subgenuri
  useEffect(() => {
    const timer = setTimeout(() => {
      let hasChanges = false
      const capitalizedSubGenres = localSubGenres.map((subGenre) => {
        const capitalizedName = capitalizeText(subGenre.name)
        const capitalizedDescription = capitalizeText(subGenre.description)

        if (capitalizedName !== subGenre.name || capitalizedDescription !== subGenre.description) {
          hasChanges = true
          return {
            name: capitalizedName,
            description: capitalizedDescription,
          }
        }
        return subGenre
      })

      if (hasChanges) {
        setLocalSubGenres(capitalizedSubGenres)
        updateField("subGenres", capitalizedSubGenres)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [localSubGenres, updateField])

  // Capitalizare pentru structura detaliată (în timpul editării)
  useEffect(() => {
    if (editingStructureItem) {
      const timer = setTimeout(() => {
        const capitalizedActOrChapter = capitalizeText(editingStructureItem.actOrChapter)
        const capitalizedObjective = capitalizeText(editingStructureItem.objective)
        const capitalizedEventSummary = capitalizeText(editingStructureItem.eventSummary)
        const capitalizedToneAndPerspective = capitalizeText(editingStructureItem.toneAndPerspective)

        if (
          capitalizedActOrChapter !== editingStructureItem.actOrChapter ||
          capitalizedObjective !== editingStructureItem.objective ||
          capitalizedEventSummary !== editingStructureItem.eventSummary ||
          capitalizedToneAndPerspective !== editingStructureItem.toneAndPerspective
        ) {
          setEditingStructureItem({
            ...editingStructureItem,
            actOrChapter: capitalizedActOrChapter,
            objective: capitalizedObjective,
            eventSummary: capitalizedEventSummary,
            toneAndPerspective: capitalizedToneAndPerspective,
          })
        }
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [editingStructureItem])

  /**
   * FIX: Implementează auto-scroll la deschiderea secțiunii.
   */
  const handleToggleSection = (key: SectionKey) => {
    setSectionToggles((prev) => {
      const isCurrentlyOpen = prev[key]
      const newState = { ...prev, [key]: !isCurrentlyOpen }
      setToggleStates(newState)

      if (!isCurrentlyOpen) {
        // Secțiunea se deschide: derulează automat la ea
        setTimeout(() => {
          const element = document.getElementById(`section-${key}`)
          if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "start" })
          }
        }, 100) // Așteaptă puțin pentru a permite randarea completă și efectul de tranziție
      }

      return newState
    })
  }

  const handleToggleSubGenres = () => {
    const newState = !showSubGenres
    setShowSubGenres(newState)
    if (typeof window !== "undefined") {
      localStorage.setItem(SUBGENRE_TOGGLE_KEY, newState.toString())
    }
  }

  const handleAddSubGenre = () => {
    const newSubGenres = [...localSubGenres, { name: "", description: "" }]
    const newIndex = newSubGenres.length - 1

    setLocalSubGenres(newSubGenres)
    updateField("subGenres", newSubGenres)
    setShowSubGenres(true)

    // Setează indexul pentru focus (gestionat de useEffect)
    setFocusIndex(newIndex)

    if (typeof window !== "undefined") {
      localStorage.setItem(SUBGENRE_TOGGLE_KEY, "true")
    }
  }

  const confirmDeleteSubGenre = (index: number) => {
    setSubGenreToDeleteIndex(index)
    setIsDeleteConfirmDialogOpen(true)
  }

  const handleDeleteConfirmed = () => {
    if (subGenreToDeleteIndex !== null) {
      const newSubGenres = localSubGenres.filter((_, i) => i !== subGenreToDeleteIndex)
      setLocalSubGenres(newSubGenres)
      updateField("subGenres", newSubGenres)

      setIsDeleteConfirmDialogOpen(false)
      setSubGenreToDeleteIndex(null)
    }
  }

  const handleRemoveSubGenre = (index: number) => {
    confirmDeleteSubGenre(index)
  }

  const handleSubGenreItemChange = (index: number, field: keyof SubGenreItem, value: string) => {
    const newSubGenres = localSubGenres.map((item, i) => {
      if (i === index) {
        return { ...item, [field]: value }
      }
      return item
    })
    setLocalSubGenres(newSubGenres)
    updateField("subGenres", newSubGenres)
  }

  const subGenreName = subGenreToDeleteIndex !== null ? localSubGenres[subGenreToDeleteIndex]?.name || "fără nume" : ""

  const handleOpenStructureItemDialog = (item: StructureItem | null, index: number | null) => {
    setEditingStructureItem(
      item
        ? { ...item }
        : { id: generateId(), actOrChapter: "", objective: "", eventSummary: "", toneAndPerspective: "" },
    )
    setEditingIndex(index)
    setIsStructureItemDialogOpen(true)
  }

  /**
   * FIX: Aplică scroll automat după salvare, mai ales dacă secțiunea e deschisă.
   */
  const handleSaveStructureItem = () => {
    if (!editingStructureItem) return

    const updatedStructure = [...localDetailedStructure]

    if (editingIndex !== null && editingIndex >= 0) {
      updatedStructure[editingIndex] = editingStructureItem
    } else {
      updatedStructure.push(editingStructureItem)
    }

    setLocalDetailedStructure(updatedStructure)
    updateField("detailedStructure", updatedStructure)

    setIsStructureItemDialogOpen(false)
    setEditingStructureItem(null)
    setEditingIndex(null)

    if (!isSectionVisible("detailedStructure")) {
      // Secțiunea era închisă, handleToggleSection o va deschide ȘI va derula
      handleToggleSection("detailedStructure")
    } else {
      // Secțiunea era deja deschisă, doar derulează
      setTimeout(() => {
        const element = document.getElementById(`section-detailedStructure`)
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" })
        }
      }, 100)
    }
  }

  const confirmDeleteStructureItem = (index: number) => {
    setStructureItemToDeleteIndex(index)
    setIsStructureDeleteConfirmDialogOpen(true)
  }

  const handleDeleteStructureConfirmed = () => {
    if (structureItemToDeleteIndex !== null) {
      const updatedStructure = localDetailedStructure.filter((_, i) => i !== structureItemToDeleteIndex)
      setLocalDetailedStructure(updatedStructure)
      updateField("detailedStructure", updatedStructure)

      setIsStructureDeleteConfirmDialogOpen(false)
      setStructureItemToDeleteIndex(null)
    }
  }

  const handleDeleteStructureItem = (index: number) => {
    confirmDeleteStructureItem(index)
  }

  const structureItemName =
    structureItemToDeleteIndex !== null
      ? localDetailedStructure[structureItemToDeleteIndex]?.actOrChapter || `Rând #${structureItemToDeleteIndex + 1}`
      : ""

  const filteredStructure = useMemo(() => {
    if (!searchTerm) {
      return localDetailedStructure
    }

    const lowerCaseSearchTerm = searchTerm.toLowerCase()

    return localDetailedStructure.filter((item, index) => {
      const originalIndex = localDetailedStructure.findIndex((i) => i.id === item.id)

      const matchesIndex = (originalIndex + 1).toString().includes(lowerCaseSearchTerm)
      const matchesName = item.actOrChapter.toLowerCase().includes(lowerCaseSearchTerm)
      const matchesObjective = item.objective.toLowerCase().includes(lowerCaseSearchTerm)
      const matchesSummary = item.eventSummary.toLowerCase().includes(lowerCaseSearchTerm)
      const matchesTone = item.toneAndPerspective.toLowerCase().includes(lowerCaseSearchTerm)

      return matchesIndex || matchesName || matchesObjective || matchesSummary || matchesTone
    })
  }, [localDetailedStructure, searchTerm])

  // Logica pentru liste (Rămâne neschimbată)
  const keyIdeasList = useMemo(
    () => (safeContent.keyThemesText ? safeContent.keyThemesText.split("\n").filter((idea) => idea.trim() !== "") : []),
    [safeContent.keyThemesText],
  )
  const halfPoint = Math.ceil(keyIdeasList.length / 2)
  const firstHalfIdeas = keyIdeasList.slice(0, halfPoint)
  const secondHalfIdeas = keyIdeasList.slice(halfPoint)

  const styleAndToneList = useMemo(
    () => (safeContent.styleAndTone ? safeContent.styleAndTone.split("\n").filter((item) => item.trim() !== "") : []),
    [safeContent.styleAndTone],
  )
  const styleHalfPoint = Math.ceil(styleAndToneList.length / 2)
  const firstHalfStyle = styleAndToneList.slice(0, styleHalfPoint)
  const secondHalfStyle = styleAndToneList.slice(styleHalfPoint)

  const narrativePerspectiveList = useMemo(
    () =>
      safeContent.narrativePerspective
        ? safeContent.narrativePerspective.split("\n").filter((item) => item.trim() !== "")
        : [],
    [safeContent.narrativePerspective],
  )
  const narrativeHalfPoint = Math.ceil(narrativePerspectiveList.length / 2)
  const firstHalfNarrative = narrativePerspectiveList.slice(0, narrativeHalfPoint)
  const secondHalfNarrative = narrativePerspectiveList.slice(narrativeHalfPoint)

  const customNotesList = useMemo(
    () => (safeContent.customNotes ? safeContent.customNotes.split("\n").filter((item) => item.trim() !== "") : []),
    [safeContent.customNotes],
  )
  const customNotesHalfPoint = Math.ceil(customNotesList.length / 2)
  const firstHalfCustomNotes = customNotesList.slice(0, customNotesHalfPoint)
  const secondHalfCustomNotes = customNotesList.slice(customNotesHalfPoint)

  return (
    // CLASA PE ROOT: Foarte importantă, dar nu suficientă pentru Input/Textarea.
    <div className={`space-y-6 ${fontSizeClasses[fontSize]}`}>
      {/* --- DIALOGURI CONFIRMARE ȘTERGERE (Rămân neschimbate) --- */}
      <Dialog open={isDeleteConfirmDialogOpen} onOpenChange={setIsDeleteConfirmDialogOpen}>
        <DialogContent className="[&>button]:hidden">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="w-5 h-5" /> Atenție: Ștergere Subgen
            </DialogTitle>
            <DialogDescription>Ești sigur că vrei să ștergi subgenul {subGenreName}?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteConfirmDialogOpen(false)
                setSubGenreToDeleteIndex(null)
              }}
            >
              Anulează
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirmed}>
              Șterge Oricum
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isStructureDeleteConfirmDialogOpen} onOpenChange={setIsStructureDeleteConfirmDialogOpen}>
        <DialogContent className="[&>button]:hidden">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="w-5 h-5" /> Atenție: Ștergere Rând Structură
            </DialogTitle>
            <DialogDescription>Ești sigur că vrei să ștergi actul de structură {structureItemName}?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsStructureDeleteConfirmDialogOpen(false)
                setStructureItemToDeleteIndex(null)
              }}
            >
              Anulează
            </Button>
            <Button variant="destructive" onClick={handleDeleteStructureConfirmed}>
              Șterge Oricum
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- DIALOG NOU: Adăugare/Editare Element Structură Detaliată (ACUM CU CLASA DE FONT PE INPUTS) --- */}
      <Dialog open={isStructureItemDialogOpen} onOpenChange={setIsStructureItemDialogOpen}>
        {/* FIX: Am adăugat clasa de font pe DialogContent */}
        <DialogContent className={`sm:max-w-[425px] md:max-w-[600px] lg:max-w-[800px] ${fontSizeClasses[fontSize]}`}>
          <DialogHeader>
            <DialogTitle>
              {editingIndex !== null ? "Editează Rândul de Structură" : "Adaugă Rând Nou de Structură"}
            </DialogTitle>
            <DialogDescription>
              Enter adaugă un rând nou, iar Ctrl + Enter mută focusul pe următorul câmp sau salvează.
            </DialogDescription>
          </DialogHeader>
          {editingStructureItem && (
            <div className="grid gap-4 py-4">
              {/* 1. Act/Capitol - FIX: Aplicăm clasa direct pe Input */}
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="actOrChapter" className="text-right">
                  Nume Act:
                </label>
                <Input
                  id="actOrChapter"
                  placeholder="Ex: Cap. 10 / Actul II"
                  value={editingStructureItem.actOrChapter}
                  onChange={(e) =>
                    setEditingStructureItem((prev) => (prev ? { ...prev, actOrChapter: e.target.value } : null))
                  }
                  className={`col-span-3 ${fontSizeClasses[fontSize]}`}
                  autoComplete="off"
                  spellCheck={false}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      document.getElementById("objective")?.focus()
                    }
                  }}
                />
              </div>

              {/* 2. Obiectiv (Plot Point) - FIX: Aplicăm clasa direct pe Input */}
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="objective" className="text-right">
                  Obiectiv:
                </label>
                <Input
                  id="objective"
                  placeholder="Ex: Confruntarea cu aliatul / Incendiul"
                  value={editingStructureItem.objective}
                  onChange={(e) =>
                    setEditingStructureItem((prev) => (prev ? { ...prev, objective: e.target.value } : null))
                  }
                  className={`col-span-3 ${fontSizeClasses[fontSize]}`}
                  autoComplete="off"
                  spellCheck={false}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      document.getElementById("eventSummary")?.focus()
                    }
                  }}
                />
              </div>

              {/* 3. Rezumat Eveniment - FIX: Aplicăm clasa direct pe Textarea */}
              <div className="grid grid-cols-4 items-start gap-4">
                <label htmlFor="eventSummary" className="text-right pt-2">
                  Rezumat Eveniment:
                </label>
                <Textarea
                  id="eventSummary"
                  placeholder="Descrie pe scurt ce se întâmplă, acțiunile cheie, conflictele. (Pe mai multe rânduri, dacă este necesar)"
                  value={editingStructureItem.eventSummary}
                  onChange={(e) =>
                    setEditingStructureItem((prev) => (prev ? { ...prev, eventSummary: e.target.value } : null))
                  }
                  className={`col-span-3 min-h-[100px] ${fontSizeClasses[fontSize]}`}
                  rows={4}
                  spellCheck={false}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && e.ctrlKey) {
                      e.preventDefault()
                      document.getElementById("toneAndPerspective")?.focus()
                    }
                  }}
                />
              </div>

              {/* 4. Ton/Perspectivă - FIX: Aplicăm clasa direct pe Textarea */}
              <div className="grid grid-cols-4 items-start gap-4">
                <label htmlFor="toneAndPerspective" className="text-right pt-2">
                  Ton/Perspectivă:
                </label>
                <Textarea
                  id="toneAndPerspective"
                  placeholder="Notează tonul, emoțiile dominante sau schimbările de perspectivă. (Câmpul cerut)"
                  value={editingStructureItem.toneAndPerspective}
                  onChange={(e) =>
                    setEditingStructureItem((prev) => (prev ? { ...prev, toneAndPerspective: e.target.value } : null))
                  }
                  className={`col-span-3 min-h-[80px] ${fontSizeClasses[fontSize]}`}
                  rows={3}
                  spellCheck={false}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && e.ctrlKey) {
                      e.preventDefault()
                      handleSaveStructureItem()
                    }
                  }}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsStructureItemDialogOpen(false)}>
              Anulează
            </Button>
            <Button onClick={handleSaveStructureItem}>
              {editingIndex !== null ? "Salvează Modificările" : "Adaugă Rând"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* --- END DIALOG NOU --- */}

      {/* Titlul principal și Butoanele de Font Size (Rămân neschimbate) */}
      <div className="flex items-center justify-between border-b pb-2">
        <div className={`flex items-center gap-3 ${titleSizeClasses[fontSize]} font-bold text-primary`}>
          <LayoutGrid className="w-6 h-6" />
          Planificare Detaliată a Cărții
        </div>

        <div className="flex items-center gap-1.5">
          {(["sm", "base", "lg"] as FontSize[]).map((size) => {
            const IconComponent = fontSizeIcons[size]
            const isActive = fontSize === size
            return (
              <Button
                key={size}
                variant={isActive ? "secondary" : "ghost"}
                size="icon"
                onClick={() => handleFontSizeChange(size)}
                className={`w-8 h-8 ${isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
                title={`Mărime Text: ${size.toUpperCase()}`}
              >
                <IconComponent className={iconSizes[size]} />
              </Button>
            )
          })}
        </div>
      </div>

      {/* Categoria Genul Cărții */}
      <div id="section-mainGenre" className="space-y-3 border p-4 rounded-lg bg-secondary/50">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleToggleSection("mainGenre")}
          className={`p-0 h-auto ${sectionTitleSizeClasses[fontSize]} font-semibold hover:bg-transparent flex items-center`}
        >
          {isSectionVisible("mainGenre") ? (
            <ChevronUp className="w-4 h-4 mr-1 text-primary" />
          ) : (
            <ChevronDown className="w-4 h-4 mr-1 text-muted-foreground" />
          )}
          Genul Cărții
        </Button>

        {isSectionVisible("mainGenre") && (
          <div className="space-y-3">
            <div className="space-y-2">
              <div className="flex gap-2 items-start">
                {/* 1. Nume Gen Principal - FIX: Aplicăm clasa direct pe Input */}
                <div className="space-y-1 w-1/3">
                  <span className="font-medium">Nume:</span>
                  <Input
                    id="mainGenre-input"
                    placeholder="Ex: Epic Fantasy"
                    value={safeContent.mainGenre || ""}
                    onChange={(e) => updateField("mainGenre", e.target.value)}
                    spellCheck={false}
                    className={fontSizeClasses[fontSize]}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        document.getElementById("mainGenreDescription-input")?.focus()
                      }
                    }}
                  />
                </div>
                {/* 2. Descriere Gen Principal - FIX: Aplicăm clasa direct pe Input */}
                <div className="space-y-1 w-2/3">
                  <span className="font-medium text-muted-foreground">Descriere:</span>
                  <Input
                    id="mainGenreDescription-input"
                    placeholder="Ex: Fantezie la scară largă, concentrată pe o luptă majoră."
                    value={safeContent.mainGenreDescription || ""}
                    onChange={(e) => updateField("mainGenreDescription", e.target.value)}
                    spellCheck={false}
                    className={fontSizeClasses[fontSize]}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        const nextElement = document.getElementById("subgenre-name-input-0")
                        if (nextElement) {
                          nextElement.focus()
                        } else {
                          document.getElementById("generalStructureNotes-textarea")?.focus()
                        }
                      }
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Subgenurile */}
            <div className="space-y-2 pt-2">
              <div className="flex justify-between items-center pb-1">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleToggleSubGenres}
                    className="p-0 h-auto font-semibold hover:bg-transparent"
                  >
                    {showSubGenres ? <ChevronUp className="w-4 h-4 mr-1" /> : <ChevronDown className="w-4 h-4 mr-1" />}
                    {/* FIX: Aplicăm clasa de font pe titlul Subgenuri */}
                    <span className={sectionTitleSizeClasses[fontSize]}>Subgenuri ({localSubGenres.length})</span>
                  </Button>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddSubGenre}
                  className="flex items-center gap-1 bg-transparent"
                >
                  <Plus className="w-4 h-4" />
                  Adaugă Subgen
                </Button>
              </div>

              {showSubGenres && (
                <div className="space-y-4 pt-2">
                  {localSubGenres.map((item, index) => (
                    <div
                      key={index}
                      className="flex gap-2 items-start p-2 border rounded-md bg-white/50 dark:bg-gray-800/50"
                    >
                      {/* Nume Subgen - FIX: Aplicăm clasa direct pe Input */}
                      <div className="space-y-1 w-1/3">
                        <span className="font-medium">Nume:</span>
                        <Input
                          id={`subgenre-name-input-${index}`}
                          placeholder={`Subgen ${index + 1} (Ex: Hopepunk)`}
                          value={item.name || ""}
                          onChange={(e) => handleSubGenreItemChange(index, "name", e.target.value)}
                          spellCheck={false}
                          className={fontSizeClasses[fontSize]}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault()
                              document.getElementById(`subgenre-desc-input-${index}`)?.focus()
                            }
                          }}
                        />
                      </div>
                      {/* Descriere Subgen - FIX: Aplicăm clasa direct pe Input */}
                      <div className="space-y-1 w-2/3">
                        <span className="font-medium text-muted-foreground">Descriere:</span>
                        <Input
                          id={`subgenre-desc-input-${index}`}
                          placeholder="Explicație (Ex: Speranța ca act de rezistență)."
                          value={item.description || ""}
                          onChange={(e) => handleSubGenreItemChange(index, "description", e.target.value)}
                          spellCheck={false}
                          className={fontSizeClasses[fontSize]}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault()
                              const nextElement = document.getElementById(`subgenre-name-input-${index + 1}`)
                              if (nextElement) {
                                nextElement.focus()
                              } else {
                                document.getElementById("generalStructureNotes-textarea")?.focus()
                              }
                            }
                          }}
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveSubGenre(index)}
                        className="flex-shrink-0 mt-5 h-6 w-6 text-destructive hover:bg-destructive/10"
                        title={`Șterge subgenul ${item.name || "fără nume"}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Categoria 1: Structura Generală (NOTE RAPIDE) */}
      <div id="section-generalStructure" className="space-y-2 border p-4 rounded-lg bg-secondary/50">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleToggleSection("generalStructure")}
          className={`p-0 h-auto ${sectionTitleSizeClasses[fontSize]} font-semibold hover:bg-transparent flex items-center`}
        >
          {isSectionVisible("generalStructure") ? (
            <ChevronUp className="w-4 h-4 mr-1 text-primary" />
          ) : (
            <ChevronDown className="w-4 h-4 mr-1 text-muted-foreground" />
          )}
          Structură Generală
        </Button>

        {isSectionVisible("generalStructure") && (
          // FIX: Aplicăm clasa direct pe Textarea
          <Textarea
            id="generalStructureNotes-textarea"
            placeholder="Ex: Actul I (Cap. 1-5). Actul II (Cap. 6-15). Ritm: Accelerare treptată."
            value={safeContent.generalStructureNotes}
            onChange={(e) => updateField("generalStructureNotes", e.target.value)}
            rows={4}
            spellCheck={false}
            className={fontSizeClasses[fontSize]}
          />
        )}
      </div>

      {/* Structura Detaliată (Bazată pe rânduri - Rămâne neschimbată, textul se moștenește OK de aici) */}
      <div id="section-detailedStructure" className="space-y-3 border p-4 rounded-lg bg-secondary/50">
        <div className="flex justify-between items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleToggleSection("detailedStructure")}
            className={`p-0 h-auto ${sectionTitleSizeClasses[fontSize]} font-semibold hover:bg-transparent flex items-center`}
          >
            {isSectionVisible("detailedStructure") ? (
              <ChevronUp className="w-4 h-4 mr-1 text-primary" />
            ) : (
              <ChevronDown className="w-4 h-4 mr-1 text-muted-foreground" />
            )}
            Structură Detaliată pe Acte
            {isSectionVisible("detailedStructure") && (
              <span className={`font-normal text-muted-foreground ml-2 ${fontSizeClasses[fontSize]}`}>
                ({localDetailedStructure.length} acte)
              </span>
            )}
          </Button>

          {isSectionVisible("detailedStructure") && (
            <Button
              size="sm"
              onClick={() => handleOpenStructureItemDialog(null, null)}
              className="flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              Adaugă Act
            </Button>
          )}
        </div>

        {isSectionVisible("detailedStructure") && (
          <div className="space-y-3 pt-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              {/* FIX: Aplicăm clasa de font pe Input-ul de căutare */}
              <Input
                placeholder="Caută Act (după Nume, Număr, Obiectiv, Rezumat sau Ton)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`pl-8 ${fontSizeClasses[fontSize]}`}
                spellCheck={false}
              />
            </div>

            {filteredStructure.length === 0 && (
              <p
                className={`text-center text-muted-foreground py-4 border rounded-md bg-white dark:bg-gray-800 ${fontSizeClasses[fontSize]}`}
              >
                {searchTerm
                  ? `Nu au fost găsite rânduri care să se potrivească cu "${searchTerm}".`
                  : 'Nicio structură detaliată adăugată. Apasă pe "Adaugă Rând" pentru a începe.'}
              </p>
            )}

            {filteredStructure.map((item, index) => {
              const originalIndex = localDetailedStructure.findIndex((i) => i.id === item.id)

              return (
                <div key={item.id} className={`p-3 border rounded-md shadow-sm bg-white dark:bg-gray-900 space-y-2`}>
                  <div className="flex justify-between items-start pb-1 border-b border-dashed">
                    {/* FIX: Aplicăm clasa de font pe titlu (h4) */}
                    <h4 className={`font-bold text-primary ${sectionTitleSizeClasses[fontSize]}`}>
                      Act {originalIndex + 1}: {item.actOrChapter || "Rând Fără Nume"}
                    </h4>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenStructureItemDialog(item, originalIndex)}
                        className="h-7 w-7 text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/50"
                        title="Editează rândul"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteStructureItem(originalIndex)}
                        className="h-7 w-7 text-destructive hover:bg-destructive/10"
                        title="Șterge rândul"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <p className={fontSizeClasses[fontSize]}>
                    <span className="font-semibold text-muted-foreground">Obiectiv:</span>{" "}
                    {item.objective || "Nespecificat"}
                  </p>
                  <p className={fontSizeClasses[fontSize]}>
                    <span className="font-semibold text-muted-foreground">Rezumat Eveniment:</span>
                    <span className="whitespace-pre-wrap ml-1">{item.eventSummary || "Fără rezumat."}</span>
                  </p>
                  <p className={fontSizeClasses[fontSize]}>
                    <span className="font-semibold text-muted-foreground">Ton/Perspectivă:</span>
                    <span className="whitespace-pre-wrap ml-1">{item.toneAndPerspective || "Nespecificat."}</span>
                  </p>
                </div>
              )
            })}
          </div>
        )}
      </div>
      {/* SFÂRȘIT STRUCTURĂ DETALIATĂ */}

      {/* Categoria 2: Stil și Ton (Aplicăm clasa de font pe Textarea și liste) */}
      <div id="section-style" className="space-y-2 border p-4 rounded-lg bg-secondary/50">
        <div className="flex justify-between items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleToggleSection("style")}
            className={`p-0 h-auto ${sectionTitleSizeClasses[fontSize]} font-semibold hover:bg-transparent flex items-center`}
          >
            {isSectionVisible("style") ? (
              <ChevronUp className="w-4 h-4 mr-1 text-primary" />
            ) : (
              <ChevronDown className="w-4 h-4 mr-1 text-muted-foreground" />
            )}
            Stil și Ton
          </Button>

          {isSectionVisible("style") && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsStyleAndToneEditing((prev) => !prev)}
              className="flex items-center gap-1"
            >
              {isStyleAndToneEditing ? (
                <>
                  <X className="w-4 h-4" />
                  Închide Editarea
                </>
              ) : (
                <>
                  <Pencil className="w-4 h-4" />
                  Editează Text
                </>
              )}
            </Button>
          )}
        </div>

        {isSectionVisible("style") && (
          <>
            {/* FIX: Clasa de font aplicată pe Textarea */}
            <Textarea
              id="styleAndTone-textarea"
              placeholder="Ex: Ton: Noir, cinic. Stil: Proza descriptivă, fraze scurte și tăioase. Paleta emoțională: Melancolie și disperare. (Fiecare idee pe o linie nouă)"
              value={safeContent.styleAndTone}
              onChange={(e) => updateField("styleAndTone", e.target.value)}
              rows={isStyleAndToneEditing ? 10 : 4}
              spellCheck={false}
              className={`transition-all duration-300 ${isStyleAndToneEditing ? "block" : "hidden"} ${fontSizeClasses[fontSize]}`}
            />

            {!isStyleAndToneEditing &&
              (styleAndToneList.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* FIX: Clasa de font aplicată pe lista (ul) */}
                  <div
                    className={`border rounded-lg p-4 bg-white dark:bg-gray-800 shadow-sm ${fontSizeClasses[fontSize]}`}
                  >
                    <ul className="list-disc pl-5 space-y-2">
                      {firstHalfStyle.map((item, index) => (
                        <li key={`style-1-${index}`}>{item.trim()}</li>
                      ))}
                    </ul>
                  </div>

                  {/* FIX: Clasa de font aplicată pe lista (ul) */}
                  <div
                    className={`border rounded-lg p-4 bg-white dark:bg-gray-800 shadow-sm ${fontSizeClasses[fontSize]}`}
                  >
                    <ul className="list-disc pl-5 space-y-2">
                      {secondHalfStyle.map((item, index) => (
                        <li key={`style-2-${index}`}>{item.trim()}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <p
                  className={`text-center text-muted-foreground py-4 border rounded-md bg-white dark:bg-gray-800 ${fontSizeClasses[fontSize]}`}
                >
                  Niciun stil sau ton adăugat. Apasă pe "Editează Text" pentru a adăuga.
                </p>
              ))}
          </>
        )}
      </div>
      {/* SFÂRȘIT CATEGORIA STIL ȘI TON */}

      {/* Categoria 3: Idei și Teme Cheie (Aplicăm clasa de font pe Textarea și liste) */}
      <div id="section-ideas" className="space-y-2 border p-4 rounded-lg bg-secondary/50">
        <div className="flex justify-between items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleToggleSection("ideas")}
            className={`p-0 h-auto ${sectionTitleSizeClasses[fontSize]} font-semibold hover:bg-transparent flex items-center`}
          >
            {isSectionVisible("ideas") ? (
              <ChevronUp className="w-4 h-4 mr-1 text-primary" />
            ) : (
              <ChevronDown className="w-4 h-4 mr-1 text-muted-foreground" />
            )}
            Idei și Teme Cheie
          </Button>

          {isSectionVisible("ideas") && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsKeyIdeasEditing((prev) => !prev)}
              className="flex items-center gap-1"
            >
              {isKeyIdeasEditing ? (
                <>
                  <X className="w-4 h-4" />
                  Închide Editarea
                </>
              ) : (
                <>
                  <Pencil className="w-4 h-4" />
                  Editează Text
                </>
              )}
            </Button>
          )}
        </div>

        {isSectionVisible("ideas") && (
          <>
            <Textarea
              id="keyThemesText-textarea"
              placeholder="Ex: Tema principală: Corupția sufletului sub presiune. Fiecare idee pe o linie nouă. (Ex: Traumele copilăriei)"
              value={safeContent.keyThemesText}
              onChange={(e) => updateField("keyThemesText", e.target.value)}
              rows={isKeyIdeasEditing ? 10 : 4}
              spellCheck={false}
              className={`transition-all duration-300 ${isKeyIdeasEditing ? "block" : "hidden"} ${fontSizeClasses[fontSize]}`}
            />

            {!isKeyIdeasEditing &&
              (keyIdeasList.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div
                    className={`border rounded-lg p-4 bg-white dark:bg-gray-800 shadow-sm ${fontSizeClasses[fontSize]}`}
                  >
                    <ul className="list-disc pl-5 space-y-2">
                      {firstHalfIdeas.map((idea, index) => (
                        <li key={`idea-1-${index}`}>{idea.trim()}</li>
                      ))}
                    </ul>
                  </div>

                  <div
                    className={`border rounded-lg p-4 bg-white dark:bg-gray-800 shadow-sm ${fontSizeClasses[fontSize]}`}
                  >
                    <ul className="list-disc pl-5 space-y-2">
                      {secondHalfIdeas.map((idea, index) => (
                        <li key={`idea-2-${index}`}>{idea.trim()}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <p
                  className={`text-center text-muted-foreground py-4 border rounded-md bg-white dark:bg-gray-800 ${fontSizeClasses[fontSize]}`}
                >
                  Nicio idee sau temă cheie adăugată. Apasă pe "Editează Text" pentru a adăuga.
                </p>
              ))}
          </>
        )}
      </div>
      {/* SFÂRȘIT CATEGORIA IDEI ȘI TEME CHEIE */}

      {/* Categoria 4: Perspectivă Narativă (Aplicăm clasa de font pe Textarea și liste) */}
      <div id="section-perspective" className="space-y-2 border p-4 rounded-lg bg-secondary/50">
        <div className="flex justify-between items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleToggleSection("perspective")}
            className={`p-0 h-auto ${sectionTitleSizeClasses[fontSize]} font-semibold hover:bg-transparent flex items-center`}
          >
            {isSectionVisible("perspective") ? (
              <ChevronUp className="w-4 h-4 mr-1 text-primary" />
            ) : (
              <ChevronDown className="w-4 h-4 mr-1 text-muted-foreground" />
            )}
            Perspectivă Narativă
          </Button>

          {isSectionVisible("perspective") && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsNarrativePerspectiveEditing((prev) => !prev)}
              className="flex items-center gap-1"
            >
              {isNarrativePerspectiveEditing ? (
                <>
                  <X className="w-4 h-4" />
                  Închide Editarea
                </>
              ) : (
                <>
                  <Pencil className="w-4 h-4" />
                  Editează Text
                </>
              )}
            </Button>
          )}
        </div>

        {isSectionVisible("perspective") && (
          <>
            {/* FIX: Clasa de font aplicată pe Textarea */}
            <Textarea
              id="narrativePerspective-textarea"
              placeholder="Ex: Perspectiva: Persoana a III-a limitată pe protagonist. Voce: Formală, dar cu subtext emoțional puternic. (Fiecare idee pe o linie nouă)"
              value={safeContent.narrativePerspective}
              onChange={(e) => updateField("narrativePerspective", e.target.value)}
              rows={isNarrativePerspectiveEditing ? 8 : 3}
              spellCheck={false}
              className={`transition-all duration-300 ${isNarrativePerspectiveEditing ? "block" : "hidden"} ${fontSizeClasses[fontSize]}`}
            />

            {!isNarrativePerspectiveEditing &&
              (narrativePerspectiveList.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* FIX: Clasa de font aplicată pe lista (ul) */}
                  <div
                    className={`border rounded-lg p-4 bg-white dark:bg-gray-800 shadow-sm ${fontSizeClasses[fontSize]}`}
                  >
                    <ul className="list-disc pl-5 space-y-2">
                      {firstHalfNarrative.map((item, index) => (
                        <li key={`narrative-1-${index}`}>{item.trim()}</li>
                      ))}
                    </ul>
                  </div>

                  {/* FIX: Clasa de font aplicată pe lista (ul) */}
                  <div
                    className={`border rounded-lg p-4 bg-white dark:bg-gray-800 shadow-sm ${fontSizeClasses[fontSize]}`}
                  >
                    <ul className="list-disc pl-5 space-y-2">
                      {secondHalfNarrative.map((item, index) => (
                        <li key={`narrative-2-${index}`}>{item.trim()}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <p
                  className={`text-center text-muted-foreground py-4 border rounded-md bg-white dark:bg-gray-800 ${fontSizeClasses[fontSize]}`}
                >
                  Nicio perspectivă narativă adăugată. Apasă pe "Editează Text" pentru a adăuga.
                </p>
              ))}
          </>
        )}
      </div>
      {/* SFÂRȘIT CATEGORIA PERSPECTIVĂ NARATIVĂ */}

      {/* Categoria 5: Personalizat / Note Suplimentare (Aplicăm clasa de font pe Textarea și liste) */}
      <div id="section-notes" className="space-y-2 border p-4 rounded-lg bg-secondary/50">
        <div className="flex justify-between items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleToggleSection("notes")}
            className={`p-0 h-auto ${sectionTitleSizeClasses[fontSize]} font-semibold hover:bg-transparent flex items-center`}
          >
            {isSectionVisible("notes") ? (
              <ChevronUp className="w-4 h-4 mr-1 text-primary" />
            ) : (
              <ChevronDown className="w-4 h-4 mr-1 text-muted-foreground" />
            )}
            Note Suplimentare
          </Button>

          {isSectionVisible("notes") && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCustomNotesEditing((prev) => !prev)}
              className="flex items-center gap-1"
            >
              {isCustomNotesEditing ? (
                <>
                  <X className="w-4 h-4" />
                  Închide Editarea
                </>
              ) : (
                <>
                  <Pencil className="w-4 h-4" />
                  Editează Text
                </>
              )}
            </Button>
          )}
        </div>

        {isSectionVisible("notes") && (
          <>
            {/* FIX: Clasa de font aplicată pe Textarea */}
            <Textarea
              id="customNotes-textarea"
              placeholder="Ex: Obiectiv: Să mă asigur că cititorii empatizează cu antagonistul. Memento: Verifică consistența sistemului de magie la capitolul 10. (Fiecare notă pe o linie nouă)"
              value={safeContent.customNotes}
              onChange={(e) => updateField("customNotes", e.target.value)}
              rows={isCustomNotesEditing ? 8 : 3}
              spellCheck={false}
              className={`transition-all duration-300 ${isCustomNotesEditing ? "block" : "hidden"} ${fontSizeClasses[fontSize]}`}
            />

            {!isCustomNotesEditing &&
              (customNotesList.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* FIX: Clasa de font aplicată pe lista (ul) */}
                  <div
                    className={`border rounded-lg p-4 bg-white dark:bg-gray-800 shadow-sm ${fontSizeClasses[fontSize]}`}
                  >
                    <ul className="list-disc pl-5 space-y-2">
                      {firstHalfCustomNotes.map((item, index) => (
                        <li key={`custom-note-1-${index}`}>{item.trim()}</li>
                      ))}
                    </ul>
                  </div>

                  {/* FIX: Clasa de font aplicată pe lista (ul) */}
                  <div
                    className={`border rounded-lg p-4 bg-white dark:bg-gray-800 shadow-sm ${fontSizeClasses[fontSize]}`}
                  >
                    <ul className="list-disc pl-5 space-y-2">
                      {secondHalfCustomNotes.map((item, index) => (
                        <li key={`custom-note-2-${index}`}>{item.trim()}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <p
                  className={`text-center text-muted-foreground py-4 border rounded-md bg-white dark:bg-gray-800 ${fontSizeClasses[fontSize]}`}
                >
                  Nicio notă suplimentară adăugată. Apasă pe "Editează Text" pentru a adăuga.
                </p>
              ))}
          </>
        )}
      </div>
      {/* SFÂRȘIT CATEGORIA PERSONALIZAT */}
    </div>
  )
}
