"use client"

import type React from "react"
import { useState, useRef, useEffect, useLayoutEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Plus, Trash2, ChevronDown, ChevronUp, Lightbulb } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export interface BookStructureContent {
  keyIdeas: string
  generalStructure?: string
  styleAndTone?: string
  narrativePerspective?: string
  customNotes?: string
}

interface IdeaItem {
  id: string
  category: "kingdom" | "monarchy" | "hierarchy" | "themes" | "worldRules" | "tasks" | "improvements" | "custom" | string // ADAUGAT: "kingdom"
  title: string
  description: string
}

interface KeyIdeasEditorProps {
  content: BookStructureContent
  onChange: (newContent: Partial<BookStructureContent>) => void
  hideActions?: boolean
}

const IDEA_CATEGORIES: Record<string, string> = {
  kingdom: "Regat", // ADAUGAT AICI
  monarchy: "Case Monarhale",
  hierarchy: "Ierarhii Sociale",
  themes: "Teme Centrale",
  worldRules: "Reguli ale Lumii",
  tasks: "Sarcini de Făcut",
  improvements: "Îmbunătățiri",
  custom: "Personalizat...",
}

const capitalizeText = (text: string): string => {
  if (!text.length) return text

  let capitalized = text
  const firstLetterMatch = capitalized.match(/^(\s*)([a-zăâîșț])/)
  if (firstLetterMatch) {
    capitalized = capitalized.replace(firstLetterMatch[0], firstLetterMatch[1] + firstLetterMatch[2].toUpperCase())
  }

  capitalized = capitalized.replace(/([.?!])(\s+)([a-zăâîșț])/g, (match, punc, space, letter) => {
    return punc + space + letter.toUpperCase()
  })

  capitalized = capitalized.replace(/(\n)(\s*)([a-zăâîșț])/g, (match, newline, space, letter) => {
    return newline + space + letter.toUpperCase()
  })

  return capitalized
}

// --- LOGICA DE PERSISTENȚĂ ÎN LOCAL STORAGE ---

// Cheile pentru localStorage
const LS_PREFIX = "keyIdeasEditorState_"
const LS_NEW_CATEGORY_KEY = LS_PREFIX + "newCategory"
const LS_CUSTOM_CATEGORY_KEY = LS_PREFIX + "customCategory"
const LS_SELECTED_CATEGORY_KEY = LS_PREFIX + "selectedCategory"

/**
 * Citeste o valoare din localStorage sau returneaza o valoare implicita.
 * Se asigura ca ruleaza doar in mediul client (browser).
 */
const getInitialState = <T>(key: string, defaultValue: T): T => {
  if (typeof window !== "undefined") {
    const storedValue = localStorage.getItem(key)
    if (storedValue !== null) {
      // Pentru tipuri simple (string), returneaza valoarea stocata
      return storedValue as T
    }
  }
  return defaultValue
}
// ----------------------------------------------

const KeyIdeasEditor = ({ content, onChange, hideActions }: KeyIdeasEditorProps) => {
  // Stare inițializată din localStorage pentru categoria de filtrare
  const [selectedCategory, setSelectedCategory] = useState<string>(
    () => getInitialState(LS_SELECTED_CATEGORY_KEY, "all")
  )

  const [ideas, setIdeas] = useState<IdeaItem[]>(() => {
    try {
      const jsonString = content.keyIdeas || "[]"
      const parsedContent = JSON.parse(jsonString)
      return parsedContent.map((item: any) => ({
        ...item,
        category: item.category || "themes",
      }))
    } catch {
      return []
    }
  })

  const ideasRef = useRef(ideas)
  ideasRef.current = ideas

  const [newTitle, setNewTitle] = useState("")
  // Stare inițializată din localStorage pentru categoria ideii noi
  const [newCategory, setNewCategory] = useState<IdeaItem["category"]>(
    () => getInitialState<IdeaItem["category"]>(LS_NEW_CATEGORY_KEY, "themes")
  )
  // Stare inițializată din localStorage pentru categoria personalizată
  const [customCategory, setCustomCategory] = useState(
    () => getInitialState(LS_CUSTOM_CATEGORY_KEY, "")
  )

  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [tempDescription, setTempDescription] = useState("")
  const [cursorPosition, setCursorPosition] = useState<{ start: number; end: number } | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const newTitleRef = useRef<HTMLInputElement>(null)
  const newCustomCategoryRef = useRef<HTMLInputElement>(null)

  const dragItem = useRef<number | null>(null)
  const dragOverItem = useRef<number | null>(null)
  const dragOverRef = useRef<HTMLElement | null>(null) // Adăugat pentru feedback vizual D&D

  const uniqueCategories = Array.from(new Set(ideas.map((idea) => idea.category)))

  const filteredIdeas = ideas.filter((idea) => {
    return selectedCategory === "all" || idea.category === selectedCategory
  })

  const updateIdeas = (newIdeas: IdeaItem[]) => {
    setIdeas(newIdeas)
    onChange({ keyIdeas: JSON.stringify(newIdeas) })
  }

  const updateIdea = (id: string, field: keyof IdeaItem, value: string) => {
    const newIdeas = ideas.map((idea) => (idea.id === id ? { ...idea, [field]: value } : idea))
    setIdeas(newIdeas)
    onChange({ keyIdeas: JSON.stringify(newIdeas) })
  }

  const addIdea = () => {
    if (!newTitle.trim()) {
      newTitleRef.current?.focus()
      return
    }

    let finalCategory: string

    if (newCategory === "custom") {
      if (!customCategory.trim()) {
        newCustomCategoryRef.current?.focus()
        return
      }
      finalCategory = capitalizeText(customCategory)
    } else {
      finalCategory = newCategory
    }

    const capitalizedTitle = capitalizeText(newTitle)

    const newIdea: IdeaItem = {
      id: Date.now().toString(),
      category: finalCategory,
      title: capitalizedTitle,
      description: "",
    }
    updateIdeas([...ideas, newIdea])
    setNewTitle("")
    // Nu reseta newCategory/customCategory, le lasam sa persiste
    setExpandedId(newIdea.id)
    newTitleRef.current?.focus()
  }

  const deleteIdea = (id: string) => {
    const newIdeas = ideas.filter((idea) => idea.id !== id)
    updateIdeas(newIdeas)
    if (expandedId === id) {
      setExpandedId(null)
    }
  }

  // 🛠️ LOGICA VIZUALĂ ȘI DE SORTARE D&D (Actualizată)
  
  const handleSort = () => {
    if (dragItem.current === null || dragOverItem.current === null) return
    
    const allIdeas = [...ideas]
    const filteredIds = filteredIdeas.map((idea) => idea.id)

    const draggedId = filteredIds[dragItem.current]
    const targetId = filteredIds[dragOverItem.current]

    const draggedIndex = allIdeas.findIndex((idea) => idea.id === draggedId)
    const targetIndex = allIdeas.findIndex((idea) => idea.id === targetId)

    if (draggedIndex === -1 || targetIndex === -1) return

    const [reorderedItem] = allIdeas.splice(draggedIndex, 1)
    allIdeas.splice(targetIndex, 0, reorderedItem)

    dragItem.current = null
    dragOverItem.current = null

    updateIdeas(allIdeas)
  }

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    dragItem.current = index
    // Adaugă feedback vizual elementului tras
    e.currentTarget.classList.add("opacity-50", "border-dashed", "border-primary")
  }
  
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    if (dragItem.current === null || dragItem.current === index) return

    // Șterge feedback-ul vizual de pe elementul anterior (dacă există)
    if (dragOverRef.current) {
        dragOverRef.current.style.paddingTop = ""
        dragOverRef.current.style.paddingBottom = ""
    }

    dragOverItem.current = index
    dragOverRef.current = e.currentTarget

    // Adaugă spațiu (padding) pentru a indica poziția de plasare
    if (dragItem.current < index) {
      e.currentTarget.style.paddingBottom = "30px" 
    } else {
      e.currentTarget.style.paddingTop = "30px" 
    }
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    if (e.relatedTarget instanceof Element && e.currentTarget.contains(e.relatedTarget)) {
      return
    }
    
    if (dragOverRef.current === e.currentTarget) {
        e.currentTarget.style.paddingTop = ""
        e.currentTarget.style.paddingBottom = ""
        dragOverRef.current = null
    }
  }

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => { 
    handleSort() 
    // Șterge feedback-ul vizual de pe elementul tras
    e.currentTarget.classList.remove("opacity-50", "border-dashed", "border-primary")
    
    // Șterge orice padding rezidual
    e.currentTarget.style.paddingTop = "" 
    e.currentTarget.style.paddingBottom = ""
    
    if (dragOverRef.current) {
        dragOverRef.current.style.paddingTop = ""
        dragOverRef.current.style.paddingBottom = ""
        dragOverRef.current = null
    }
  }
// --- END D&D LOGIC & VISUAL FIX ---

  useEffect(() => {
    const selectedIdea = ideas.find((idea) => idea.id === expandedId)
    if (selectedIdea) {
      setTempDescription(selectedIdea.description)
    } else {
      setTempDescription("")
    }
  }, [expandedId, ideas])

  useEffect(() => {
    if (!expandedId) return

    const selectedIdea = ideasRef.current.find((idea) => idea.id === expandedId)
    if (!selectedIdea || tempDescription === selectedIdea.description) {
      return
    }

    const handler = setTimeout(() => {
      const transformedText = capitalizeText(tempDescription)

      if (transformedText !== selectedIdea.description) {
        const lengthDifference = transformedText.length - tempDescription.length
        const currentStart = textareaRef.current?.selectionStart ?? tempDescription.length
        const currentEnd = textareaRef.current?.selectionEnd ?? tempDescription.length

        setCursorPosition({
          start: currentStart + lengthDifference,
          end: currentEnd + lengthDifference,
        })

        updateIdea(expandedId, "description", transformedText)
      } else {
        updateIdea(expandedId, "description", transformedText)
      }
    }, 300)

    return () => {
      clearTimeout(handler)
    }
  }, [tempDescription, expandedId])

  useLayoutEffect(() => {
    if (cursorPosition && textareaRef.current && textareaRef.current.name === expandedId) {
      textareaRef.current.selectionStart = cursorPosition.start
      textareaRef.current.selectionEnd = cursorPosition.end
      setCursorPosition(null)
    }
  }, [cursorPosition, expandedId])

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>, id: string) => {
    setTempDescription(e.target.value)
  }

  // --- Salvarea stărilor în localStorage ---

  // Salvează categoria nouă selectată
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(LS_NEW_CATEGORY_KEY, newCategory)
    }
  }, [newCategory])

  // Salvează categoria personalizată (dacă este setată)
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(LS_CUSTOM_CATEGORY_KEY, customCategory)
    }
  }, [customCategory])

  // Salvează categoria de filtrare
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(LS_SELECTED_CATEGORY_KEY, selectedCategory)
    }
  }, [selectedCategory])

  // ------------------------------------------


  return (
    <div className="space-y-4 overflow-x-hidden">
      <div className="flex space-x-2">
        <Select
          value={newCategory}
          onValueChange={(value: IdeaItem["category"]) => {
            setNewCategory(value)
            setCustomCategory("")
            if (value === "custom") {
              setTimeout(() => newCustomCategoryRef.current?.focus(), 50)
            } else {
              setTimeout(() => newTitleRef.current?.focus(), 50)
            }
          }}
        >
          <SelectTrigger className="w-48 h-9 text-sm flex-shrink-0">
            <SelectValue placeholder="Categorie" />
          </SelectTrigger>
          <SelectContent>
            {Object.keys(IDEA_CATEGORIES).map((key) => (
              <SelectItem key={key} value={key}>
                {IDEA_CATEGORIES[key]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {newCategory === "custom" && (
          <Input
            ref={newCustomCategoryRef}
            value={customCategory}
            onChange={(e) => setCustomCategory(e.target.value)}
            placeholder="Categorie Personalizată"
            className="w-48 h-9 text-sm flex-shrink-0"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                newTitleRef.current?.focus()
              }
            }}
          />
        )}

        <Input
          ref={newTitleRef}
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Titlu Idee Nouă..."
          className="h-9 text-sm flex-1"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              addIdea()
            }
          }}
        />

        <Button
          onClick={addIdea}
          disabled={!newTitle.trim() || (newCategory === "custom" && !customCategory.trim())}
          className="h-9 w-9 p-0 flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {filteredIdeas.length > 0 && (
        <div className="rounded-md border bg-muted/30 p-2">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold p-2 flex items-center gap-2">
              <Lightbulb className="w-4 h-4" />
              {selectedCategory === "all" ? (
                <>Toate Ideile ({ideas.length})</>
              ) : (
                <>
                  {IDEA_CATEGORIES[selectedCategory] || selectedCategory} ({filteredIdeas.length})
                </>
              )}
            </div>
            <Select 
              value={selectedCategory} 
              onValueChange={setSelectedCategory} // Folosește direct setSelectedCategory
            >
              <SelectTrigger className="w-48 h-8 text-xs">
                <SelectValue placeholder="Filtrează după categorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toate Categoriile</SelectItem>
                {uniqueCategories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {IDEA_CATEGORIES[cat] || cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {filteredIdeas.length > 0 && (
        <div className="space-y-3">
          {filteredIdeas.map((idea, index) => (
            <Card
              key={idea.id}
              // ANIMATIA DE HOVER (hover:shadow-xl hover:scale-[1.005]) A FOST ELIMINATA AICI:
              className={`p-3 transition-all duration-150 ${idea.id === expandedId ? "border-primary shadow-lg" : ""} `}
              draggable
              onDragStart={(e) => handleDragStart(e, index)} // Handler vizual
              onDragEnter={(e) => handleDragEnter(e, index)} // Handler vizual
              onDragLeave={handleDragLeave} // Handler vizual
              onDragEnd={handleDragEnd} // Handler vizual + sortare
              onDragOver={(e) => e.preventDefault()}
            >
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setExpandedId(expandedId === idea.id ? null : idea.id)}
                  className="p-1 flex-shrink-0"
                >
                  {expandedId === idea.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                <span className="bg-primary/10 text-primary text-xs font-medium px-2 py-1 rounded w-48 text-center flex-shrink-0">
                  {IDEA_CATEGORIES[idea.category] ? IDEA_CATEGORIES[idea.category] : idea.category}
                </span>
                <Input
                  value={idea.title}
                  onChange={(e) => updateIdea(idea.id, "title", e.target.value)}
                  placeholder="Titlu"
                  // MODIFICAT: Clasă de lățime w-2/3 (aprox. 66%), mult mai lungă decât înainte, pentru a simula 85% din spațiul rămas.
                  className="h-8 text-sm w-2/3 flex-shrink-0 min-w-0" 
                  onClick={() => setExpandedId(idea.id)}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  // PĂSTRAT: ml-auto pentru a împinge butonul la marginea dreaptă.
                  className="h-6 w-6 text-destructive flex-shrink-0 ml-auto"
                  onClick={() => deleteIdea(idea.id)}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>

              {expandedId === idea.id && (
                <div className="mt-2 space-y-3">
                  <Textarea
                    ref={textareaRef}
                    name={idea.id}
                    value={tempDescription}
                    onChange={(e) => handleDescriptionChange(e, idea.id)}
                    placeholder="Descriere detaliată a ideii..."
                    className="text-sm min-h-[120px]"
                    spellCheck={false}
                  />
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {filteredIdeas.length === 0 && ideas.length === 0 && (
        <div className="text-center py-6 text-muted-foreground text-sm">
          Nu ai adăugat idei. Începe prin a adăuga case monarhale, ierarhii sociale, teme centrale sau alte concepte
          importante pentru cartea ta.
        </div>
      )}

      {filteredIdeas.length === 0 && ideas.length > 0 && (
        <div className="text-center py-6 text-muted-foreground text-sm">
          Nu există idei în categoria{" "}
          <span className="font-medium">
            {IDEA_CATEGORIES[selectedCategory] ? IDEA_CATEGORIES[selectedCategory] : selectedCategory}
          </span>
          .
        </div>
      )}
    </div>
  )
}

export default KeyIdeasEditor