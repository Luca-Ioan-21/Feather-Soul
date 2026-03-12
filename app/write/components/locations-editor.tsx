// locations-editor.tsx
"use client"

import type React from "react"
import { useState, useRef, useEffect, useLayoutEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Plus, Trash2, ChevronDown, ChevronUp, MapPin } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Location {
  id: string
  category: "city" | "village" | "castle" | "forest" | "mountain" | "sea" | "custom" | string
  name: string
  description: string
}

interface LocationsEditorProps {
  content: string
  onChange: (value: string) => void
}

const LOCATION_CATEGORIES: Record<string, string> = {
  kingdom: "Regat", // ADAUGAT: Categoria "Regat"
  city: "Oraș",
  village: "Sat",
  castle: "Castel/Palat",
  forest: "Pădure",
  mountain: "Munte",
  sea: "Mare/Ocean",
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

const LS_PREFIX = "locationsEditorState_"
const LS_NEW_CATEGORY_KEY = LS_PREFIX + "newCategory"
const LS_CUSTOM_CATEGORY_KEY = LS_PREFIX + "customCategory"
const LS_SELECTED_CATEGORY_KEY = LS_PREFIX + "selectedCategory"

/**
 * Citeste o valoare din localStorage sau returneaza o valoare implicita.
 */
const getInitialState = <T>(key: string, defaultValue: T): T => {
  if (typeof window !== "undefined") {
    try {
        const storedValue = localStorage.getItem(key)
        if (storedValue !== null) {
            return storedValue as T
        }
    } catch (e) {
        console.error("Eroare la citirea localStorage:", e)
    }
  }
  return defaultValue
}
// ----------------------------------------------


export function LocationsEditor({ content, onChange }: LocationsEditorProps) {
  const [locations, setLocations] = useState<Location[]>(() => {
    try {
      const parsedContent = JSON.parse(content)
      return parsedContent.map((item: any) => ({
        ...item,
        category: item.category || "city",
      }))
    } catch {
      return []
    }
  })

  const locationsRef = useRef(locations)
  locationsRef.current = locations

  const [newName, setNewName] = useState("")
  
  // MODIFICAT: Inițializare din localStorage
  const [newCategory, setNewCategory] = useState<Location["category"]>(
    () => getInitialState<Location["category"]>(LS_NEW_CATEGORY_KEY, "city")
  )
  
  // MODIFICAT: Inițializare din localStorage
  const [customCategory, setCustomCategory] = useState(
    () => getInitialState(LS_CUSTOM_CATEGORY_KEY, "")
  )

  // MODIFICAT: Inițializare din localStorage
  const [selectedCategory, setSelectedCategory] = useState<string>(
    () => getInitialState(LS_SELECTED_CATEGORY_KEY, "all")
  )

  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [tempDescription, setTempDescription] = useState("")
  const [cursorPosition, setCursorPosition] = useState<{ start: number; end: number } | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const newNameRef = useRef<HTMLInputElement>(null)
  const newCustomCategoryRef = useRef<HTMLInputElement>(null)

  // Ref-uri pentru Drag & Drop (D&D) și feedback vizual
  const dragItem = useRef<number | null>(null) 
  const dragOverItem = useRef<number | null>(null) 
  const dragOverRef = useRef<HTMLElement | null>(null) 

  const filteredLocations = locations.filter((loc) => {
    if (selectedCategory === "all") return true
    return loc.category === selectedCategory 
  })

  // Colectăm categorii unice, inclusiv cele custom, pentru meniul de filtrare
  const uniqueCategories = Array.from(new Set(locations.map((loc) => loc.category)))

  const updateLocations = (newLocations: Location[]) => {
    setLocations(newLocations)
    onChange(JSON.stringify(newLocations))
  }

  const updateLocation = (id: string, field: keyof Location, value: string) => {
    const newLocations = locations.map((loc) => (loc.id === id ? { ...loc, [field]: value } : loc))
    setLocations(newLocations)
    onChange(JSON.stringify(newLocations))
  }

  const addLocation = () => {
    if (!newName.trim()) {
      newNameRef.current?.focus()
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

    const capitalizedName = capitalizeText(newName)

    const newLocation: Location = {
      id: Date.now().toString(),
      category: finalCategory,
      name: capitalizedName,
      description: "",
    }
    updateLocations([...locations, newLocation])
    setNewName("")
    // NOTĂ: Nu mai resetăm newCategory și customCategory pentru a menține persistența.
    setExpandedId(newLocation.id)
    newNameRef.current?.focus()
  }

  const deleteLocation = (id: string) => {
    const newLocations = locations.filter((loc) => loc.id !== id)
    updateLocations(newLocations)
    if (expandedId === id) {
      setExpandedId(null)
    }
  }

  // 🛠️ LOGICA CORECTATĂ PENTRU MUTAREA DATELOR (D&D)
  const handleSort = () => {
    if (dragItem.current === null || dragOverItem.current === null) return
    
    const draggedLocation = filteredLocations[dragItem.current]
    const targetLocation = filteredLocations[dragOverItem.current]
    
    if (!draggedLocation || !targetLocation) return

    const draggedId = draggedLocation.id
    const targetId = targetLocation.id

    const originalLocations = [...locations]
    const originalDragIndex = originalLocations.findIndex(loc => loc.id === draggedId)
    const originalTargetIndex = originalLocations.findIndex(loc => loc.id === targetId)

    if (originalDragIndex === -1 || originalTargetIndex === -1) {
      dragItem.current = null
      dragOverItem.current = null
      return
    }

    const [reorderedItem] = originalLocations.splice(originalDragIndex, 1)
    originalLocations.splice(originalTargetIndex, 0, reorderedItem)

    dragItem.current = null
    dragOverItem.current = null

    updateLocations(originalLocations)
  }

  // 🎨 Funcție pentru a adăuga feedback vizual la hover
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    if (dragItem.current === null || dragItem.current === index) return

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
        e.currentTarget.style.paddingTop = ""
        dragOverRef.current.style.paddingBottom = ""
        dragOverRef.current = null
    }
  }

  // 🧼 Finalizarea drag-ului și curățarea vizualului
  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => { 
    handleSort() 
    e.currentTarget.classList.remove("opacity-50", "border-dashed", "border-primary")
    if (dragOverRef.current) {
        dragOverRef.current.style.paddingTop = ""
        dragOverRef.current.style.paddingBottom = ""
        dragOverRef.current = null
    }
  }
  // --- END D&D LOGIC & VISUAL FIX ---

  useEffect(() => {
    const selectedLocation = locations.find((loc) => loc.id === expandedId)
    if (selectedLocation) {
      setTempDescription(selectedLocation.description)
    } else {
      setTempDescription("")
    }
  }, [expandedId, locations])

  useEffect(() => {
    if (!expandedId) return

    const selectedLocation = locationsRef.current.find((loc) => loc.id === expandedId)
    if (!selectedLocation || tempDescription === selectedLocation.description) {
      return
    }

    const handler = setTimeout(() => {
      const transformedText = capitalizeText(tempDescription)

      if (transformedText !== selectedLocation.description) {
        const lengthDifference = transformedText.length - tempDescription.length
        const currentStart = textareaRef.current?.selectionStart ?? tempDescription.length
        const currentEnd = textareaRef.current?.selectionEnd ?? tempDescription.length

        setCursorPosition({
          start: currentStart + lengthDifference,
          end: currentEnd + lengthDifference,
        })

        updateLocation(expandedId, "description", transformedText)
      } else {
        updateLocation(expandedId, "description", transformedText)
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
    <div className="space-y-4">
      <div className="flex space-x-2">
        <Select
          value={newCategory}
          onValueChange={(value: Location["category"]) => {
            setNewCategory(value)
            setCustomCategory("")
            if (value === "custom") {
              setTimeout(() => newCustomCategoryRef.current?.focus(), 50)
            } else {
              setTimeout(() => newNameRef.current?.focus(), 50)
            }
          }}
        >
          <SelectTrigger className="w-48 h-9 text-sm flex-shrink-0">
            <SelectValue placeholder="Categorie" />
          </SelectTrigger>
          <SelectContent>
            {Object.keys(LOCATION_CATEGORIES).map((key) => (
              <SelectItem key={key} value={key}>
                {LOCATION_CATEGORIES[key]}
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
                newNameRef.current?.focus()
              }
            }}
          />
        )}

        <Input
          ref={newNameRef}
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Nume Locație Nouă..."
          className="h-9 text-sm flex-1"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              addLocation()
            }
          }}
        />

        <Button
          onClick={addLocation}
          disabled={!newName.trim() || (newCategory === "custom" && !customCategory.trim())}
          className="h-9 w-9 p-0 flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {locations.length > 0 && (
        <div className="rounded-md border bg-muted/30 p-2">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold p-2 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              {selectedCategory === "all" ? (
                <>Toate Locațiile ({locations.length})</>
              ) : (
                <>
                  {LOCATION_CATEGORIES[selectedCategory] || selectedCategory} ({filteredLocations.length})
                </>
              )}
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-56 h-8 text-xs">
                <SelectValue placeholder="Filtrează după categorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toate Categoriile</SelectItem>
                {/* Afișează toate categoriile unice, inclusiv cele custom, în meniul de filtrare */}
                {uniqueCategories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {LOCATION_CATEGORIES[cat] || cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {filteredLocations.length > 0 && (
        <div className="space-y-3">
          {filteredLocations.map((location, index) => (
            <Card
              key={location.id}
              className={`p-3 ${location.id === expandedId ? "border-primary shadow-lg" : ""} transition-all duration-150`}
              draggable
              onDragStart={(e) => {
                dragItem.current = index
                // Adăugăm feedback vizual la începutul tragerii
                e.currentTarget.classList.add("opacity-50", "border-dashed", "border-primary")
              }}
              onDragEnter={(e) => handleDragEnter(e, index)}
              onDragLeave={handleDragLeave}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => e.preventDefault()}
            >
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setExpandedId(expandedId === location.id ? null : location.id)}
                  className="p-1 flex-shrink-0"
                >
                  {expandedId === location.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                <span className="bg-primary/10 text-primary text-xs font-medium px-2 py-1 rounded w-48 text-center flex-shrink-0">
                  {LOCATION_CATEGORIES[location.category] ? LOCATION_CATEGORIES[location.category] : location.category}
                </span>
                <Input
                  value={location.name}
                  onChange={(e) => updateLocation(location.id, "name", e.target.value)}
                  placeholder="Nume locație"
                  className="h-8 text-sm w-2/3 flex-shrink-0 min-w-0"
                  onClick={() => setExpandedId(location.id)}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  // PĂSTRAT: ml-auto pentru a împinge butonul la marginea dreaptă.
                  className="h-6 w-6 text-destructive flex-shrink-0 ml-auto"
                  onClick={() => deleteLocation(location.id)} // CORECTAT
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>

              {expandedId === location.id && (
                <div className="mt-2 space-y-3">
                  <Textarea
                    ref={textareaRef}
                    name={location.id}
                    value={tempDescription}
                    onChange={(e) => handleDescriptionChange(e, location.id)}
                    placeholder="Descriere detaliată a locației..."
                    className="text-sm min-h-[120px]"
                    spellCheck={false}
                  />
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {locations.length === 0 && (
        <div className="text-center py-6 text-muted-foreground text-sm">
          Nu ai adăugat locații. Adaugă orașe, castele, păduri sau alte locații importante pentru povestea ta.
        </div>
      )}
    </div>
  )
}