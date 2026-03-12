// app/write/components/book-references-dialog.tsx
"use client"

import type React from "react"
import { useState, useRef, useEffect, useCallback, useMemo } from "react" 
import { User, Map, Clock, Palette, UserCog, LayoutGrid, Download, Upload, Trash2, Lightbulb } from "lucide-react" 
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Import componente existente
// 🟢 IMPORTĂ TermDefinition pentru a folosi tipul corect
import { CharacterReferenceTable, TermDefinition } from "./character-reference-table" 
import { CharacterDetailsEditor } from "./character-details-editor"
import { LocationsEditor } from "./locations-editor" 
import { TimelineEditor } from "./timeline-editor"
import { LoreEditor } from "./lore-editor"
import { BookStructureEditor } from "./book-structure-editor"
import type { Character } from "../types/book"

// Importul dialogurilor de confirmare și eroare
import { DeleteConfirmationDialog } from "./delete-confirmation-dialog" 
import { ImportErrorDialog } from "./import-error-dialog" 

import KeyIdeasEditor, { type BookStructureContent as ImportedBookStructureContent } from "./key-ideas-editor" 

// Re-exportăm tipul sub numele original
type BookStructureContent = ImportedBookStructureContent

// Valoarea implicită pentru structura cărții
const initialStructureContent: BookStructureContent = {
    generalStructure: "",
    styleAndTone: "",
    keyIdeas: "", 
    narrativePerspective: "",
    customNotes: "",
}

// **Structura tab-urilor**
const tabItems = [
    { value: "characters", label: "Personaje", Icon: User },
    { value: "characteristics", label: "Caracteristici", Icon: UserCog },
    { value: "locations", label: "Locații", Icon: Map },
    { value: "timeline", label: "Cronologie", Icon: Clock },
    { value: "lore", label: "Obiecte", Icon: Palette },
    { value: "key_ideas", label: "Idei", Icon: Lightbulb }, 
    { value: "structure", label: "Structură", Icon: LayoutGrid },
]

// Interfața pentru datele care sunt importate/exportate
interface ImportedData {
  bookTitle: string
  characters: Character[]
  locations: string
  timeline: string
  lore: string
  structure: BookStructureContent
  dictionary: TermDefinition[] // 🟢 Câmp nou pentru Import/Export
}

interface BookReferencesDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  bookTitle: string
  currentCharacters: Character[]
  setCurrentCharacters: React.Dispatch<React.SetStateAction<Character[]>>
  currentLocationsContent: string
  setCurrentLocationsContent: React.Dispatch<React.SetStateAction<string>>
  currentTimelineContent: string
  setCurrentTimelineContent: React.Dispatch<React.SetStateAction<string>>
  currentKeyItemsLore: string
  setCurrentKeyItemsLore: React.Dispatch<React.SetStateAction<string>>
  currentStructureContent: BookStructureContent 
  setCurrentStructureContent: React.Dispatch<React.SetStateAction<BookStructureContent>>
  
  // 🟢 PROPS NOI PENTRU DICȚIONAR (Primite din page.tsx)
  currentDictionary: TermDefinition[]
  setCurrentDictionary: React.Dispatch<React.SetStateAction<TermDefinition[]>>
}

export function BookReferencesDialog({
  isOpen,
  onOpenChange,
  bookTitle,
  currentCharacters,
  setCurrentCharacters,
  currentLocationsContent,
  setCurrentLocationsContent,
  currentTimelineContent,
  setCurrentTimelineContent,
  currentKeyItemsLore,
  setCurrentKeyItemsLore,
  currentStructureContent,
  setCurrentStructureContent,
  currentDictionary,     // 🟢
  setCurrentDictionary,  // 🟢
}: BookReferencesDialogProps) {
  const [activeTab, setActiveTab] = useState("characters")
  const [indicatorWidth, setIndicatorWidth] = useState(0)
  const [indicatorLeft, setIndicatorLeft] = useState(0)
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)

  // State pentru dialogul de ștergere totală
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false) 
  
  // State pentru gestionarea erorii de import
  const [isImportErrorOpen, setIsImportErrorOpen] = useState(false)
  const [importErrorMessage, setImportErrorMessage] = useState("")

  const content = currentStructureContent ?? initialStructureContent
  
  const handleChange = useCallback((newContent: Partial<BookStructureContent>) => {
    setCurrentStructureContent(prevContent => ({
        ...prevContent,
        ...newContent,
    }))
  }, [setCurrentStructureContent])


  // **Logica indicatorului animat**
  const updateIndicatorPosition = useCallback(() => {
    const activeTabElement = tabRefs.current[activeTab]
    if (activeTabElement) {
      setIndicatorWidth(activeTabElement.offsetWidth)
      setIndicatorLeft(activeTabElement.offsetLeft)
    }
  }, [activeTab]); 

  useEffect(() => {
    updateIndicatorPosition(); 
    const timeoutId = setTimeout(updateIndicatorPosition, 50); 
    return () => {
      clearTimeout(timeoutId); 
    }
  }, [activeTab, isOpen, updateIndicatorPosition]);

  useEffect(() => {
    window.addEventListener('resize', updateIndicatorPosition);
    return () => {
        window.removeEventListener('resize', updateIndicatorPosition);
    };
  }, [updateIndicatorPosition]);

  // **Logica de Export**
  const handleExport = useCallback(() => {
    const exportData: ImportedData = {
      bookTitle: bookTitle,
      characters: currentCharacters,
      locations: currentLocationsContent, 
      timeline: currentTimelineContent,
      lore: currentKeyItemsLore,
      structure: currentStructureContent, 
      dictionary: currentDictionary, // 🟢 Exportăm dicționarul curent
    }
    
    // Replacer pentru a preveni serializarea dublă a string-urilor JSON (locations, timeline, lore)
    const replacer = (key: string, value: any) => {
        if (key === 'locations' || key === 'timeline' || key === 'lore') {
            return value;
        }
        return value;
    };

    const jsonString = JSON.stringify(exportData, replacer, 2)
    const blob = new Blob([jsonString], { type: "application/json" })
    const url = URL.createObjectURL(blob)

    const a = document.createElement("a")
    a.href = url
    const safeBookTitle = bookTitle.replace(/[^a-z0-9]/gi, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
    const fileName = `Referinte-Carte-${safeBookTitle || 'Fara-Titlu'}.json`
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    
    URL.revokeObjectURL(url)
  }, [bookTitle, currentCharacters, currentLocationsContent, currentTimelineContent, currentKeyItemsLore, currentStructureContent, currentDictionary])
  
  // **Logica de Import**
  const handleImport = () => {
    fileInputRef.current?.click() 
  }

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
        try {
            const jsonContent = e.target?.result as string
            const importedData: ImportedData = JSON.parse(jsonContent)

            // Validare de bază a structurii
            if (
                Array.isArray(importedData.characters) &&
                typeof importedData.locations === 'string' &&
                typeof importedData.timeline === 'string' &&
                typeof importedData.lore === 'string' &&
                importedData.structure // Verificăm doar prezența obiectului structure
            ) {
                // Succes
                setCurrentCharacters(importedData.characters)
                setCurrentLocationsContent(importedData.locations)
                setCurrentTimelineContent(importedData.timeline)
                setCurrentKeyItemsLore(importedData.lore)
                setCurrentStructureContent(importedData.structure as BookStructureContent)
                
                // 🟢 Importăm dicționarul
                if (Array.isArray(importedData.dictionary)) {
                    setCurrentDictionary(importedData.dictionary)
                } else {
                    // Dacă importăm un fișier vechi care nu are dicționar, setăm array gol
                    setCurrentDictionary([])
                }
                
                console.log(`[Import] Referințe importate cu succes! Noua carte: ${importedData.bookTitle || bookTitle}.`)
            } else {
                // Eroare: Structură invalidă
                setImportErrorMessage("Structura datelor din fișierul JSON este invalidă sau incompletă.")
                setIsImportErrorOpen(true)
                console.warn("[Import] Structură de date JSON invalidă sau incompletă.", importedData)
            }
        } catch (error) {
            // Eroare: Parsare JSON eșuată
            setImportErrorMessage("Fișierul selectat nu este un fișier JSON valid.")
            setIsImportErrorOpen(true)
            console.warn("[Import] Eroare la citirea sau parsarea fișierului JSON:", error)
        } finally {
            event.target.value = ''
        }
    }
    reader.readAsText(file)
  }, [
    bookTitle,
    setCurrentCharacters,
    setCurrentLocationsContent,
    setCurrentTimelineContent,
    setCurrentKeyItemsLore,
    setCurrentStructureContent,
    setCurrentDictionary, // 🟢 Adăugat la dependency array
  ])
  
  // **Logica de ștergere totală (Silențioasă)**
  const handleClearAllReferences = useCallback(() => {
    setCurrentCharacters([])
    setCurrentLocationsContent("")
    setCurrentTimelineContent("")
    setCurrentKeyItemsLore("")
    setCurrentStructureContent(initialStructureContent) 
    setCurrentDictionary([]) // 🟢 Ștergem și dicționarul
    
    console.log(`[ACȚIUNE CRITICĂ] Toate referințele cărții "${bookTitle}" au fost șterse definitiv!`)

  }, [
    bookTitle,
    setCurrentCharacters,
    setCurrentLocationsContent,
    setCurrentTimelineContent,
    setCurrentKeyItemsLore,
    setCurrentStructureContent,
    setCurrentDictionary, // 🟢 Adăugat la dependency array
  ])
  
  // Funcție utilitară pentru a extrage doar ID-ul și Numele personajelor (Simplu)
  const simpleCharacters = useMemo(() => {
    return currentCharacters.map(c => ({ id: c.id, name: c.name }));
  }, [currentCharacters]);

  return (
    <>
    {/* 1. Dialogul de confirmare a ștergerii */}
    <DeleteConfirmationDialog 
      isOpen={isDeleteDialogOpen}
      onOpenChange={setIsDeleteDialogOpen}
      onConfirm={handleClearAllReferences}
      itemToDelete={`Referințele Cărții: ${bookTitle}`} 
    />
    
    {/* 2. Dialogul de eroare la import */}
    <ImportErrorDialog
      isOpen={isImportErrorOpen}
      onOpenChange={setIsImportErrorOpen}
      errorMessage={importErrorMessage}
    />

    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-[1400px] w-[1400px] [&>button]:hidden h-[95vh] max-h-[95vh] flex flex-col overflow-hidden"
      >
        <DialogHeader>
          <DialogTitle>Referințe pentru Cartea: {bookTitle}</DialogTitle>
          
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
        
          <TabsList className="grid w-full grid-cols-7 relative p-0 h-auto bg-transparent border-b border-border">
            {/* Indicatorul glisant animat */}
            <div 
              className="absolute h-full rounded-md bg-background shadow-md transition-all duration-300 ease-in-out z-0 border-b-2 border-primary" 
              style={{ width: `${indicatorWidth}px`, transform: `translateX(${indicatorLeft}px)` }} 
            />

            {/* Mapează butoanele de tab */}
            {tabItems.map(({ value, label, Icon }) => (
              <TabsTrigger 
                key={value}
                value={value}
                ref={(el) => (tabRefs.current[value] = el)}
                className={`flex items-center gap-2 relative z-10 
                           text-muted-foreground hover:text-foreground
                           data-[state=active]:shadow-none data-[state=active]:bg-transparent 
                           data-[state=active]:text-foreground transition-colors duration-300 h-10`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="flex-1 overflow-y-auto py-4">
            <TabsContent value="characters" className="space-y-4 mt-0">
              <CharacterReferenceTable 
                  characters={currentCharacters} 
                  setCharacters={setCurrentCharacters}
                  // 🟢 PASĂM DICȚIONARUL CĂTRE TABEL PENTRU A FI FOLOSIT ÎN DIALOGUL LUI INTERN
                  dictionary={currentDictionary}
                  setDictionary={setCurrentDictionary}
              />
            </TabsContent>

            <TabsContent value="characteristics" className="mt-0">
              <CharacterDetailsEditor characters={currentCharacters} setCharacters={setCurrentCharacters} />
            </TabsContent>
            
            <TabsContent value="locations" className="mt-0">
              <LocationsEditor content={currentLocationsContent} onChange={setCurrentLocationsContent} />
            </TabsContent>

            <TabsContent value="timeline" className="mt-0">
              <TimelineEditor 
                content={currentTimelineContent} 
                onChange={setCurrentTimelineContent} 
                characters={simpleCharacters} 
              />
            </TabsContent>

            <TabsContent value="lore" className="mt-0">
              <LoreEditor
                content={currentKeyItemsLore}
                onChange={setCurrentKeyItemsLore}
                characters={simpleCharacters} 
              />
            </TabsContent>
            
            <TabsContent value="key_ideas" className="mt-0 h-full">
              <KeyIdeasEditor 
                  content={{ keyIdeas: content.keyIdeas }} 
                  onChange={handleChange} 
                  hideActions={true} 
              />
            </TabsContent>

            <TabsContent value="structure" className="mt-0">
              <BookStructureEditor content={content} onChange={handleChange} />
            </TabsContent>
          </div>
        </Tabs>

        <DialogFooter className="gap-2">
          {/* Element ascuns de input file */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json" // Acceptă doar fișiere JSON
            style={{ display: 'none' }}
          />

          {/* Butonul de Ștergere Totală */}
          <Button
            variant="ghost" 
            onClick={() => setIsDeleteDialogOpen(true)}
            className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50/50"
          >
            <Trash2 className="w-4 h-4" />
            Șterge Tot
          </Button>

          {/* Separator */}
          <div className="flex-grow" /> 
          
          {/* Butonul de Import */}
          <Button 
            variant="outline" 
            onClick={handleImport} 
            className="gap-2"
          >
            <Upload className="w-4 h-4" />
            Importă 
          </Button>

          {/* Butonul de Export (Păstrat) */}
          <Button 
            variant="outline" 
            onClick={handleExport} 
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Exportă 
          </Button>

          <Button onClick={() => onOpenChange(false)}>Închide</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  )
}