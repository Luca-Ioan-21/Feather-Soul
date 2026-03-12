"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
// Componente necesare pentru Combobox/Search
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// Icoane
import { Plus, Trash2, Maximize2, Minimize2, Triangle, Square, Pentagon, ChevronDown, Check, ChevronsUpDown } from "lucide-react"

const cn = (...classes: (string | false | null | undefined)[]) => classes.filter(Boolean).join(' ');

// Definițiile pentru Font Size
type FontSize = "sm" | "base" | "lg"
const fontSizeClasses: Record<FontSize, string> = {
  sm: "!text-sm",
  base: "!text-base",
  lg: "!text-lg",
}
const listFontSizeClasses: Record<FontSize, string> = {
  sm: "text-base",
  base: "text-lg",
  lg: "text-xl",
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

type CharacteristicType = "physical" | "psychological" | "emotional" | "powers_detailed"

interface CharacterCharacteristic {
  id: string
  type: CharacteristicType
  value: string
}

interface Character {
  id: string
  name: string
  age: string
  powers: string
  characteristics: string
  status: "good" | "evil" | "neutral"
  importance: "important" | "common"
  detailedCharacteristics?: CharacterCharacteristic[]
}

interface CharacterDetailsEditorProps {
  characters: Character[]
  setCharacters: React.Dispatch<React.SetStateAction<Character[]>>
}

const characteristicTypeLabels: Record<CharacteristicType, string> = {
  physical: "Fizic",
  psychological: "Psihic",
  emotional: "Emoțional",
  powers_detailed: "Puteri (Detaliate)",
}

const characteristicTypeColors: Record<CharacteristicType, string> = {
  physical: "bg-blue-100 text-blue-900 border-blue-200",
  psychological: "bg-purple-100 text-purple-900 border-purple-200",
  emotional: "bg-pink-100 text-pink-900 border-pink-200",
  powers_detailed: "bg-amber-100 text-amber-900 border-amber-200",
}

const capitalize = (s: string): string => {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
};

export function CharacterDetailsEditor({ characters, setCharacters }: CharacterDetailsEditorProps) {
  // Starea pentru Personajul Selectat
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(
    characters.length > 0 ? characters[0].id : null,
  )
  
  // Stările pentru UI
  const [newCharacteristicType, setNewCharacteristicType] = useState<CharacteristicType>("physical")
  const [newCharacteristicValue, setNewCharacteristicValue] = useState("")
  const [expandedCharacteristicType, setExpandedCharacteristicType] = useState<CharacteristicType | null>(null)
  const [temporaryText, setTemporaryText] = useState("")
  const [generalCharacteristicsText, setGeneralCharacteristicsText] = useState("")
  const [fontSize, setFontSize] = useState<FontSize>("sm")
  
  // --- STARE PENTRU EXPANSIUNE TEXT LIBER ---
  const [isFreeTextExpanded, setIsFreeTextExpanded] = useState(false)

  // LOGICA DE PERSISTENȚĂ (SESSION STORAGE)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedState = sessionStorage.getItem("characterEditor_isExpanded");
      if (savedState === "true") {
        setIsFreeTextExpanded(true);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("characterEditor_isExpanded", String(isFreeTextExpanded));
    }
  }, [isFreeTextExpanded]);


  // LOGICA PENTRU COMBOBOX
  const [isComboboxOpen, setIsComboboxOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("") 

  const getCharacterDisplayName = (char: Character | undefined | null): string => {
    const name = char?.name?.trim()
    return name || (char ? `Personaj Fără Nume (${char.id.slice(-4)})` : "Căută și alege un personaj...")
  }

  useEffect(() => {
    const char = characters.find((c) => c.id === selectedCharacterId)
    if (char) {
      setGeneralCharacteristicsText(char.characteristics || "")
      setTemporaryText(char.characteristics || "")
      setSearchTerm(char.name || "")
    } else {
      setGeneralCharacteristicsText("")
      setTemporaryText("")
      setExpandedCharacteristicType(null)
    }
  }, [selectedCharacterId, characters])

  // --- MODIFICAREA ESTE AICI (FILTRAREA) ---
  const filteredCharacters = characters.filter((char) => {
    const name = (char.name || "").toLowerCase()
    const term = searchTerm.toLowerCase()
    
    // Dacă nu e scris nimic in search, returnam tot (true). Altfel verificam potrivirea.
    if (!term) return true; 
    return name.includes(term)
  })
  
  const handleSelectCharacter = (characterId: string) => {
    setSelectedCharacterId(characterId) 
    const selected = characters.find((c) => c.id === characterId)
    if (selected) {
      setSearchTerm(selected.name || "")
    }
    setIsComboboxOpen(false)
  }

  const handleCreateNewCharacter = () => {
    const rawName = searchTerm.trim()
    if (!rawName) return

    const newName = capitalize(rawName);
    
    if (characters.some(char => (char.name || "").toLowerCase() === newName.toLowerCase())) {
        const existingChar = characters.find(char => (char.name || "").toLowerCase() === newName.toLowerCase());
        if (existingChar) {
            handleSelectCharacter(existingChar.id);
        }
        return;
    }

    const newCharacterId = `char-${Date.now()}`
    const newCharacter: Character = {
        id: newCharacterId,
        name: newName,
        age: "",
        powers: "",
        characteristics: "",
        status: "neutral",
        importance: "common",
        detailedCharacteristics: [],
    }

    setCharacters(prev => [...prev, newCharacter])
    setSelectedCharacterId(newCharacterId)
    setIsComboboxOpen(false)
    setSearchTerm(newName);
  }

  useEffect(() => {
    const char = characters.find((c) => c.id === selectedCharacterId)
    if (!char || temporaryText === char.characteristics) {
      return
    }

    const handler = setTimeout(() => {
      setGeneralCharacteristicsText(temporaryText)
      setCharacters((prev) =>
        prev.map((c) => (c.id === selectedCharacterId ? { ...c, characteristics: temporaryText } : c)),
      )
    }, 300)

    return () => {
      clearTimeout(handler)
    }
  }, [temporaryText, selectedCharacterId, setCharacters])

  useEffect(() => {
    if (selectedCharacterId && !characters.find((c) => c.id === selectedCharacterId)) {
      setSelectedCharacterId(characters.length > 0 ? characters[0].id : null)
    } else if (!selectedCharacterId && characters.length > 0) {
      setSelectedCharacterId(characters[0].id)
    }
  }, [characters, selectedCharacterId])

  const selectedCharacter = characters.find((c) => c.id === selectedCharacterId)

  const handleGeneralCharacteristicsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value
    setTemporaryText(newText)
  }

  const handleAddCharacteristic = () => {
    if (!selectedCharacterId || !newCharacteristicValue.trim()) return

    const updatedCharacters = characters.map((char) => {
      if (char.id === selectedCharacterId) {
        const typeToAdd = newCharacteristicType as CharacteristicType
        const newCharacteristic: CharacterCharacteristic = {
          id: Date.now().toString(),
          type: typeToAdd,
          value: newCharacteristicValue.trim(),
        }
        return {
          ...char,
          detailedCharacteristics: [...(char.detailedCharacteristics || []), newCharacteristic],
        }
      }
      return char
    })

    setCharacters(updatedCharacters)
    setNewCharacteristicValue("")
  }

  const handleDeleteCharacteristic = (characterId: string, characteristicId: string) => {
    const updatedCharacters = characters.map((char) => {
      if (char.id === characterId) {
        return {
          ...char,
          detailedCharacteristics: (char.detailedCharacteristics || []).filter((c) => c.id !== characteristicId),
        }
      }
      return char
    })
    setCharacters(updatedCharacters)
  }

  const handleToggleExpand = (type: CharacteristicType) => {
    setExpandedCharacteristicType(expandedCharacteristicType === type ? null : type)
  }

  const handleSetFontSize = (size: FontSize) => {
    setFontSize(size)
  }

  if (characters.length === 0 && !searchTerm) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <p>Niciun personaj adăugat. Începeți prin a tasta un nume la personaje pentru a crea primul personaj.</p>
      </div>
    )
  }

  const allCharacteristicTypes: CharacteristicType[] = ["physical", "psychological", "emotional", "powers_detailed"]

  const characteristicsGridClass = expandedCharacteristicType ? "grid-cols-1" : "grid-cols-2 gap-4"

  const isNewCharacterCreationPossible = searchTerm.trim().length > 0 && filteredCharacters.length === 0;
  const displayNewCharacterName = capitalize(searchTerm.trim());

  return (
    <div className="space-y-4">
      {/* ---------------------------------------------------------- */}
      {/* SECȚIUNEA 1: SELECTAREA/CREAREA PERSONAJULUI               */}
      {/* ---------------------------------------------------------- */}
      <div className="flex items-center justify-start p-2 rounded-md border bg-muted/30">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium block whitespace-nowrap">
            Selectează/Creează Personaj:
          </label>

          <Popover open={isComboboxOpen} onOpenChange={setIsComboboxOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={isComboboxOpen}
                className="w-[250px] justify-between h-9 text-sm"
              >
                {selectedCharacterId
                  ? getCharacterDisplayName(characters.find((char) => char.id === selectedCharacterId))
                  : searchTerm.trim() || "Căută și alege un personaj..."}

                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[250px] p-0">
              <Command>
                <CommandInput
                  placeholder="Căută personaj..."
                  value={searchTerm}
                  onValueChange={(value) => {
                    setSearchTerm(value)
                    setIsComboboxOpen(true) 
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault() 
                      if (filteredCharacters.length > 0) {
                        handleSelectCharacter(filteredCharacters[0].id)
                      } else if (isNewCharacterCreationPossible) {
                        handleCreateNewCharacter()
                      }
                    }
                  }}
                />
                <CommandList className="max-h-[240px]">
                  <CommandGroup>
                    {filteredCharacters.map((char) => {
                      const charName = getCharacterDisplayName(char)
                      const isSelected = selectedCharacterId === char.id

                      return (
                        <CommandItem
                          key={char.id}
                          value={charName} 
                          onSelect={() => handleSelectCharacter(char.id)}
                          className="cursor-pointer"
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              isSelected ? "opacity-100" : "opacity-0",
                            )}
                          />
                          {charName}
                        </CommandItem>
                      )
                    })}
                  </CommandGroup>
                  {isNewCharacterCreationPossible ? (
                    <CommandItem 
                        onSelect={handleCreateNewCharacter}
                        className="text-primary font-bold cursor-pointer"
                        value={`Creează personajul ${displayNewCharacterName}`}
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Creează personajul: **{displayNewCharacterName}**
                    </CommandItem>
                  ) : (
                    // Aici afișăm mesajul doar dacă CHIAR nu există nimic (nici lista filtrată, nici opțiune de creare)
                     filteredCharacters.length === 0 && !isNewCharacterCreationPossible && (
                        <CommandEmpty>Niciun personaj găsit.</CommandEmpty>
                     )
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* ---------------------------------------------------------- */}
      {/* SECȚIUNEA 2: DETALII ȘI CARACTERISTICI                     */}
      {/* ---------------------------------------------------------- */}
      {selectedCharacter && (
        <div className="space-y-2">
          {/* INALTIMEA RAMANE 407px */}
          <Card className="p-4 space-y-4 h-[407px] flex flex-col overflow-hidden">
            {/* GRID CONTROLAT DE STARE */}
            <div className={cn("grid gap-2 flex-1 min-h-0", isFreeTextExpanded ? "grid-cols-1" : "lg:grid-cols-2")}>
              
              {/* STÂNGA: ZONA PENTRU CARACTERISTICI GENERALE */}
              <div className="space-y-2 flex flex-col min-h-0">
                <div className="flex justify-between items-center flex-shrink-0">
                  <h5 className="font-semibold text-sm">Text Liber {isFreeTextExpanded && "(Vizualizare Extinsă)"}</h5>

                  <div className="flex items-center gap-2">
                     {/* Butonul de Maximize/Minimize */}
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setIsFreeTextExpanded(!isFreeTextExpanded)}
                        title={isFreeTextExpanded ? "Micșorează (Split View)" : "Mărește (Vizualizare Completă)"}
                        className="h-7 w-7 text-primary"
                    >
                        {isFreeTextExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                    </Button>

                    <div className="flex items-center border rounded-md p-1 bg-muted/50">
                        {(["sm", "base", "lg"] as FontSize[]).map((size) => {
                        const IconComponent = fontSizeIcons[size]
                        const iconSizeClass = iconSizes[size]

                        return (
                            <Button
                            key={size}
                            variant={fontSize === size ? "default" : "ghost"}
                            size="icon"
                            className={`h-7 w-7 ${fontSize === size ? "" : "text-foreground/70"}`}
                            onClick={() => handleSetFontSize(size)}
                            title={`Schimbă fontul la dimensiunea ${size}`}
                            >
                            <IconComponent className={iconSizeClass} />
                            </Button>
                        )
                        })}
                    </div>
                  </div>
                </div>

                <Textarea
                  value={temporaryText}
                  onChange={handleGeneralCharacteristicsChange}
                  placeholder="Scrie caracteristici generale sau a notelor nesortate..."
                  className={`flex-1 min-h-0 resize-none overflow-y-auto ${fontSizeClasses[fontSize]}`}
                  spellCheck={false}
                />
              </div>

              {/* DREAPTA: ZONA PENTRU CARACTERISTICI STRUCTURATE */}
              {!isFreeTextExpanded && (
                <div className="space-y-4 flex flex-col min-h-0">
                    <h5 className="font-semibold text-sm flex-shrink-0">Caracteristici Structurate (Sortare)</h5>

                    <div
                    className={`grid ${characteristicsGridClass} transition-all duration-300 ease-in-out gap-2 flex-shrink-0`}
                    >
                    {allCharacteristicTypes.map((type) => {
                        const isExpanded = expandedCharacteristicType === type
                        const isHidden = expandedCharacteristicType && !isExpanded

                        if (isHidden) return null

                        return (
                        <div
                            key={type}
                            className={`
                            flex flex-col border rounded-md transition-all duration-300 ease-in-out
                            ${isExpanded ? "col-span-2 h-[337px]" : "col-span-1 h-auto"} 
                            `}
                        >
                            <div
                            className={`font-bold text-xs p-2 rounded-t-md flex justify-between items-center flex-shrink-0 ${characteristicTypeColors[type]} cursor-pointer`}
                            onClick={() => handleToggleExpand(type)}
                            >
                            <h6 className="flex-1">
                                {characteristicTypeLabels[type]} (
                                {selectedCharacter.detailedCharacteristics?.filter((c) => c.type === type).length || 0})
                            </h6>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                e.stopPropagation(); 
                                handleToggleExpand(type);
                                }}
                                title={isExpanded ? "Micșorează" : "Mărește"}
                                className={`ml-2 h-6 w-6 p-0 ${characteristicTypeColors[type].replace("bg-", "hover:bg-").replace("-100", "-300").replace("text-", "hover:text-")}`}
                            >
                                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                            </Button>
                            </div>
                            {isExpanded && (
                            <div className="flex flex-col gap-1 p-2 overflow-y-auto flex-1">
                                {(selectedCharacter.detailedCharacteristics || [])
                                .filter((c) => c.type === type)
                                .map((c) => (
                                    <div
                                    key={c.id}
                                    className="flex justify-between items-start p-1 rounded-sm hover:bg-muted/50 transition-colors border-b"
                                    >
                                    <span className={`flex-1 break-words pr-1 ${listFontSizeClasses[fontSize]}`}>
                                        {c.value}
                                    </span>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-5 w-5 p-0 text-destructive/80 hover:text-destructive"
                                        onClick={() => handleDeleteCharacteristic(selectedCharacter.id, c.id)}
                                        title="Șterge caracteristică"
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                    </div>
                                ))}
                                {(selectedCharacter.detailedCharacteristics || []).filter((c) => c.type === type).length ===
                                0 && <p className="text-center text-xs text-muted-foreground p-2">Adaugă detalii</p>}
                            </div>
                            )}
                        </div>
                        )
                    })}
                    </div>

                    {!expandedCharacteristicType && (
                    <>
                        <Separator className="flex-shrink-0" />

                        <div className="space-y-2 flex-shrink-0">
                        <h5 className="font-semibold text-sm">Adaugă o Caracteristică Structurată</h5>

                        <div className="flex gap-2">
                            <Select
                            value={newCharacteristicType}
                            onValueChange={(value) => setNewCharacteristicType(value as CharacteristicType)}
                            >
                            <SelectTrigger className="w-[150px] h-9 text-sm">
                                <SelectValue placeholder="Tip" />
                            </SelectTrigger>
                            <SelectContent>
                                {allCharacteristicTypes.map((type) => (
                                <SelectItem key={type} value={type}>
                                    {characteristicTypeLabels[type]}
                                </SelectItem>
                                ))}
                            </SelectContent>
                            </Select>

                            <Textarea
                            value={newCharacteristicValue}
                            onChange={(e) => setNewCharacteristicValue(e.target.value)}
                            placeholder="Descrie caracteristica..."
                            className="min-h-[50px] resize-none flex-1 text-sm"
                            />
                        </div>

                        <Button
                            onClick={handleAddCharacteristic}
                            disabled={!newCharacteristicValue.trim()}
                            className="w-full gap-2"
                            size="sm"
                        >
                            <Plus className="w-4 h-4" /> Adaugă Caracteristică la **
                            {characteristicTypeLabels[newCharacteristicType]}**
                        </Button>
                        </div>
                    </>
                    )}
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
      {!selectedCharacter && !isNewCharacterCreationPossible && (
        <div className="text-center py-6 text-muted-foreground">
          <p>Selectați un personaj pentru a-i edita detaliile structurate.</p>
        </div>
      )}
      {!selectedCharacter && isNewCharacterCreationPossible && (
         <div className="text-center py-6 text-muted-foreground">
           <p>Personajul **{displayNewCharacterName}** nu a fost găsit.</p>
         </div>
      )}
    </div>
  )
}