"use client"

import type React from "react"
import { useState, useRef, useMemo, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Search,
  Plus,
  Pin,
  Trash2,
  Crown,
  User,
  Skull,
  Heart,
  Users,
  X,
  ArrowUp,
  ArrowDown,
  HelpCircle,
  Book,
  BookOpen,
  ChevronRight,
  Pencil, // Iconiță pentru editare
  Save,   // Iconiță pentru salvare
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"

// Definiția câmpurilor pe care se poate sorta
type SortKey =
  | "name"
  | "age"
  | "powers"
  | "role"
  | "socialRank"
  | "status"
  | "gender"
  | "isAlive"
  | "importance"
  | "none"
type SortDirection = "asc" | "desc"
type AliveStatus = "alive" | "dead" | "unknown"
type Gender = "male" | "female" | "anonymous"

// --- CHEILE PENTRU LOCAL STORAGE (Doar setări UI, nu date) ---
const LS_GLOBAL_PIN_KEY = "globalPinActive"
const LS_SORT_KEY = "characterSortKey"
const LS_SORT_DIRECTION = "characterSortDirection"

// --- INTERFAȚĂ PENTRU DEFINIȚII (EXPORTATĂ) ---
export interface TermDefinition {
  id: string
  term: string
  definition: string
}

// --- FUNCȚII UTILITARE PENTRU LOCAL STORAGE ---
const getLocalStorageItem = (key: string, defaultValue: any) => {
  if (typeof window === "undefined") return defaultValue
  try {
    const item = window.localStorage.getItem(key)
    if (item === null) return defaultValue
    if (defaultValue === true || defaultValue === false) {
      return item === "true"
    }
    try {
      return JSON.parse(item)
    } catch {
      return item
    }
  } catch (error) {
    console.error("Error reading localStorage key “" + key + "”:", error)
    return defaultValue
  }
}

const setLocalStorageItem = (key: string, value: any) => {
  if (typeof window === "undefined") return
  try {
    const valueToStore = typeof value === "string" ? value : JSON.stringify(value)
    window.localStorage.setItem(key, valueToStore)
  } catch (error) {
    console.error("Error setting localStorage key “" + key + "”:", error)
  }
}

const toTitleCase = (str: string) => {
  if (!str) return ""
  return str.replace(/\b\w/g, (char) => char.toUpperCase());
}

const ROLE_OPTIONS_BASE = [
  { value: "protagonist", label: "Protagonist/ă" },
  { value: "antagonist", label: "Antagonist/ă" },
  { value: "secondary", label: "Secundar" },
  { value: "mentor", label: "Mentor" },
  { value: "foil", label: "Foil (Oglindă)" },
]
const ROLE_OPTIONS = [...ROLE_OPTIONS_BASE, { value: "custom_role", label: "Altele (Personalizat)" }]

const STATUS_OPTIONS_BASE = [
  { value: "royal", label: "Regalitate" },
  { value: "monarch", label: "Monarh/Conducător" },
  { value: "noble", label: "Nobil" },
  { value: "commoner", label: "Țăran/Om de rând" },
  { value: "slave", label: "Sclav" },
  { value: "pupil", label: "Pupil" },
  { value: "monster", label: "Monstru/Creatură" },
  { value: "exile", label: "Exilat" },
]
const STATUS_OPTIONS = [...STATUS_OPTIONS_BASE, { value: "custom_status", label: "Altele (Personalizat)" }]

const ALIVE_OPTIONS: { value: AliveStatus; label: string }[] = [
  { value: "alive", label: "Viu" },
  { value: "dead", label: "Mort" },
  { value: "unknown", label: "Necunoscut" },
]

const GENDER_OPTIONS: { value: Gender; label: string; icon: string }[] = [
  { value: "male", label: "Băiat", icon: "♂" },
  { value: "female", label: "Fată", icon: "♀" },
  { value: "anonymous", label: "Anonim", icon: "?" },
]

export interface Character {
  id: string
  name: string
  age: string
  powers: string
  characteristics: string
  status: "good" | "evil" | "neutral"
  importance: "important" | "common"
  role: string
  socialRank: string
  isAlive: "alive" | "dead" | "unknown" | boolean 
  gender?: Gender 
}

interface CharacterReferenceTableProps {
  characters: Character[]
  setCharacters: React.Dispatch<React.SetStateAction<Character[]>>
  // 🟢 PROPS NOI PENTRU DICȚIONAR
  dictionary: TermDefinition[]
  setDictionary: React.Dispatch<React.SetStateAction<TermDefinition[]>>
}

export const CharacterReferenceTable: React.FC<CharacterReferenceTableProps> = ({ 
    characters, 
    setCharacters,
    dictionary,      // Primim dicționarul curent din părinte
    setDictionary    // Funcția de update din părinte
}) => {
  const newCharacterTemplate: Character = {
    id: Date.now().toString(),
    name: "",
    age: "",
    powers: "",
    characteristics: "",
    status: "neutral",
    importance: "common",
    role: "secondary",
    socialRank: "commoner",
    isAlive: "alive", 
    gender: "anonymous", 
  }

  const [isAdding, setIsAdding] = useState(false)
  const [newCharacter, setNewCharacter] = useState<Character>(newCharacterTemplate)
  const [characterSearchQuery, setCharacterSearchQuery] = useState("")

  const [sortKey, setSortKey] = useState<SortKey>(
    getLocalStorageItem(LS_SORT_KEY, "age") as SortKey, 
  )
  const [sortDirection, setSortDirection] = useState<SortDirection>(
    getLocalStorageItem(LS_SORT_DIRECTION, "asc") as SortDirection, 
  )

  const [isGlobalPinActive, setIsGlobalPinActive] = useState(
    getLocalStorageItem(LS_GLOBAL_PIN_KEY, false) as boolean, 
  )

  // --- STARE PENTRU DICȚIONAR (Doar UI, datele vin prin props) ---
  const [isDictionaryOpen, setIsDictionaryOpen] = useState(false)
  
  // Stare pentru Adăugare
  const [newTerm, setNewTerm] = useState("")
  const [newDefinition, setNewDefinition] = useState("")
  
  // Stare pentru Editare
  const [isEditingDefinition, setIsEditingDefinition] = useState(false)
  const [editTermValue, setEditTermValue] = useState("")
  const [editDefinitionValue, setEditDefinitionValue] = useState("")

  // Stare pentru Layout Split (Selectare Termen vs Adăugare)
  const [selectedTermId, setSelectedTermId] = useState<string | null>(null)
  
  // Stare pentru Căutare în Dicționar
  const [dictionarySearch, setDictionarySearch] = useState("")

  const [isDeleteConfirmDialogOpen, setIsDeleteConfirmDialogOpen] = useState(false)
  const [characterToDelete, setCharacterToDelete] = useState<Character | null>(null)

  const newNameInputRef = useRef<HTMLInputElement>(null)
  const newAgeInputRef = useRef<HTMLInputElement>(null)
  const newPowersInputRef = useRef<HTMLInputElement>(null)

  const [draggedCharacterId, setDraggedCharacterId] = useState<string | null>(null)
  const [dragOverCharacterId, setDragOverCharacterId] = useState<string | null>(null)

  const [isCustomRoleDialogOpen, setIsCustomRoleDialogOpen] = useState(false)
  const [isCustomStatusDialogOpen, setIsCustomStatusDialogOpen] = useState(false)
  const [editingCharacterId, setEditingCharacterId] = useState<string | null>(null)
  const [tempCustomValue, setTempCustomValue] = useState("")

  const getRoleLabel = (roleValue: string) => {
    const option = ROLE_OPTIONS_BASE.find((opt) => opt.value === roleValue)
    return option ? option.label : roleValue || "Secundar"
  }

  const getStatusLabel = (statusValue: string) => {
    const option = STATUS_OPTIONS_BASE.find((opt) => opt.value === statusValue)
    return option ? option.label : statusValue || "Țăran/Om de rând"
  }

  const openCustomValueDialog = (id: string, field: "role" | "socialRank") => {
    const character = characters.find((c) => c.id === id) || newCharacter
    const currentValue = character[field] as string

    setEditingCharacterId(id)
    setTempCustomValue(
      (field === "role" && !ROLE_OPTIONS_BASE.some((opt) => opt.value === currentValue)) ||
        (field === "socialRank" && !STATUS_OPTIONS_BASE.some((opt) => opt.value === currentValue))
        ? currentValue
        : "",
    )

    if (field === "role") {
      setIsCustomRoleDialogOpen(true)
    } else {
      setIsCustomStatusDialogOpen(true)
    }
  }

  const handleSaveCustomValue = (field: "role" | "socialRank") => {
    const valueToSave = toTitleCase(tempCustomValue.trim())

    if (editingCharacterId === "new") {
      handleNewInputChange(field, valueToSave || newCharacterTemplate[field as keyof typeof newCharacterTemplate])
    } else if (editingCharacterId) {
      handleUpdateCharacter(
        editingCharacterId,
        field,
        valueToSave || newCharacterTemplate[field as keyof typeof newCharacterTemplate],
      )
    }

    setTempCustomValue("")
    setEditingCharacterId(null)
    setIsCustomRoleDialogOpen(false)
    setIsCustomStatusDialogOpen(false)
  }

  const toggleSortDirection = useCallback(() => {
    setSortDirection((prev) => {
      const newDirection = prev === "asc" ? "desc" : "asc"
      setLocalStorageItem(LS_SORT_DIRECTION, newDirection)
      return newDirection
    })
  }, [])

  const handleSortKeyChange = (value: SortKey) => {
    setSortKey(value)
    setLocalStorageItem(LS_SORT_KEY, value)
  }

  useEffect(() => {
    setLocalStorageItem(LS_GLOBAL_PIN_KEY, isGlobalPinActive)
  }, [isGlobalPinActive])

  // --- LOGICĂ DICȚIONAR ---
  
  // Reset edit mode when changing selection
  useEffect(() => {
    setIsEditingDefinition(false)
    setEditTermValue("")
    setEditDefinitionValue("")
  }, [selectedTermId])

  const handleAddDefinition = () => {
    if (!newTerm.trim() || !newDefinition.trim()) return

    const newEntry: TermDefinition = {
        id: Date.now().toString(),
        term: toTitleCase(newTerm.trim()),
        definition: newDefinition.trim()
    }
    
    // 🟢 Folosim setDictionary din props, nu state local
    setDictionary(prev => [newEntry, ...prev])
    setNewTerm("")
    setNewDefinition("")
    setSelectedTermId(newEntry.id)
  }

  const handleDeleteDefinition = (id: string) => {
      // 🟢 Folosim setDictionary din props
      setDictionary(prev => prev.filter(def => def.id !== id))
      if (selectedTermId === id) {
          setSelectedTermId(null)
      }
  }

  // LOGICĂ EDITARE DICȚIONAR
  const handleStartEdit = (def: TermDefinition) => {
    setEditTermValue(def.term)
    setEditDefinitionValue(def.definition)
    setIsEditingDefinition(true)
  }

  const handleSaveEdit = () => {
    if (!selectedTermId || !editTermValue.trim() || !editDefinitionValue.trim()) return

    // 🟢 Folosim setDictionary din props
    setDictionary(prev => prev.map(def => {
      if (def.id === selectedTermId) {
        return {
          ...def,
          term: toTitleCase(editTermValue.trim()),
          definition: editDefinitionValue.trim()
        }
      }
      return def
    }))
    setIsEditingDefinition(false)
  }

  const handleCancelEdit = () => {
    setIsEditingDefinition(false)
    setEditTermValue("")
    setEditDefinitionValue("")
  }

  // Filtrare termeni (folosind dictionary din props)
  const filteredDefinitions = useMemo(() => {
      if (!dictionarySearch.trim()) return dictionary;
      return dictionary.filter(d => d.term.toLowerCase().includes(dictionarySearch.toLowerCase()))
  }, [dictionary, dictionarySearch]);

  const selectedDefinition = dictionary.find(d => d.id === selectedTermId);
  // ------------------------

  const filteredCharacters = useMemo(() => {
    let currentCharacters = [...characters]

    if (sortKey !== "none" && sortKey !== "characteristics") {
      currentCharacters.sort((a, b) => {
        let comparison = 0

        if (sortKey === "age") {
          const numA = Number.parseInt(String(a.age)) || 0
          const numB = Number.parseInt(String(b.age)) || 0
          comparison = numA - numB
        } else if (sortKey === "isAlive") {
          const order: Record<AliveStatus | (boolean & string), number> = {
            alive: 3,
            unknown: 2,
            dead: 1,
            true: 3,
            false: 1,
          }
          const statusA =
            String(a.isAlive) === "true" ? "alive" : String(a.isAlive) === "false" ? "dead" : (a.isAlive as AliveStatus)
          const statusB =
            String(b.isAlive) === "true" ? "alive" : String(b.isAlive) === "false" ? "dead" : (b.isAlive as AliveStatus)
          comparison = order[statusA] - order[statusB]
        } else if (sortKey === "gender") {
          const order: Record<Gender, number> = { male: 3, female: 2, anonymous: 1 }
          const genderA = (a.gender || "anonymous") as Gender
          const genderB = (b.gender || "anonymous") as Gender
          comparison = order[genderA] - order[genderB]
        } else {
          const valA = String(a[sortKey as keyof Character]).toLowerCase()
          const valB = String(b[sortKey as keyof Character]).toLowerCase()

          if (valA > valB) {
            comparison = 1
          } else if (valA < valB) {
            comparison = -1
          }
        }

        return sortDirection === "desc" ? comparison * -1 : comparison
      })
    }

    if (characterSearchQuery.trim()) {
      const query = characterSearchQuery.toLowerCase().trim()
      currentCharacters = currentCharacters.filter((c) => c.name.toLowerCase().includes(query))
    }

    return currentCharacters
  }, [characters, characterSearchQuery, sortKey, sortDirection])

  const getStatusColor = (status: Character["status"]) => {
    switch (status) {
      case "good":
        return "text-green-600 border-green-300"
      case "evil":
        return "text-red-600 border-red-300"
      case "neutral":
      default:
        return "text-gray-600 border-gray-300"
    }
  }

  const renderCharacterIcon = (importance: Character["importance"]) => {
    return importance === "important" ? (
      <Crown className="w-4 h-4 text-amber-500" title="Important character" />
    ) : (
      <User className="w-4 h-4 text-gray-400" title="Common character" />
    )
  }

  const cycleStatus = (currentStatus: Character["status"]): Character["status"] => {
    switch (currentStatus) {
      case "neutral":
        return "evil"
      case "evil":
        return "good"
      case "good":
      default:
        return "neutral"
    }
  }

  const cycleAliveStatus = (currentStatus: Character["isAlive"]): AliveStatus => {
    const status =
      String(currentStatus) === "true"
        ? "alive"
        : String(currentStatus) === "false"
          ? "dead"
          : (currentStatus as AliveStatus)

    switch (status) {
      case "alive":
        return "dead"
      case "dead":
        return "unknown"
      case "unknown":
      default:
        return "alive"
    }
  }

  const cycleGender = (currentGender: Gender): Gender => {
    switch (currentGender) {
      case "male":
        return "female"
      case "female":
        return "anonymous"
      case "anonymous":
      default:
        return "male"
    }
  }

  const renderGender = (gender: Gender) => {
    const genderOption = GENDER_OPTIONS.find((opt) => opt.value === gender) || GENDER_OPTIONS[2]

    return {
      label: genderOption.label,
      icon: genderOption.icon,
      className:
        gender === "male"
          ? "text-blue-600 border-blue-300"
          : gender === "female"
            ? "text-pink-600 border-pink-300"
            : "text-gray-600 border-gray-300",
    }
  }

  const handleAddCharacter = () => {
    if (!newCharacter.name.trim()) {
      newNameInputRef.current?.focus()
      return
    }
    const characterToAdd = {
      ...newCharacter,
      isAlive:
        String(newCharacter.isAlive) === "true"
          ? "alive"
          : String(newCharacter.isAlive) === "false"
            ? "dead"
            : (newCharacter.isAlive as AliveStatus),
      gender: newCharacter.gender || "anonymous", 
    }
    setCharacters([...characters, characterToAdd])
    setNewCharacter({ ...newCharacterTemplate, id: Date.now().toString() })
    setIsAdding(false)
  }

  const handleCancelAdding = () => {
    setIsAdding(false)
    setNewCharacter(newCharacterTemplate)
  }

  const handleDeleteConfirmed = (id: string) => {
    setCharacters((prev) => prev.filter((c) => c.id !== id))
    setIsDeleteConfirmDialogOpen(false)
    setCharacterToDelete(null)
  }

  const confirmDeleteCharacter = (character: Character) => {
    if (isGlobalPinActive) return
    if (character.importance === "important") {
      setCharacterToDelete(character)
      setIsDeleteConfirmDialogOpen(true)
    } else {
      handleDeleteConfirmed(character.id)
    }
  }

  const handleUpdateCharacter = (id: string, field: keyof Character, value: any) => {
    if (isGlobalPinActive) return

    const processedValue = field === "name" ? toTitleCase(value) : value

    if (field === "role" && value === "custom_role") {
      openCustomValueDialog(id, "role")
      return
    }
    if (field === "socialRank" && value === "custom_status") {
      openCustomValueDialog(id, "socialRank")
      return
    }
    if (field === "gender" && !value) {
      value = "anonymous"
    }

    setCharacters(characters.map((c) => (c.id === id ? { ...c, [field]: processedValue } : c)))
  }

  const handleNewInputChange = (field: keyof Character, value: any) => {
    const processedValue = field === "name" ? toTitleCase(value) : value

    if (field === "role" && value === "custom_role") {
      setEditingCharacterId("new")
      openCustomValueDialog("new", "role")
      return
    }
    if (field === "socialRank" && value === "custom_status") {
      setEditingCharacterId("new")
      openCustomValueDialog("new", "socialRank")
      return
    }
    if (field === "gender" && !value) {
      value = "anonymous"
    }

    setNewCharacter((prev) => ({ ...prev, [field]: processedValue }))
  }

  useEffect(() => {
    if (isAdding) {
      newNameInputRef.current?.focus()
    }
  }, [isAdding])

  const handleEnterKeyPress = (e: React.KeyboardEvent<HTMLInputElement>, field: keyof Character) => {
    if (e.key === "Enter") {
      e.preventDefault()

      switch (field) {
        case "name":
          if (newCharacter.name.trim()) {
            newAgeInputRef.current?.focus()
          } else {
            newNameInputRef.current?.focus()
          }
          break
        case "age":
          newPowersInputRef.current?.focus()
          break
        case "powers":
          if (!newCharacter.name.trim()) {
            newNameInputRef.current?.focus()
            return
          }
          const finalPowers = newCharacter.powers.trim() || "necunoscut"
          const characterToAdd = {
            ...newCharacter,
            powers: finalPowers, 
            isAlive:
              String(newCharacter.isAlive) === "true"
                ? "alive"
                : String(newCharacter.isAlive) === "false"
                  ? "dead"
                  : (newCharacter.isAlive as AliveStatus),
            gender: newCharacter.gender || "anonymous", 
          }
          setCharacters((prevCharacters) => [...prevCharacters, characterToAdd])
          setNewCharacter({ ...newCharacterTemplate, id: Date.now().toString() })
          setIsAdding(false)
          break
        default:
          break
      }
    }
  }

  const handleDropCharacter = (targetCharacterId: string) => {
    if (isGlobalPinActive) return

    if (!draggedCharacterId || draggedCharacterId === targetCharacterId) {
      setDraggedCharacterId(null)
      setDragOverCharacterId(null)
      return
    }

    setCharacters((prevCharacters) => {
      const charArray = [...prevCharacters]
      const draggedIndex = charArray.findIndex((c) => c.id === draggedCharacterId)
      const targetIndex = charArray.findIndex((c) => c.id === targetCharacterId)

      if (draggedIndex === -1 || targetIndex === -1) return prevCharacters

      const [removed] = charArray.splice(draggedIndex, 1)
      charArray.splice(targetIndex, 0, removed)

      return charArray
    })

    setDraggedCharacterId(null)
    setDragOverCharacterId(null)
  }

  const SORT_OPTIONS: { value: SortKey; label: string }[] = [
    { value: "none", label: "Fără sortare" },
    { value: "name", label: "Nume" },
    { value: "age", label: "Vârstă" },
    { value: "role", label: "Rol" },
    { value: "socialRank", label: "Statut" },
    { value: "status", label: "Moralitate" },
    { value: "gender", label: "Gen" },
    { value: "isAlive", label: "Status (Viu/Mort/Incert)" },
    { value: "importance", label: "Importanță" },
  ]

  const getSortKeyLabel = (key: SortKey) => {
    return SORT_OPTIONS.find((opt) => opt.value === key)?.label || "Fără sortare"
  }

  const renderAliveStatus = (status: Character["isAlive"]) => {
    const currentStatus =
      String(status) === "true" ? "alive" : String(status) === "false" ? "dead" : (status as AliveStatus)

    switch (currentStatus) {
      case "alive":
        return { label: "Viu", className: "text-green-600 border-green-300", icon: <Heart className="w-3 h-3" /> }
      case "dead":
        return { label: "Mort", className: "text-red-600 border-red-300", icon: <Skull className="w-3 h-3" /> }
      case "unknown":
      default:
        return { label: "Incert", className: "text-blue-600 border-blue-300", icon: <HelpCircle className="w-3 h-3" /> }
    }
  }

  return (
    <div className="space-y-4">
      {/* --- DIALOG DICȚIONAR (CU EDITARE) --- */}
      <Dialog open={isDictionaryOpen} onOpenChange={setIsDictionaryOpen}>
          <DialogContent className="sm:max-w-[900px] h-[80vh] flex flex-col p-0 overflow-hidden gap-0">
              {/* HEADER: Fix sus */}
              <div className="px-6 py-4 border-b flex justify-between items-center bg-background z-10">
                  <div>
                      <DialogTitle className="flex items-center gap-2">
                          <Book className="w-5 h-5 text-primary"/> Dicționar Termeni (Carte Curentă)
                      </DialogTitle>
                      
                  </div>
              </div>
              
              {/* CORPUL: Split View (Stânga Listă / Dreapta Detalii) */}
              <div className="flex flex-1 overflow-hidden">
                  
                  {/* --- PARTEA STÂNGĂ: LISTA --- */}
                  <div className="w-1/3 min-w-[250px] border-r flex flex-col bg-muted/10">
                      {/* Search Bar + Add Button Header */}
                      <div className="p-3 border-b space-y-2 bg-background/50">
                          <div className="relative">
                              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                              <Input 
                                  placeholder="Caută termen..." 
                                  className="pl-8 h-9 text-sm"
                                  value={dictionarySearch}
                                  onChange={(e) => setDictionarySearch(e.target.value)}
                              />
                          </div>
                          <Button 
                              variant={selectedTermId === null ? "default" : "outline"} 
                              size="sm" 
                              className="w-full justify-start gap-2"
                              onClick={() => setSelectedTermId(null)}
                          >
                              <Plus className="w-4 h-4" /> Termen Nou
                          </Button>
                      </div>

                      {/* Lista Scrollabilă */}
                      <ScrollArea className="flex-1">
                          <div className="p-2 space-y-1">
                              {filteredDefinitions.length === 0 ? (
                                  <div className="text-center text-xs text-muted-foreground py-8 px-2">
                                      {dictionarySearch ? "Niciun rezultat." : "Niciun termen adăugat."}
                                  </div>
                              ) : (
                                  filteredDefinitions.map(def => (
                                      <button
                                          key={def.id}
                                          onClick={() => setSelectedTermId(def.id)}
                                          className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors flex items-center justify-between group ${
                                              selectedTermId === def.id 
                                              ? "bg-primary text-primary-foreground font-medium shadow-sm" 
                                              : "hover:bg-muted text-foreground"
                                          }`}
                                      >
                                          <span className="truncate">{def.term}</span>
                                          <ChevronRight className={`w-3 h-3 opacity-50 ${selectedTermId === def.id ? "text-primary-foreground" : ""}`} />
                                      </button>
                                  ))
                              )}
                          </div>
                      </ScrollArea>
                  </div>

                  {/* --- PARTEA DREAPTĂ: DETALII / EDITARE / ADĂUGARE --- */}
                  <div className="flex-1 flex flex-col bg-background h-full overflow-hidden">
                      <ScrollArea className="flex-1 h-full">
                          <div className="p-6 h-full flex flex-col">
                              
                              {selectedTermId === null ? (
                                  // --- MODUL: ADĂUGARE TERMEN NOU ---
                                  <div className="space-y-6 animate-in fade-in duration-300">
                                      <div className="space-y-1 border-b pb-4">
                                          <h3 className="text-lg font-semibold flex items-center gap-2">
                                              <Plus className="w-5 h-5 text-primary" /> Adaugă Termen Nou
                                          </h3>
                                          
                                      </div>

                                      <div className="space-y-4 max-w-lg">
                                          <div className="space-y-2">
                                              <Label htmlFor="new-term">Nume Termen</Label>
                                              <Input 
                                                  id="new-term" 
                                                  placeholder="ex: Pupili, Flacăra Eternă" 
                                                  value={newTerm}
                                                  onChange={(e) => setNewTerm(e.target.value)}
                                              />
                                          </div>
                                          <div className="space-y-2">
                                              <Label htmlFor="new-def">Definiție Detaliată</Label>
                                              <Textarea 
                                                  id="new-def" 
                                                  placeholder="Descrie istoria, funcția sau semnificația acestui termen..." 
                                                  className="min-h-[200px] resize-none leading-relaxed"
                                                  value={newDefinition}
                                                  onChange={(e) => setNewDefinition(e.target.value)}
                                              />
                                          </div>
                                          <div className="pt-2">
                                              <Button 
                                                  onClick={handleAddDefinition} 
                                                  disabled={!newTerm.trim() || !newDefinition.trim()}
                                                  className="w-full sm:w-auto min-w-[150px]"
                                              >
                                                  Salvează în Dicționar
                                              </Button>
                                          </div>
                                      </div>
                                  </div>
                              ) : (
                                  // --- MODUL: VIZUALIZARE SAU EDITARE ---
                                  selectedDefinition ? (
                                      isEditingDefinition ? (
                                        // SUB-MODUL: EDITARE
                                        <div className="space-y-6 animate-in fade-in duration-300">
                                          <div className="flex justify-between items-center border-b pb-4">
                                            <h3 className="text-lg font-semibold flex items-center gap-2 text-primary">
                                                <Pencil className="w-5 h-5" /> Editare Termen
                                            </h3>
                                          </div>

                                          <div className="space-y-4 max-w-lg">
                                              <div className="space-y-2">
                                                  <Label htmlFor="edit-term">Nume Termen</Label>
                                                  <Input 
                                                      id="edit-term" 
                                                      value={editTermValue}
                                                      onChange={(e) => setEditTermValue(e.target.value)}
                                                  />
                                              </div>
                                              <div className="space-y-2">
                                                  <Label htmlFor="edit-def">Definiție</Label>
                                                  <Textarea 
                                                      id="edit-def" 
                                                      className="min-h-[200px] resize-none leading-relaxed"
                                                      value={editDefinitionValue}
                                                      onChange={(e) => setEditDefinitionValue(e.target.value)}
                                                  />
                                              </div>
                                              <div className="pt-2 flex gap-2">
                                                  <Button 
                                                      onClick={handleSaveEdit} 
                                                      disabled={!editTermValue.trim() || !editDefinitionValue.trim()}
                                                      className="w-full sm:w-auto min-w-[120px] gap-2"
                                                  >
                                                      <Save className="w-4 h-4"/> Salvează
                                                  </Button>
                                                  <Button 
                                                      variant="outline"
                                                      onClick={handleCancelEdit}
                                                      className="w-full sm:w-auto"
                                                  >
                                                      Anulează
                                                  </Button>
                                              </div>
                                          </div>
                                      </div>
                                      ) : (
                                        // SUB-MODUL: VIZUALIZARE STANDARD
                                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                            <div className="flex justify-between items-start border-b pb-4">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wider font-semibold">
                                                        <BookOpen className="w-3 h-3" /> Termen
                                                    </div>
                                                    <h2 className="text-3xl font-bold text-primary break-words">
                                                        {selectedDefinition.term}
                                                    </h2>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                  <Button 
                                                      variant="outline" 
                                                      size="sm" 
                                                      className="gap-1.5"
                                                      onClick={() => handleStartEdit(selectedDefinition)}
                                                  >
                                                      <Pencil className="w-3.5 h-3.5" /> Editează
                                                  </Button>
                                                  <Button 
                                                      variant="ghost" 
                                                      size="sm" 
                                                      className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1"
                                                      onClick={() => handleDeleteDefinition(selectedDefinition.id)}
                                                  >
                                                      <Trash2 className="w-4 h-4" /> Șterge
                                                  </Button>
                                                </div>
                                            </div>

                                            <div className="prose prose-sm max-w-none dark:prose-invert">
                                                <p className="text-base leading-7 whitespace-pre-wrap text-foreground/90">
                                                    {selectedDefinition.definition}
                                                </p>
                                            </div>
                                        </div>
                                      )
                                  ) : (
                                      <div className="h-full flex items-center justify-center text-muted-foreground">
                                          Termenul nu a fost găsit.
                                      </div>
                                  )
                              )}
                          </div>
                      </ScrollArea>
                  </div>

              </div>
          </DialogContent>
      </Dialog>

      {/* --- RESTUL COMPONENTELOR (TABEL, DIALOGURI) --- */}
      <Dialog open={isCustomRoleDialogOpen} onOpenChange={setIsCustomRoleDialogOpen}>
        <DialogContent className="[&>button]:hidden">
          <DialogHeader>
            <DialogTitle>Setează Rolul Personalizat</DialogTitle>
            <DialogDescription>Introdu rolul personalizat pentru personaj.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="custom-role">Rol</Label>
              <Input
                id="custom-role"
                value={tempCustomValue}
                onChange={(e) => setTempCustomValue(e.target.value)}
                placeholder="e.g., Profet, Vânător de recompense"
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleSaveCustomValue("role")
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCustomRoleDialogOpen(false)
                setEditingCharacterId(null)
                setTempCustomValue("")
              }}
            >
              Anulează
            </Button>
            <Button onClick={() => handleSaveCustomValue("role")} disabled={!tempCustomValue.trim()}>
              Salvează
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isCustomStatusDialogOpen} onOpenChange={setIsCustomStatusDialogOpen}>
        <DialogContent className="[&>button]:hidden">
          <DialogHeader>
            <DialogTitle>Setează Statutul Personalizat</DialogTitle>
            <DialogDescription>Introdu statutul social personalizat pentru personaj.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="custom-status">Statut</Label>
              <Input
                id="custom-status"
                value={tempCustomValue}
                onChange={(e) => setTempCustomValue(e.target.value)}
                placeholder="e.g., Magician, General, Renegat"
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleSaveCustomValue("socialRank")
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCustomStatusDialogOpen(false)
                setEditingCharacterId(null)
                setTempCustomValue("")
              }}
            >
              Anulează
            </Button>
            <Button onClick={() => handleSaveCustomValue("socialRank")} disabled={!tempCustomValue.trim()}>
              Salvează
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteConfirmDialogOpen} onOpenChange={setIsDeleteConfirmDialogOpen}>
        <DialogContent className="[&>button]:hidden">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <Skull className="w-5 h-5" /> Atenție: Ștergere Personaj Important
            </DialogTitle>
            <DialogDescription>
              Ești sigur că vrei să ștergi personajul {characterToDelete?.name}? Acest personaj este marcat ca Important
              (<Crown className="w-4 h-4 text-amber-500 inline-block align-text-bottom" />) Ștergerea lui ar putea
              afecta structura poveștii.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteConfirmDialogOpen(false)
                setCharacterToDelete(null)
              }}
            >
              Anulează
            </Button>
            <Button
              variant="destructive"
              onClick={() => characterToDelete && handleDeleteConfirmed(characterToDelete.id)}
            >
              Șterge Oricum
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Antet combinat */}
      <div className="sticky top-0 bg-background z-20 pb-2">
        <div className="flex justify-between items-center gap-4">
          <div className="flex items-center gap-2 flex-shrink-0">
            <Users className="w-4 h-4 text-secondary-foreground" />
            <h4 className="font-semibold text-sm whitespace-nowrap">
              Referințe Personaje ({filteredCharacters.length}
              {characters.length !== filteredCharacters.length ? ` din ${characters.length}` : ""})
            </h4>
          </div>

          <div className="flex gap-2 items-center flex-grow">
            <div className="relative flex-grow min-w-[200px]">
              <Search className="absolute left-2 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Caută după numele personajului..."
                className="pl-8 w-full"
                value={characterSearchQuery}
                onChange={(e) => setCharacterSearchQuery(e.target.value)}
                disabled={isGlobalPinActive}
              />
            </div>

            <Select
              value={sortKey}
              onValueChange={(value) => handleSortKeyChange(value as SortKey)}
              disabled={isGlobalPinActive}
            >
              <SelectTrigger className="h-10 w-[180px] flex-shrink-0">
                <SelectValue placeholder="Sortează după">Sortează după: {getSortKeyLabel(sortKey)}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="icon"
              onClick={toggleSortDirection}
              disabled={sortKey === "none" || isGlobalPinActive}
              title={sortDirection === "asc" ? "Sortare Ascendentă" : "Sortare Descendentă"}
              className="flex-shrink-0 bg-transparent"
            >
              {sortDirection === "asc" ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
            </Button>
          </div>

          <div className="flex gap-2 flex-shrink-0">
             <Button
                onClick={() => setIsDictionaryOpen(true)}
                size="sm"
                variant="outline"
                className="gap-2"
                title="Deschide Dicționarul de Termeni"
             >
                <Book className="w-4 h-4" /> Dicționar
             </Button>

            <Button
              onClick={() => {
                setIsAdding(true)
                setNewCharacter({ ...newCharacterTemplate, id: Date.now().toString() })
              }}
              size="sm"
              variant="outline"
              className="gap-1"
            >
              <Plus className="w-4 h-4" /> Adaugă Personaj
            </Button>
          </div>
        </div>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10">
            <TableRow>
              <TableHead className="w-[160px] text-center">Personaj</TableHead>
              <TableHead className="w-[50px] text-center">Vârsta</TableHead>
              <TableHead className="w-[180px] text-center">Puterii</TableHead>
              <TableHead className="w-[120px] text-center">Rol</TableHead>
              <TableHead className="w-[120px] text-center">Statut</TableHead>
              <TableHead className="w-[90px] text-center">Moralitate</TableHead>
              <TableHead className="w-[90px] text-center">Gen</TableHead>
              <TableHead className="w-[90px] text-center">Status</TableHead>

              <TableHead className="w-[80px] text-center p-2">
                <Button
                  variant="ghost"
                  className={`h-6 px-1.5 transition-transform duration-300 flex items-center justify-center gap-1 font-semibold text-xs mx-auto ${
                    isGlobalPinActive ? "text-primary hover:bg-primary/10" : "text-muted-foreground hover:bg-muted"
                  }`}
                  onClick={() => setIsGlobalPinActive((prev) => !prev)}
                  title={isGlobalPinActive ? "Desprinde Toate (Global)" : "Fixează Toate (Global)"}
                >
                  Pin
                  <Pin
                    className={`w-3 h-3 transition-transform duration-300 ${isGlobalPinActive ? "rotate-45" : "rotate-0"}`}
                  />
                </Button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCharacters.map((character) => {
              const isRowDisabled = isGlobalPinActive
              const aliveStatus = renderAliveStatus(character.isAlive)
              const genderData = renderGender((character.gender || "anonymous") as Gender)

              return (
                <TableRow
                  key={character.id}
                  draggable={!isRowDisabled}
                  onDragStart={(e) => {
                    if (!isRowDisabled) {
                      setDraggedCharacterId(character.id)
                      e.dataTransfer.effectAllowed = "move"
                    } else {
                      e.preventDefault()
                    }
                  }}
                  onDragOver={(e) => {
                    e.preventDefault()
                    if (!isRowDisabled) {
                      setDragOverCharacterId(character.id)
                    }
                  }}
                  onDragEnter={(e) => e.preventDefault()}
                  onDragLeave={() => setDragOverCharacterId(null)}
                  onDrop={() => handleDropCharacter(character.id)}
                  className={
                    (dragOverCharacterId === character.id ? "border border-dashed border-primary" : "") +
                    (isRowDisabled ? " bg-secondary/10" : "")
                  }
                >
                  <TableCell className="font-medium p-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          !isRowDisabled &&
                          handleUpdateCharacter(
                            character.id,
                            "importance",
                            character.importance === "common" ? "important" : "common",
                          )
                        }
                        className={`hover:opacity-70 transition-opacity ${isRowDisabled ? "cursor-default opacity-50" : ""}`}
                        title={
                          isRowDisabled
                            ? "Fixat - nu se poate schimba importanța"
                            : "Click to toggle importance (Coroană/Utilizator)"
                        }
                        disabled={isRowDisabled}
                      >
                        {renderCharacterIcon(character.importance)}
                      </button>
                      <Input
                        value={character.name}
                        onChange={(e) => handleUpdateCharacter(character.id, "name", e.target.value)}
                        placeholder="Nume Personaj"
                        className="h-8 text-sm"
                        disabled={isRowDisabled}
                      />
                    </div>
                  </TableCell>
                  <TableCell className="p-2 text-center">
                    <Input
                      value={character.age}
                      onChange={(e) => handleUpdateCharacter(character.id, "age", e.target.value)}
                      placeholder="ex: 30"
                      className="h-8 text-sm text-center"
                      disabled={isRowDisabled}
                    />
                  </TableCell>
                  <TableCell className="p-2">
                    <Input
                      value={character.powers}
                      onChange={(e) => handleUpdateCharacter(character.id, "powers", e.target.value)}
                      placeholder="ex: Telekinezie"
                      className="h-8 text-sm"
                      disabled={isRowDisabled}
                    />
                  </TableCell>

                  <TableCell className="p-2">
                    <Select
                      value={
                        ROLE_OPTIONS_BASE.some((opt) => opt.value === character.role) ? character.role : "custom_role"
                      }
                      onValueChange={(value) => handleUpdateCharacter(character.id, "role", value)}
                      disabled={isRowDisabled}
                    >
                      <SelectTrigger className="h-8 w-full text-sm">
                        <SelectValue placeholder="Rol">{getRoleLabel(character.role)}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {ROLE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>

                  <TableCell className="p-2">
                    <Select
                      value={
                        STATUS_OPTIONS_BASE.some((opt) => opt.value === character.socialRank)
                          ? character.socialRank
                          : "custom_status"
                      }
                      onValueChange={(value) => handleUpdateCharacter(character.id, "socialRank", value)}
                      disabled={isRowDisabled}
                    >
                      <SelectTrigger className="h-8 w-full text-sm">
                        <SelectValue placeholder="Statut">{getStatusLabel(character.socialRank)}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>

                  <TableCell className="p-2 text-center">
                    <button
                      onClick={() =>
                        !isRowDisabled && handleUpdateCharacter(character.id, "status", cycleStatus(character.status))
                      }
                      className={`text-xs font-medium px-2 py-1 rounded-md border transition-opacity mx-auto ${getStatusColor(character.status)} ${isRowDisabled ? "cursor-default opacity-50" : "cursor-pointer hover:opacity-70"}`}
                      title={
                        isRowDisabled
                          ? "Fixat - nu se poate schimba moralitatea"
                          : "Click pentru a schimba: Bun → Rău → Neutru"
                      }
                      disabled={isRowDisabled}
                    >
                      {character.status === "good" ? "Bun" : character.status === "evil" ? "Rău" : "Neutru"}
                    </button>
                  </TableCell>

                  <TableCell className="p-2 text-center">
                    <button
                      onClick={() =>
                        !isRowDisabled &&
                        handleUpdateCharacter(
                          character.id,
                          "gender",
                          cycleGender((character.gender || "anonymous") as Gender),
                        )
                      }
                      className={`text-xs font-medium px-2 py-1 rounded-md border transition-opacity flex items-center gap-1 justify-center mx-auto ${
                        genderData.className
                      } ${isRowDisabled ? "cursor-default opacity-50" : "cursor-pointer hover:opacity-70"}`}
                      title={
                        isRowDisabled
                          ? "Fixat - nu se poate schimba genul"
                          : "Click pentru a schimba: Băiat → Fată → Anonim"
                      }
                      disabled={isRowDisabled}
                    >
                      <span className="text-base font-bold">{genderData.icon}</span> {genderData.label}
                    </button>
                  </TableCell>

                  <TableCell className="p-2 text-center">
                    <button
                      onClick={() =>
                        !isRowDisabled &&
                        handleUpdateCharacter(character.id, "isAlive", cycleAliveStatus(character.isAlive))
                      }
                      className={`text-xs font-medium px-2 py-1 rounded-md border transition-opacity flex items-center gap-1 justify-center mx-auto ${
                        aliveStatus.className
                      } ${isRowDisabled ? "cursor-default opacity-50" : "cursor-pointer hover:opacity-70"}`}
                      title={
                        isRowDisabled ? "Fixat - nu se poate schimba statusul" : "Click to cycle: Viu ↔ Mort ↔ Incert"
                      }
                      disabled={isRowDisabled}
                    >
                      {aliveStatus.icon} {aliveStatus.label}
                    </button>
                  </TableCell>

                  <TableCell className="text-center p-2">
                    <div className="flex flex-col items-center space-y-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-6 w-6 ${isRowDisabled ? "text-gray-400 cursor-not-allowed" : "text-destructive hover:bg-destructive/10"}`}
                        onClick={() => confirmDeleteCharacter(character)}
                        title={
                          isRowDisabled
                            ? "Desprinde Pinul Global pentru a șterge"
                            : character.importance === "important"
                              ? "Șterge (necesită confirmare)"
                              : "Șterge rând"
                        }
                        disabled={isRowDisabled}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}

            {isAdding && (
              <TableRow className="bg-primary/5">
                <TableCell className="font-medium p-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        handleNewInputChange(
                          "importance",
                          newCharacter.importance === "common" ? "important" : "common",
                        )
                      }
                      className={`hover:opacity-70 transition-opacity`}
                      title="Click to toggle importance (Coroană/Utilizator)"
                    >
                      {renderCharacterIcon(newCharacter.importance)}
                    </button>
                    <Input
                      ref={newNameInputRef}
                      value={newCharacter.name}
                      onChange={(e) => handleNewInputChange("name", e.target.value)}
                      placeholder="Nume Personaj"
                      className="h-8 text-sm"
                      onKeyPress={(e) => handleEnterKeyPress(e, "name")}
                    />
                  </div>
                </TableCell>
                <TableCell className="p-2 text-center">
                  <Input
                    ref={newAgeInputRef}
                    value={newCharacter.age}
                    onChange={(e) => handleNewInputChange("age", e.target.value)}
                    placeholder="ex: 30"
                    className="h-8 text-sm text-center"
                    onKeyPress={(e) => handleEnterKeyPress(e, "age")}
                  />
                </TableCell>
                <TableCell className="p-2">
                  <Input
                    ref={newPowersInputRef}
                    value={newCharacter.powers}
                    onChange={(e) => handleNewInputChange("powers", e.target.value)}
                    placeholder="ex: Telekinezie"
                    className="h-8 text-sm"
                    onKeyPress={(e) => handleEnterKeyPress(e, "powers")}
                  />
                </TableCell>

                <TableCell className="p-2">
                  <Select
                    value={
                      ROLE_OPTIONS_BASE.some((opt) => opt.value === newCharacter.role)
                        ? newCharacter.role
                        : "custom_role"
                    }
                    onValueChange={(value) => handleNewInputChange("role", value)}
                  >
                    <SelectTrigger className="h-8 w-full text-sm">
                      <SelectValue placeholder="Rol">{getRoleLabel(newCharacter.role)}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {ROLE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>

                <TableCell className="p-2">
                  <Select
                    value={
                      STATUS_OPTIONS_BASE.some((opt) => opt.value === newCharacter.socialRank)
                        ? newCharacter.socialRank
                        : "custom_status"
                    }
                    onValueChange={(value) => handleNewInputChange("socialRank", value)}
                  >
                    <SelectTrigger className="h-8 w-full text-sm">
                      <SelectValue placeholder="Statut">{getStatusLabel(newCharacter.socialRank)}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>

                <TableCell className="p-2">
                  <Select
                    value={newCharacter.status}
                    onValueChange={(value: any) => handleNewInputChange("status", value)}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="good">Bun</SelectItem>
                      <SelectItem value="neutral">Neutru</SelectItem>
                      <SelectItem value="evil">Rău</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>

                <TableCell className="p-2">
                  <Select
                    value={(newCharacter.gender || "anonymous") as string}
                    onValueChange={(value) => handleNewInputChange("gender", value as Gender)}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="Gen" />
                    </SelectTrigger>
                    <SelectContent>
                      {GENDER_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <span className="flex items-center gap-2">
                            <span className="text-base font-bold">{option.icon}</span> {option.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>

                <TableCell className="p-2">
                  <Select
                    value={String(newCharacter.isAlive)} 
                    onValueChange={(value) => handleNewInputChange("isAlive", value as AliveStatus)}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      {ALIVE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>

                <TableCell className="text-center p-2">
                  <div className="flex flex-col items-center space-y-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-green-600 hover:bg-green-100"
                      onClick={handleAddCharacter}
                      disabled={!newCharacter.name.trim()}
                      title="Adaugă rând"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-gray-500 hover:bg-gray-100"
                      onClick={handleCancelAdding}
                      title="Anulează"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}

            {!isAdding && filteredCharacters.length === 0 && characters.length > 0 && characterSearchQuery.trim() && (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-sm text-muted-foreground py-4">
                  Niciun personaj găsit cu numele "{characterSearchQuery}".
                </TableCell>
              </TableRow>
            )}

            {characters.length === 0 && !isAdding && (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                  Nu există personaje adăugate.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <p className="text-xs text-muted-foreground text-right"></p>
    </div>
  )
}