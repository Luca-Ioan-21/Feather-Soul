// lore-editor.tsx
"use client"

import type React from "react"
import { useState, useRef, useEffect, useLayoutEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Plus, Trash2, ChevronDown, ChevronUp, Palette, Search } from "lucide-react" 
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface LoreItem {
  id: string
  name: string
  type: "object" | "magic" | "curse" | "legend" | "artifact" | "weapon" | "custom" | string
  description: string
  characterId?: string
}

interface LoreEditorProps {
  content: string
  onChange: (value: string) => void
  characters: Array<{ id: string; name: string }>
}

const LORE_TYPES: Record<string, string> = {
  object: "Obiect Cheie",
  magic: "Vrajă/Magie",
  curse: "Blestem",
  legend: "Legendă",
  artifact: "Artefact",
  weapon: "Armă",
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

const LS_PREFIX = "loreEditorState_"
const LS_SELECTED_CHARACTER_ID_KEY = LS_PREFIX + "selectedCharacterId"
const LS_NEW_TYPE_KEY = LS_PREFIX + "newType"
const LS_CUSTOM_TYPE_KEY = LS_PREFIX + "customType"
const LS_CHARACTER_SEARCH_KEY = LS_PREFIX + "characterSearchTerm"


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


export function LoreEditor({ content, onChange, characters }: LoreEditorProps) {
  // Stări inițializate din localStorage
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>(
    () => getInitialState(LS_SELECTED_CHARACTER_ID_KEY, "general")
  )
  const [characterSearchTerm, setCharacterSearchTerm] = useState<string>(
    () => getInitialState(LS_CHARACTER_SEARCH_KEY, "")
  ) 

  const [items, setItems] = useState<LoreItem[]>(() => {
    try {
      const parsedContent = JSON.parse(content)
      return parsedContent.map((item: any) => ({
        ...item,
        type: item.type || "object",
        characterId: item.characterId || "general",
      }))
    } catch {
      return []
    }
  })

  const itemsRef = useRef(items)
  itemsRef.current = items

  const [newItemName, setNewItemName] = useState("")
  // Stări inițializate din localStorage
  const [newType, setNewType] = useState<LoreItem["type"]>(
    () => getInitialState<LoreItem["type"]>(LS_NEW_TYPE_KEY, "object")
  )
  const [customType, setCustomType] = useState(
    () => getInitialState(LS_CUSTOM_TYPE_KEY, "")
  )

  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [tempDescription, setTempDescription] = useState("")
  const [cursorPosition, setCursorPosition] = useState<{ start: number; end: number } | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const newItemNameRef = useRef<HTMLInputElement>(null)
  const newCustomTypeRef = useRef<HTMLInputElement>(null)

  // Ref-uri pentru Drag & Drop (D&D) și feedback vizual
  const dragItem = useRef<number | null>(null) 
  const dragOverItem = useRef<number | null>(null) 
  const dragOverRef = useRef<HTMLElement | null>(null) 

  const updateItems = (newItems: LoreItem[]) => {
    setItems(newItems)
    onChange(JSON.stringify(newItems))
  }

  const updateItem = (id: string, field: keyof LoreItem, value: string | string[]) => {
    const newItems = items.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    setItems(newItems)
    onChange(JSON.stringify(newItems))
  }

  const addItem = () => {
    if (!newItemName.trim()) {
      newItemNameRef.current?.focus()
      return
    }

    let finalType: string

    if (newType === "custom") {
      if (!customType.trim()) {
        newCustomTypeRef.current?.focus()
        return
      }
      finalType = capitalizeText(customType)
    } else {
      finalType = newType
    }

    const capitalizedName = capitalizeText(newItemName)

    const newItem: LoreItem = {
      id: Date.now().toString(),
      name: capitalizedName,
      type: finalType,
      description: "",
      characterId: selectedCharacterId,
    }
    updateItems([...items, newItem])
    setNewItemName("")
    // Nu resetam newType/customType pentru a persista selectia
    setExpandedId(newItem.id)
    newItemNameRef.current?.focus()
  }

  const deleteItem = (id: string) => {
    const newItems = items.filter((item) => item.id !== id)
    updateItems(newItems)
    if (expandedId === id) {
      setExpandedId(null)
    }
  }

  // 🛠️ LOGICA CORECTATĂ PENTRU MUTAREA DATELOR (funcțională indiferent de filtru)
  const handleSort = () => {
    if (dragItem.current === null || dragOverItem.current === null) return
    
    // 1. Găsim ID-urile elementelor din lista FILTERED ITEMS (vizibilă)
    const draggedItem = filteredItems[dragItem.current]
    const targetItem = filteredItems[dragOverItem.current]
    
    if (!draggedItem || !targetItem) return

    const draggedId = draggedItem.id
    const targetId = targetItem.id

    // 2. Găsim pozițiile acestor ID-uri în lista ORIGINALĂ (items)
    const originalItems = [...items]
    const originalDragIndex = originalItems.findIndex(i => i.id === draggedId)
    const originalTargetIndex = originalItems.findIndex(i => i.id === targetId)

    if (originalDragIndex === -1 || originalTargetIndex === -1) {
      dragItem.current = null
      dragOverItem.current = null
      return
    }

    // 3. Mutăm elementul în lista originală
    const [reorderedItem] = originalItems.splice(originalDragIndex, 1)
    originalItems.splice(originalTargetIndex, 0, reorderedItem)

    // 4. Resetăm
    dragItem.current = null
    dragOverItem.current = null

    // 5. Actualizăm starea
    updateItems(originalItems)
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
        e.currentTarget.style.paddingBottom = ""
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
    const selectedItem = items.find((item) => item.id === expandedId)
    if (selectedItem) {
      setTempDescription(selectedItem.description)
    } else {
      setTempDescription("")
    }
  }, [expandedId, items])

  useEffect(() => {
    if (!expandedId) return

    const selectedItem = itemsRef.current.find((item) => item.id === expandedId)
    if (!selectedItem || tempDescription === selectedItem.description) {
      return
    }

    const handler = setTimeout(() => {
      const transformedText = capitalizeText(tempDescription)

      if (transformedText !== selectedItem.description) {
        const lengthDifference = transformedText.length - tempDescription.length
        const currentStart = textareaRef.current?.selectionStart ?? tempDescription.length
        const currentEnd = textareaRef.current?.selectionEnd ?? tempDescription.length

        setCursorPosition({
          start: currentStart + lengthDifference,
          end: currentEnd + lengthDifference,
        })

        updateItem(expandedId, "description", transformedText)
      } else {
        updateItem(expandedId, "description", transformedText)
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

  const filteredItems = items.filter((item) => item.characterId === selectedCharacterId)

  // Logica de filtrare a personajelor
  const lowerCaseSearchTerm = characterSearchTerm.toLowerCase()
  const filteredCharacters = characters.filter((c) =>
    c.name.toLowerCase().includes(lowerCaseSearchTerm)
  )

  // --- Salvarea stărilor în localStorage ---

  // Salvează ID-ul personajului selectat (pentru filtrare)
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(LS_SELECTED_CHARACTER_ID_KEY, selectedCharacterId)
    }
  }, [selectedCharacterId])
  
  // Salvează termenul de căutare a personajelor
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(LS_CHARACTER_SEARCH_KEY, characterSearchTerm)
    }
  }, [characterSearchTerm])
  
  // Salvează tipul nou de element (pentru adăugare)
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(LS_NEW_TYPE_KEY, newType)
    }
  }, [newType])
  
  // Salvează tipul personalizat (pentru adăugare)
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(LS_CUSTOM_TYPE_KEY, customType)
    }
  }, [customType])
  
  // ------------------------------------------


  return (
    <div className="space-y-4">
      <div className="flex space-x-2">
        <Select
          value={newType}
          onValueChange={(value: LoreItem["type"]) => {
            setNewType(value)
            setCustomType("")
            if (value === "custom") {
              setTimeout(() => newCustomTypeRef.current?.focus(), 50)
            } else {
              setTimeout(() => newItemNameRef.current?.focus(), 50)
            }
          }}
        >
          <SelectTrigger className="w-48 h-9 text-sm flex-shrink-0">
            <SelectValue placeholder="Tip Element" />
          </SelectTrigger>
          <SelectContent>
            {Object.keys(LORE_TYPES).map((key) => (
              <SelectItem key={key} value={key}>
                {LORE_TYPES[key]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {newType === "custom" && (
          <Input
            ref={newCustomTypeRef}
            value={customType}
            onChange={(e) => setCustomType(e.target.value)}
            placeholder="Tip Personalizat"
            className="w-48 h-9 text-sm flex-shrink-0"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                newItemNameRef.current?.focus()
              }
            }}
          />
        )}

        <Input
          ref={newItemNameRef}
          value={newItemName}
          onChange={(e) => setNewItemName(e.target.value)}
          placeholder="Nume Element Nou..."
          className="h-9 text-sm flex-1"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              addItem()
            }
          }}
        />

        <Button
          onClick={addItem}
          disabled={!newItemName.trim() || (newType === "custom" && !customType.trim())}
          className="h-9 w-9 p-0 flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {items.length > 0 && (
        <div className="rounded-md border bg-muted/30 p-2">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold p-2 flex items-center gap-2">
              <Palette className="w-4 h-4" />
              {selectedCharacterId === "general" ? (
                <>General - Lumea Poveștii ({filteredItems.length})</>
              ) : (
                <>
                  {characters.find((c) => c.id === selectedCharacterId)?.name} ({filteredItems.length})
                </>
              )}
              {/* Adăugat indicatorul de rearanjare manuală */}
              <span className="text-xs font-normal text-primary ml-4">
                (Rearanjare manuală activă - Trageți și Plasați)
              </span>
            </div>
            {/* Componenta Select Personaj */}
            <Select value={selectedCharacterId} onValueChange={setSelectedCharacterId}>
              <SelectTrigger className="w-56 h-8 text-xs">
                <SelectValue placeholder="Selectează Personaj sau General" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {/* Câmpul de căutare adăugat aici */}
                <div className="sticky top-0 z-10 bg-background p-1.5">
                    <div className="relative">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                            placeholder="Caută Personaj..."
                            className="h-8 pl-8 text-xs"
                            value={characterSearchTerm}
                            onChange={(e) => setCharacterSearchTerm(e.target.value)}
                            // Oprim propagarea evenimentelor pentru a nu închide Select-ul la tastare
                            onKeyDown={(e) => e.stopPropagation()}
                        />
                    </div>
                </div>
                
                <SelectItem value="general">General (Lumea Poveștii)</SelectItem>
                {/* Folosim lista filtrată de personaje */}
                {filteredCharacters.map((character) => (
                  <SelectItem key={character.id} value={character.id}>
                    {character.name}
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
        </div>
      )}

      {filteredItems.length > 0 && (
        <div className="space-y-3">
          {filteredItems.map((item, index) => {
            return (
              <Card
                key={item.id}
                className={`p-3 ${item.id === expandedId ? "border-primary shadow-lg" : ""} transition-all duration-150`} 
                draggable
                onDragStart={(e) => {
                    dragItem.current = index
                    e.currentTarget.classList.add("opacity-50", "border-dashed", "border-primary")
                }}
                onDragEnter={(e) => handleDragEnter(e, index)}
                onDragLeave={handleDragLeave}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => e.preventDefault()}
              >
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                    className="p-1 flex-shrink-0"
                  >
                    {expandedId === item.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  <span className="bg-primary/10 text-primary text-xs font-medium px-2 py-1 rounded w-48 text-center flex-shrink-0">
                    {LORE_TYPES[item.type] ? LORE_TYPES[item.type] : item.type}
                  </span>
                  <Input
                    value={item.name}
                    onChange={(e) => updateItem(item.id, "name", e.target.value)}
                    placeholder="Nume"
                    className="h-8 text-sm w-2/3 flex-shrink-0 min-w-0" 
                    // CORECȚIE: S-a înlocuit 'idea.id' cu 'item.id' și s-a păstrat funcționalitatea
                    onClick={() => setExpandedId(item.id)} 
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    // PĂSTRAT: ml-auto pentru a împinge butonul la marginea dreaptă.
                    className="h-6 w-6 text-destructive flex-shrink-0 ml-auto"
                    // CORECȚIE: S-a înlocuit 'deleteIdea(idea.id)' cu 'deleteItem(item.id)'
                    onClick={() => deleteItem(item.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>

                {expandedId === item.id && (
                  <div className="mt-2 space-y-3">
                    <Textarea
                      ref={textareaRef}
                      name={item.id}
                      value={tempDescription}
                      onChange={(e) => handleDescriptionChange(e, item.id)}
                      placeholder="Descriere detaliată a elementului..."
                      className="text-sm min-h-[120px]"
                      spellCheck={false}
                    />
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {filteredItems.length === 0 && items.length > 0 && (
        <div className="text-center py-6 text-muted-foreground text-sm">
          {selectedCharacterId === "general"
            ? "Nu ai adăugat elemente generale."
            : `Nu ai adăugat elemente pentru ${characters.find((c) => c.id === selectedCharacterId)?.name}.`}
        </div>
      )}
      
      {filteredItems.length === 0 && items.length === 0 && (
        <div className="text-center py-6 text-muted-foreground text-sm">
          Nu ai adăugat elemente. Adaugă obiecte cheie, vrăji, blesteme, artefacte sau arme pentru lumea poveștii.
        </div>
      )}
    </div>
  )
}