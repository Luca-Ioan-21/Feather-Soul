// app/write/components/timeline-editor.tsx
"use client"

import type React from "react"
import { useState, useRef, useEffect, useLayoutEffect, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Plus, Trash2, ChevronDown, ChevronUp, Clock, User, ArrowDown, ArrowUp, Filter, Search } from "lucide-react" 
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface SimpleCharacter {
  id: string
  name: string
}

interface TimelineEvent {
  id: string
  category: "battle" | "birth" | "death" | "discovery" | "ceremony" | "disaster" | "custom" | string
  year: string
  title: string
  description: string
  characterId: string | null
}

interface TimelineEditorProps {
  content: string
  onChange: (value: string) => void
  characters: SimpleCharacter[] 
}

const EVENT_CATEGORIES: Record<string, string> = {
  battle: "Bătălie/Război",
  birth: "Naștere",
  death: "Moarte",
  discovery: "Descoperire",
  ceremony: "Ceremonie",
  disaster: "Dezastru",
  custom: "Personalizat...",
}

const capitalizeText = (text: string): string => {
  if (!text.length) return text

  let capitalized = text
  const firstLetterMatch = capitalized.match(/^(\s*)([a-zăâîșț])/)
  if (firstLetterMatch) {
    capitalized = capitalized.replace(firstLetterMatch[0], firstLetterMatch[1] + firstLetterMatch[2].toUpperCase())
  }

  capitalized = capitalized.replace(/([.?!:])(\s+)([a-zăâîșț])/g, (match, punc, space, letter) => {
    return punc + space + letter.toUpperCase()
  })

  capitalized = capitalized.replace(/(\n)(\s*)([a-zăâîșț])/g, (match, newline, space, letter) => {
    return newline + space + letter.toUpperCase()
  })

  return capitalized
}

// --- LOGICA DE PERSISTENȚĂ ÎN LOCAL STORAGE ---

const LS_PREFIX = "timelineEditorState_"
const LS_NEW_CATEGORY_KEY = LS_PREFIX + "newCategory"
const LS_CUSTOM_CATEGORY_KEY = LS_PREFIX + "customCategory"
const LS_NEW_CHARACTER_ID_KEY = LS_PREFIX + "newCharacterId"
const LS_FILTER_BY_CHARACTER_ID_KEY = LS_PREFIX + "filterByCharacterId"
const LS_SORT_BY_KEY = LS_PREFIX + "sortBy"
const LS_SORT_DIRECTION_KEY = LS_PREFIX + "sortDirection"
const LS_CHARACTER_SEARCH_KEY = LS_PREFIX + "characterSearchTerm"

type SortBy = "year" | "category" | "character" | "manual" 
type SortDirection = "asc" | "desc"

/**
 * Citeste o valoare din localStorage sau returneaza o valoare implicita.
 */
const getInitialState = <T>(key: string, defaultValue: T): T => {
  if (typeof window !== "undefined") {
    try {
        const storedValue = localStorage.getItem(key)
        if (storedValue !== null) {
            // Validări specifice pentru tipurile cunoscute
            if (key === LS_SORT_DIRECTION_KEY && storedValue !== "asc" && storedValue !== "desc") {
                return defaultValue
            }
            if (key === LS_SORT_BY_KEY && storedValue !== "manual" && storedValue !== "year" && storedValue !== "category" && storedValue !== "character") {
                return defaultValue
            }
            if (key === LS_NEW_CATEGORY_KEY) {
              const validCategories = Object.keys(EVENT_CATEGORIES)
              if (!validCategories.includes(storedValue) && storedValue !== getInitialState(LS_CUSTOM_CATEGORY_KEY, '')) {
                if (!storedValue.startsWith('custom_')) return defaultValue
              }
            }

            return storedValue as T
        }
    } catch (e) {
        console.error(`Eroare la citirea localStorage pentru cheia ${key}:`, e)
    }
  }
  return defaultValue
}

// --- Functii helper pentru conversia valorilor selectate ---
const getStorageCharacterId = (selectValue: string): string | null => {
  return selectValue === "no-character" ? null : selectValue
}

const getFilterCharacterId = (selectValue: string): string | null => {
  return selectValue === "all" ? null : selectValue
}

const getSelectCharacterValue = (characterId: string | null): string => {
  return characterId === null ? "no-character" : characterId
}
// ----------------------------------------------


export function TimelineEditor({ content, onChange, characters }: TimelineEditorProps) {
  const [events, setEvents] = useState<TimelineEvent[]>(() => {
    try {
      const parsedContent = JSON.parse(content)
      return parsedContent.map((item: any) => ({
        ...item,
        category: item.category || "battle",
        characterId: item.characterId === undefined || item.characterId === "" ? null : item.characterId, 
      }))
    } catch {
      return []
    }
  })

  const eventsRef = useRef(events)
  eventsRef.current = events

  const [newYear, setNewYear] = useState("")
  const [newTitle, setNewTitle] = useState("")
  
  // Stări inițializate din localStorage (Adăugare)
  const [newCategory, setNewCategory] = useState<TimelineEvent["category"]>(
    () => getInitialState<TimelineEvent["category"]>(LS_NEW_CATEGORY_KEY, "battle")
  )
  const [newCharacterId, setNewCharacterId] = useState<string | null>(
    () => getStorageCharacterId(getInitialState(LS_NEW_CHARACTER_ID_KEY, "no-character"))
  )
  const [customCategory, setCustomCategory] = useState(
    () => getInitialState(LS_CUSTOM_CATEGORY_KEY, "")
  )

  // Stări inițializate din localStorage (Sortare/Filtrare)
  const [sortBy, setSortBy] = useState<SortBy>(
    () => getInitialState<SortBy>(LS_SORT_BY_KEY, "manual")
  )
  const [sortDirection, setSortDirection] = useState<SortDirection>(
    () => getInitialState<SortDirection>(LS_SORT_DIRECTION_KEY, "asc")
  )
  const [filterByCharacterId, setFilterByCharacterId] = useState<string | null>(
    () => getFilterCharacterId(getInitialState(LS_FILTER_BY_CHARACTER_ID_KEY, "all"))
  )
  const [characterSearchTerm, setCharacterSearchTerm] = useState<string>(
    () => getInitialState(LS_CHARACTER_SEARCH_KEY, "")
  ) 

  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [tempDescription, setTempDescription] = useState("")
  const [cursorPosition, setCursorPosition] = useState<{ start: number; end: number } | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const newYearRef = useRef<HTMLInputElement>(null)
  const newTitleRef = useRef<HTMLInputElement>(null)
  const newCustomCategoryRef = useRef<HTMLInputElement>(null)

  // Ref-uri pentru Drag & Drop
  const dragItem = useRef<number | null>(null)
  const dragOverItem = useRef<number | null>(null)
  const dragOverRef = useRef<HTMLElement | null>(null)

  const characterMap = useMemo(() => {
    return new Map(characters.map(c => [c.id, c]))
  }, [characters])
  
  const filteredCharacters = useMemo(() => {
    const lowerCaseSearchTerm = characterSearchTerm.toLowerCase()
    return characters.filter((c) =>
      c.name.toLowerCase().includes(lowerCaseSearchTerm)
    )
  }, [characters, characterSearchTerm])

  const updateEvents = (newEvents: TimelineEvent[]) => {
    setEvents(newEvents)
    onChange(JSON.stringify(newEvents))
  }

  const updateEvent = (id: string, field: keyof TimelineEvent, value: string | null) => {
    const newEvents = events.map((event) => (event.id === id ? { ...event, [field]: value } : event))
    setEvents(newEvents)
    onChange(JSON.stringify(newEvents))
  }
  
  const addEvent = () => {
    const finalYear = newYear.trim() === "" ? "Necunoscut" : newYear.trim()

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

    const newEvent: TimelineEvent = {
      id: Date.now().toString(),
      category: finalCategory,
      year: finalYear,
      title: capitalizedTitle,
      description: "",
      characterId: newCharacterId,
    }
    updateEvents([...events, newEvent])
    setNewYear("")
    setNewTitle("")
    setExpandedId(newEvent.id)
    newYearRef.current?.focus()
  }

  const deleteEvent = (id: string) => {
    const newEvents = events.filter((event) => event.id !== id)
    updateEvents(newEvents)
    if (expandedId === id) {
      setExpandedId(null)
    }
  }
  
  const filteredEvents = useMemo(() => {
    if (!filterByCharacterId) {
      return events
    }
    if (filterByCharacterId === 'no-character') {
        return events.filter(event => event.characterId === null)
    }
    return events.filter(event => event.characterId === filterByCharacterId)
  }, [events, filterByCharacterId])


  const sortedEvents = useMemo(() => {
    const sortableEvents = [...filteredEvents]

    if (sortBy === "manual") {
        return sortableEvents
    }
    
    sortableEvents.sort((a, b) => {
      let valA: string | number
      let valB: string | number
      const isAsc = sortDirection === "asc"

      switch (sortBy) {
        case "year":
          const yearA = a.year.trim()
          const yearB = b.year.trim()

          const numA = parseInt(yearA)
          const numB = parseInt(yearB)
          
          const isNumA = !isNaN(numA)
          const isNumB = !isNaN(numB)
          
          if (isNumA && isNumB) {
            return isAsc ? numA - numB : numB - numA
          }
          if (isNumA && !isNumB) return isAsc ? -1 : 1
          if (!isNumA && isNumB) return isAsc ? 1 : -1
          
          valA = yearA === "Necunoscut" ? (isAsc ? "zzz" : "") : yearA
          valB = yearB === "Necunoscut" ? (isAsc ? "zzz" : "") : yearB
          break
        case "category":
          valA = EVENT_CATEGORIES[a.category] || a.category
          valB = EVENT_CATEGORIES[b.category] || b.category
          break
        case "character":
          valA = characterMap.get(a.characterId || '')?.name || 'zzzzzz' 
          valB = characterMap.get(b.characterId || '')?.name || 'zzzzzz'
          break
        default:
          return 0
      }

      if (typeof valA === 'string' && typeof valB === 'string') {
        return isAsc
          ? valA.localeCompare(valB) 
          : valB.localeCompare(valA)
      }
      return 0
    })

    return sortableEvents
  }, [filteredEvents, sortBy, sortDirection, characterMap])

  // 🛠️ LOGICA CORECTATĂ PENTRU MUTAREA DATELOR (D&D)
  const handleSort = () => {
    
    if (dragItem.current === null || dragOverItem.current === null || sortBy !== "manual") {
      dragItem.current = null
      dragOverItem.current = null
      return
    }
    
    const draggedEvent = sortedEvents[dragItem.current]
    const targetEvent = sortedEvents[dragOverItem.current]
    
    if (!draggedEvent || !targetEvent) return

    const draggedId = draggedEvent.id
    const targetId = targetEvent.id

    const originalEvents = [...events]
    const originalDragIndex = originalEvents.findIndex(e => e.id === draggedId)
    const originalTargetIndex = originalEvents.findIndex(e => e.id === targetId)

    if (originalDragIndex === -1 || originalTargetIndex === -1) {
      dragItem.current = null
      dragOverItem.current = null
      return
    }

    const [reorderedItem] = originalEvents.splice(originalDragIndex, 1)
    originalEvents.splice(originalTargetIndex, 0, reorderedItem)

    dragItem.current = null
    dragOverItem.current = null

    updateEvents(originalEvents)
  }
  
  // 🎨 Funcție pentru a adăuga feedback vizual la hover
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    if (sortBy !== "manual" || dragItem.current === null || dragItem.current === index) return

    if (dragOverRef.current) {
        dragOverRef.current.style.paddingTop = ""
        dragOverRef.current.style.paddingBottom = ""
    }

    dragOverItem.current = index
    dragOverRef.current = e.currentTarget

    if (dragItem.current < index) {
      e.currentTarget.style.paddingBottom = "30px" 
    } else {
      e.currentTarget.style.paddingTop = "30px" 
    }
  }

  // 🧹 Funcție pentru a șterge feedback-ul vizual la părăsirea elementului
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    if (e.relatedTarget instanceof Element && e.currentTarget.contains(e.relatedTarget)) {
      return
    }
    
    if (dragOverRef.current === e.currentTarget) {
        dragOverRef.current.style.paddingTop = ""
        dragOverRef.current.style.paddingBottom = ""
        dragOverRef.current = null
    }
  }

  // 🧼 Finalizarea drag-ului și curățarea vizualului
  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => { 
    handleSort() 
    e.currentTarget.classList.remove("opacity-50", "border-dashed", "border-primary")
    e.currentTarget.style.paddingTop = "" 
    e.currentTarget.style.paddingBottom = ""
    
    if (dragOverRef.current) {
        dragOverRef.current.style.paddingTop = ""
        dragOverRef.current.style.paddingBottom = ""
        dragOverRef.current = null
    }
  }
  // --- END D&D LOGIC & VISUAL FIX ---

  const toggleSortDirection = useCallback(() => {
    setSortDirection(prev => prev === "asc" ? "desc" : "asc")
  }, [])
  
  const handleSortByChange = useCallback((value: SortBy) => {
    setSortBy(value)
    if (value === "manual") {
        setSortDirection("asc")
    }
  }, [])

  useEffect(() => {
    const selectedEvent = events.find((event) => event.id === expandedId)
    if (selectedEvent) {
      setTempDescription(selectedEvent.description)
    } else {
      setTempDescription("")
    }
  }, [expandedId, events])

  useEffect(() => {
    if (!expandedId) return

    const selectedEvent = eventsRef.current.find((event) => event.id === expandedId)
    if (!selectedEvent || tempDescription === selectedEvent.description) {
      return
    }

    const handler = setTimeout(() => {
      const transformedText = capitalizeText(tempDescription)

      if (transformedText !== selectedEvent.description) {
        const lengthDifference = transformedText.length - tempDescription.length
        const currentStart = textareaRef.current?.selectionStart ?? tempDescription.length
        const currentEnd = textareaRef.current?.selectionEnd ?? tempDescription.length

        setCursorPosition({
          start: currentStart + lengthDifference,
          end: currentEnd + lengthDifference,
        })

        updateEvent(expandedId, "description", transformedText)
      } else {
        updateEvent(expandedId, "description", transformedText)
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

  const handleYearKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      if (newYear.trim() === "") {
        setNewYear("Necunoscut")
        newTitleRef.current?.focus()
      } else {
        newTitleRef.current?.focus()
      }
    }
  }
  
  const handleFilterChange = useCallback((value: string) => {
    setFilterByCharacterId(getFilterCharacterId(value))
  }, [])

  // --- Salvarea stărilor în localStorage ---
  
  useEffect(() => {
    if (typeof window !== "undefined") {
        const valueToStore = newCharacterId === null ? "no-character" : newCharacterId
        localStorage.setItem(LS_NEW_CHARACTER_ID_KEY, valueToStore)
    }
  }, [newCharacterId])

  useEffect(() => {
    if (typeof window !== "undefined") {
        const valueToStore = filterByCharacterId === null ? "all" : filterByCharacterId 
        localStorage.setItem(LS_FILTER_BY_CHARACTER_ID_KEY, valueToStore)
    }
  }, [filterByCharacterId])

  useEffect(() => {
    if (typeof window !== "undefined") {
        localStorage.setItem(LS_SORT_BY_KEY, sortBy)
    }
  }, [sortBy])

  useEffect(() => {
    if (typeof window !== "undefined") {
        localStorage.setItem(LS_SORT_DIRECTION_KEY, sortDirection)
    }
  }, [sortDirection])

  useEffect(() => {
    if (typeof window !== "undefined") {
        localStorage.setItem(LS_NEW_CATEGORY_KEY, newCategory)
    }
  }, [newCategory])

  useEffect(() => {
    if (typeof window !== "undefined") {
        localStorage.setItem(LS_CUSTOM_CATEGORY_KEY, customCategory)
    }
  }, [customCategory])

  useEffect(() => {
    if (typeof window !== "undefined") {
        localStorage.setItem(LS_CHARACTER_SEARCH_KEY, characterSearchTerm)
    }
  }, [characterSearchTerm])
  
  // ------------------------------------------


  return (
    <div className="space-y-4">
      <div className="flex space-x-2">
        <Select
          value={newCategory}
          onValueChange={(value: TimelineEvent["category"]) => {
            setNewCategory(value)
            setCustomCategory("")
            if (value === "custom") {
              setTimeout(() => newCustomCategoryRef.current?.focus(), 50)
            } else {
              setTimeout(() => newYearRef.current?.focus(), 50)
            }
          }}
        >
          <SelectTrigger className="w-48 h-9 text-sm flex-shrink-0">
            <SelectValue placeholder="Tip Eveniment" />
          </SelectTrigger>
          <SelectContent>
            {Object.keys(EVENT_CATEGORIES).map((key) => (
              <SelectItem key={key} value={key}>
                {EVENT_CATEGORIES[key]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {newCategory === "custom" && (
          <Input
            ref={newCustomCategoryRef}
            value={customCategory}
            onChange={(e) => setCustomCategory(e.target.value)}
            placeholder="Tip Personalizat"
            className="w-48 h-9 text-sm flex-shrink-0"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                newYearRef.current?.focus()
              }
            }}
          />
        )}
        
        <Select
          value={getSelectCharacterValue(newCharacterId)}
          onValueChange={(value) => setNewCharacterId(getStorageCharacterId(value))}
        >
          <SelectTrigger className="w-48 h-9 text-sm flex-shrink-0">
            <User className="w-4 h-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Personaj (Opțional)" />
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            <div className="sticky top-0 z-10 bg-background p-1.5">
                <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                        placeholder="Caută Personaj..."
                        className="h-8 pl-8 text-xs"
                        value={characterSearchTerm}
                        onChange={(e) => setCharacterSearchTerm(e.target.value)}
                        onKeyDown={(e) => e.stopPropagation()}
                    />
                </div>
            </div>
            
            <SelectItem value="no-character">Fără Personaj</SelectItem>
            {filteredCharacters.map((char) => (
              <SelectItem key={char.id} value={char.id}>
                {char.name}
              </SelectItem>
            ))}
            {filteredCharacters.length === 0 && characterSearchTerm.length > 0 && (
                <div className="p-2 text-center text-xs text-muted-foreground">
                    Nu a fost găsit niciun personaj.
                </div>
            )}
          </SelectContent>
        </Select>

        <Input
          ref={newYearRef}
          value={newYear}
          onChange={(e) => setNewYear(e.target.value)}
          placeholder="An/Epocă"
          className="w-40 h-9 text-sm flex-shrink-0" 
          onKeyDown={handleYearKeyDown}
        />

        <Input
          ref={newTitleRef}
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Titlu Eveniment Nou..."
          className="flex-1 h-9 text-sm"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              addEvent()
            }
          }}
        />

        <Button
          onClick={addEvent}
          disabled={!newTitle.trim() || (newYear.trim() === "" && newYear !== "Necunoscut") || (newCategory === "custom" && !customCategory.trim())}
          className="h-9 w-9 p-0 flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {events.length > 0 && (
        <div className="rounded-md border bg-muted/30 p-2 flex items-center justify-between">
          <div className="text-sm font-semibold p-2 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Evenimente Cronologice ({filteredEvents.length} din {events.length})
            
            {sortBy === "manual" && (
                <span className="text-xs font-normal text-primary ml-4">
                    (Rearanjare manuală activă - Trageți și Plasați)
                </span>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            
            <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <Select
                    value={filterByCharacterId || "all"}
                    onValueChange={handleFilterChange}
                >
                    <SelectTrigger className="w-[160px] h-8 text-xs">
                        <SelectValue placeholder="Filtrează Personaj" />
                    </SelectTrigger>
                    <SelectContent>
                        <div className="sticky top-0 z-10 bg-background p-1.5">
                            <div className="relative">
                                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                <Input
                                    placeholder="Caută Personaj..."
                                    className="h-8 pl-8 text-xs"
                                    value={characterSearchTerm}
                                    onChange={(e) => setCharacterSearchTerm(e.target.value)}
                                    onKeyDown={(e) => e.stopPropagation()}
                                />
                            </div>
                        </div>
                        
                        <SelectItem value="all">Toate Evenimentele</SelectItem>
                        <SelectItem value="no-character">Fără Personaj</SelectItem>
                        {filteredCharacters.map((char) => (
                            <SelectItem key={char.id} value={char.id}>
                                {char.name}
                            </SelectItem>
                        ))}
                        {filteredCharacters.length === 0 && characterSearchTerm.length > 0 && (
                            <div className="p-2 text-center text-xs text-muted-foreground">
                                Nu a fost găsit niciun personaj.
                            </div>
                        )}
                    </SelectContent>
                </Select>
            </div>


            <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">Sortează după:</span>
                <Select
                    value={sortBy}
                    onValueChange={handleSortByChange as (value: string) => void}
                >
                    <SelectTrigger className="w-[120px] h-8 text-xs">
                        <SelectValue placeholder="Câmp" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="manual">Manual</SelectItem> 
                        <SelectItem value="year">An/Epocă</SelectItem>
                        <SelectItem value="category">Categorie</SelectItem>
                        <SelectItem value="character">Personaj</SelectItem>
                    </SelectContent>
                </Select>
                <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={toggleSortDirection}
                    disabled={sortBy === "manual"} 
                >
                    {sortDirection === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                </Button>
            </div>
          </div>
        </div>
      )}

      {filteredEvents.length > 0 && (
        <div className="space-y-3">
          {sortedEvents.map((event, index) => (
            <Card
              key={event.id}
              className={`p-3 ${event.id === expandedId ? "border-primary shadow-lg" : ""} transition-all duration-150 cursor-default`}
              draggable={sortBy === "manual"} 
              onDragStart={(e) => { 
                if (sortBy !== "manual") return
                dragItem.current = index
                e.currentTarget.classList.add("opacity-50", "border-dashed", "border-primary")
              }}
              onDragEnter={(e) => handleDragEnter(e, index)}
              onDragLeave={handleDragLeave}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => { 
                if (sortBy === "manual") e.preventDefault() 
              }}
            >
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setExpandedId(expandedId === event.id ? null : event.id)}
                  className="p-1 flex-shrink-0"
                >
                  {expandedId === event.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                
                <span className="bg-primary/10 text-primary text-xs font-medium px-2 py-1 rounded w-48 text-center flex-shrink-0">
                  {EVENT_CATEGORIES[event.category] ? EVENT_CATEGORIES[event.category] : event.category}
                </span>

                <Input
                  value={event.year}
                  onChange={(e) => updateEvent(event.id, "year", e.target.value)}
                  placeholder="An/Epocă"
                  className="w-40 h-8 text-xs font-semibold flex-shrink-0 text-center" 
                />
                
                <span className="text-xs text-secondary-foreground px-2 py-1 rounded border w-40 flex-shrink-0 truncate">
                    {characterMap.get(event.characterId || '')?.name || 'Fără Personaj'}
                </span>
                
                <Input
                  value={event.title}
                  onChange={(e) => updateEvent(event.id, "title", e.target.value)}
                  placeholder="Titlu eveniment"
                  // AICI ESTE MODIFICAREA: w-5/12 (41.666667%) plus 2.35px
                  className="h-8 text-sm w-[calc(41.666667%_+_2.35px)] flex-shrink-0 min-w-0" 
                  onClick={() => setExpandedId(event.id)}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-destructive flex-shrink-0 ml-auto"
                  onClick={() => deleteEvent(event.id)}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>

              {expandedId === event.id && (
                <div className="mt-2 space-y-3">
                    <Select
                        value={getSelectCharacterValue(event.characterId)}
                        onValueChange={(value) => updateEvent(event.id, "characterId", getStorageCharacterId(value))}
                    >
                        <SelectTrigger className="w-48 h-9 text-sm flex-shrink-0">
                            <User className="w-4 h-4 mr-2 text-muted-foreground" />
                            <SelectValue placeholder="Personaj (Opțional)" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                            <div className="sticky top-0 z-10 bg-background p-1.5">
                                <div className="relative">
                                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                    <Input
                                        placeholder="Caută Personaj..."
                                        className="h-8 pl-8 text-xs"
                                        value={characterSearchTerm}
                                        onChange={(e) => setCharacterSearchTerm(e.target.value)}
                                        onKeyDown={(e) => e.stopPropagation()}
                                    />
                                </div>
                            </div>
                            
                            <SelectItem value="no-character">Fără Personaj</SelectItem>
                            {filteredCharacters.map((char) => (
                            <SelectItem key={char.id} value={char.id}>
                                {char.name}
                            </SelectItem>
                            ))}
                            {filteredCharacters.length === 0 && characterSearchTerm.length > 0 && (
                                <div className="p-2 text-center text-xs text-muted-foreground">
                                    Nu a fost găsit niciun personaj.
                                </div>
                            )}
                        </SelectContent>
                    </Select>
                  <Textarea
                    ref={textareaRef}
                    name={event.id}
                    value={tempDescription}
                    onChange={(e) => handleDescriptionChange(e, event.id)}
                    placeholder="Descriere detaliată a evenimentului..."
                    className="text-sm min-h-[120px]"
                    spellCheck={false}
                  />
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {filteredEvents.length === 0 && events.length > 0 && (
         <div className="text-center py-6 text-muted-foreground text-sm">
            Niciun eveniment nu se potrivește cu filtrul de personaj selectat.
         </div>
      )}
      
      {events.length === 0 && (
        <div className="text-center py-6 text-muted-foreground text-sm">
          Nu ai adăugat evenimente. Adaugă bătălii, naașteri, descoperiri sau alte momente importante din cronologia
          poveștii tale.
        </div>
      )}
    </div>
  )
}