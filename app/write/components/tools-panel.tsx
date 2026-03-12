// tools-panel.tsx (ACTUALIZAT cu TRANZIȚII SOFT PESTE TOT)

"use client"

import type React from "react"
// CORECTAT: Adăugat useMemo pentru a rezolva ReferenceError
import { useState, useMemo } from "react" 

import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { ClipboardList, Edit, Flag, Trash2, BookOpen, Plus, NotebookText } from "lucide-react" 
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// Interfață pentru notițe (Păstrată neschimbată)
interface ParsedNote {
  id: number 
  start: number 
  end: number 
  text: string 
  isPinned: boolean 
}

// Interfața ToolsPanelProps (Păstrată neschimbată)
interface ToolsPanelProps {
  wordCount: number
  // NOTIȚE INDEXATE
  currentScratchpadContent: string
  onScratchpadChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  scratchpadRef: React.RefObject<HTMLTextAreaElement>
  // NOU: NOTIȚE GENERALE (Stare și handler separate)
  currentGeneralNotesContent: string
  onGeneralNotesChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  generalNotesRef: React.RefObject<HTMLTextAreaElement>
  
  isBookFormatActive: boolean
  scratchpadClass: string
  
  onNavigateToSelection: (start: number, end: number) => void 
  currentSelectionRange: { start: number, end: number } 
  onAddNote: (notePrefix: string) => void 
  onTogglePinNote: (type: 'scratchpad' | 'general', index: number) => void 
  onDeleteNote: (type: 'scratchpad' | 'general', index: number) => void 
  onEditNote: (type: 'scratchpad' | 'general', index: number) => void 
  onViewNote: (title: string, text: string) => void 
}

// Numărul maxim de caractere pentru afișarea notiței trunchiate
const MAX_NOTE_LENGTH = 77 // 80 - '...'

export function ToolsPanel({
  wordCount,
  currentScratchpadContent,
  onScratchpadChange,
  scratchpadRef,
  currentGeneralNotesContent, 
  onGeneralNotesChange,       
  generalNotesRef,            
  isBookFormatActive,
  scratchpadClass,
  onNavigateToSelection, 
  currentSelectionRange, 
  onAddNote, 
  onTogglePinNote, 
  onDeleteNote, 
  onEditNote, 
  onViewNote, 
}: ToolsPanelProps) {
  
  // Stări locale pentru vizualizare și filtrare, ca să nu depindă de props
  const [isViewingGeneralNotesOnly, setIsViewingGeneralNotesOnly] = useState(false)
  const [filterPinned, setFilterPinned] = useState(false) 

  const { start: currentStart, end: currentEnd } = currentSelectionRange
  const selectionLength = Math.max(0, currentEnd - currentStart) 
  
  // Funcție de trunchiere
  const truncateText = (text: string) => {
    // Înlătură marcajul PIN și spațiile inițiale
    const cleanText = text.replace(/^🚩\s*/, '').trim()
    // Identifică textul notiței propriu-zise după prefixul specific
    const contentMatch = cleanText.match(/(?:^•\s*\[#\d+:\d+\]:\s*|^•\s*\[#\d+\]:\s*|^•\s*)(.*)/s)
    const noteText = contentMatch ? contentMatch[1] : cleanText
    
    // Aplică trunchierea: Returnăm textul complet curățat. Trunchierea vizuală se face prin CSS (line-clamp-2).
    return noteText 
  }

  // LOGICĂ DE PARSARE Notițe Indexate (Folosind useMemo)
  const parsedChapterNotes: ParsedNote[] = useMemo(() => {
    // Asigură că tratăm un string valid 
    if (!currentScratchpadContent) return []
    
    return currentScratchpadContent
      .split('\n')
      .map((line, index) => {
          const isPinned = line.trim().startsWith("🚩")
          const cleanLine = line.replace(/^🚩\s*/, '')
          
          const matchRangeClean = cleanLine.match(/^•\s*\[#(\d+):(\d+)\]:\s*(.*)/s) 
          const matchCursorClean = cleanLine.match(/^•\s*\[#(\d+)\]:\s*(.*)/s)
  
          if (matchRangeClean) { 
              const start = parseInt(matchRangeClean[1], 10)
              const length = parseInt(matchRangeClean[2], 10)
              return {
                  id: index,
                  start: start,
                  end: start + length, 
                  text: matchRangeClean[3] ? matchRangeClean[3].trim() : 'Fără text',
                  isPinned: isPinned,
              }
          } else if (matchCursorClean) { 
              const start = parseInt(matchCursorClean[1], 10)
              return {
                  id: index,
                  start: start,
                  end: start, 
                  text: matchCursorClean[2] ? matchCursorClean[2].trim() : 'Fără text',
                  isPinned: isPinned,
              }
          }
          return null 
      })
      .filter((note): note is ParsedNote => note !== null)
  }, [currentScratchpadContent])

  // LOGICĂ DE PARSARE Notițe Generale (Folosind useMemo)
  const parsedGeneralNotes: ParsedNote[] = useMemo(() => {
    // Asigură că tratăm un string valid 
    if (!currentGeneralNotesContent) return []

    return currentGeneralNotesContent
      .split('\n')
      .map((line, index) => {
          const isPinned = line.trim().startsWith("🚩")
          const cleanLine = line.replace(/^🚩\s*/, '')
          
          const contentMatch = cleanLine.match(/^•\s*(.*)/s)
          
          if (contentMatch && contentMatch[1].trim()) {
              return {
                  id: index,
                  start: -1, 
                  end: -1,
                  text: contentMatch[1].trim(), 
                  isPinned: isPinned,
              }
          }
          return null
      })
      .filter((note): note is ParsedNote => note !== null)
  }, [currentGeneralNotesContent])


  // Aplicăm filtrarea PIN
  const finalChapterNotes = filterPinned 
    ? parsedChapterNotes.filter(note => note.isPinned) 
    : parsedChapterNotes
    
  // Notițele generale nu ar trebui să fie filtrate PIN dacă nu sunt indexate,
  // dar păstrăm logica de filtrare în caz că se dorește implementarea vizuală a PIN-ului în editorul brut
  const finalGeneralNotes = filterPinned 
    ? parsedGeneralNotes.filter(note => note.isPinned) 
    : parsedGeneralNotes


  // Funcție pentru adăugarea notiței indexate (Păstrată neschimbată)
  const handleAddSelectionNote = () => {
    if (isViewingGeneralNotesOnly) return 
    
    if (currentStart !== null && currentStart >= 0) {
      const notePrefix = selectionLength > 0 
        ? `• [#${currentStart}:${selectionLength}]: ` 
        : `• [#${currentStart}]: `
      onAddNote(notePrefix)
    }
  }
  
  // Funcție de randare a notițelor
  const renderNote = (note: ParsedNote, type: 'scratchpad' | 'general') => {
    const noteTitle = note.start === -1 
      ? 'General'
      : note.start === note.end 
        ? `#${note.start}`
        : `#${note.start}-${note.end}`
    
    // Obținem textul complet curățat
    const displayNoteContent = truncateText(note.text)
    const firstLineLength = note.text.split('\n').find(line => line.trim().length > 0)?.length || 0
    // Butonul de View apare dacă textul e multilinie SAU mai lung decât limita de trunchiere SAU este notiță generală
    const isTruncatedOrGeneral = note.text.includes('\n') || firstLineLength > MAX_NOTE_LENGTH || note.start === -1
    
    // Acțiunea la click pe textul notiței
    const onClickAction = note.start !== -1 
        ? () => onNavigateToSelection(note.start, note.end)
        : () => onViewNote(noteTitle, note.text)
    
    return (
      <div 
        key={`${type}-${note.id}`} 
        // APLICĂ TRANZIȚIA AICI
        className="group flex flex-col p-1 rounded-sm transition-colors duration-500 ease-in-out text-sm break-words border-b last:border-b-0 hover:bg-muted"
      >
        <div className="flex justify-between items-start">
          <div 
            className="flex-1 cursor-pointer"
            onClick={onClickAction}
          >
            <span className="font-bold text-primary mr-1 transition-colors duration-500 ease-in-out">{noteTitle}:</span>
            {/* MODIFICAT: line-clamp-2 limitează vizual la 2 linii */}
            <span className="text-foreground line-clamp-2 transition-colors duration-500 ease-in-out">{displayNoteContent}</span>
          </div>

          {/* Butoane de Acțiune (Vizualizare, Pin, Edit, Delete) */}
          <div className="flex items-center ml-2 space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {/* Butonul de Vizualizare Integrală */}
            {isTruncatedOrGeneral && (
              <TooltipProvider delayDuration={100}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 transition-colors duration-500 ease-in-out" // APLICĂ TRANZIȚIA
                      onClick={(e) => { 
                          e.stopPropagation(); 
                          onViewNote(noteTitle, note.text);
                      }}
                    >
                      <BookOpen className="w-3 h-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Citeste Notița</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            {/* Butonul de PIN - Se afișează ÎNTOTDEAUNA */}
            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={`h-6 w-6 ${note.isPinned ? 'text-red-500' : 'text-gray-500'} transition-colors duration-500 ease-in-out`} // APLICĂ TRANZIȚIA
                    onClick={(e) => { e.stopPropagation(); onTogglePinNote(type, note.id); }}
                  >
                    <Flag className="w-3 h-3" fill={note.isPinned ? 'currentColor' : 'none'} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{note.isPinned ? 'Anulează PIN' : 'Pune PIN'}</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Butonul de Editare */}
            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 transition-colors duration-500 ease-in-out" // APLICĂ TRANZIȚIA
                    onClick={(e) => { e.stopPropagation(); onEditNote(type, note.id); }}
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Editează Notița</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Butonul de Ștergere */}
            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 text-red-500 transition-colors duration-500 ease-in-out" // APLICĂ TRANZIȚIA
                    onClick={(e) => { e.stopPropagation(); onDeleteNote(type, note.id); }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Șterge Notița</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>
    )
  }

  return (
    // APLICĂ TRANZIȚIA PE CONTAINERUL PRINCIPAL
    <div className="w-[350px] border-l p-4 flex flex-col space-y-4 transition-colors duration-500 ease-in-out">
      {/* APLICĂ TRANZIȚIA PE CARD */}
      <Card className="p-2 space-y-2 flex flex-col h-full transition-colors duration-500 ease-in-out"> 
        
        {/* Word Counter */}
        <div className="flex justify-between items-center pb-1">
          {/* APLICĂ TRANZIȚIA PE TEXT */}
          <span className="font-semibold text-sm transition-colors duration-500 ease-in-out">Cuvinte Capitol:</span>
          <span className="font-bold text-lg text-primary transition-colors duration-500 ease-in-out">{wordCount}</span>
        </div>

        {/* APLICĂ TRANZIȚIA PE SEPARATOR */}
        <Separator className="transition-colors duration-500 ease-in-out" />

        {/* Câmpul de Poziție/Index și Buton Adaugă Notiță Indexată */}
        {/* MODIFICAT: py-1 -> pb-0 */}
        <div className="flex justify-between items-center pb-0 pt-1"> 
          <div className="flex flex-col text-xs font-semibold">
             {/* APLICĂ TRANZIȚIA PE TEXT */}
             {selectionLength > 0 ? (
                <span className="transition-colors duration-500 ease-in-out">Sel.: **{currentStart} - {currentEnd}**</span> 
             ) : (
                <span className="transition-colors duration-500 ease-in-out">Poz. Cursor: **{currentStart}**</span> 
             )}
             <span className="text-muted-foreground font-normal transition-colors duration-500 ease-in-out">
                {selectionLength > 0 ? `Lungime: ${selectionLength} caractere` : `Lungime: 0 caractere`}
             </span>
          </div>
          <Button 
            variant="default" 
            size="sm" 
            // APLICĂ TRANZIȚIA PE BUTON
            className="h-7 px-2 text-xs gap-1 transition-colors duration-500 ease-in-out"
            onClick={handleAddSelectionNote} 
            disabled={currentStart === null || currentStart < 0 || isViewingGeneralNotesOnly} 
          >
            <Plus className="w-3 h-3" />
            Adaugă Notiță
          </Button>
        </div>

        {/* Butonul Notițe Generale / Notițe Indexate - Acum lipit de secțiunea de mai sus */}
        {/* MODIFICAT: pt-1 -> pt-0 */}
        <div className="flex justify-between items-center pt-0"> 
            {/* APLICĂ TRANZIȚIA PE TEXT */}
            <p className="text-xs font-semibold transition-colors duration-500 ease-in-out">Mod Vizualizare Notițe:</p>
            <Button 
                variant={isViewingGeneralNotesOnly ? "default" : "outline"} 
                size="sm" 
                // APLICĂ TRANZIȚIA PE BUTON
                className="h-6 px-2 text-xs gap-1 transition-colors duration-500 ease-in-out" 
                onClick={() => setIsViewingGeneralNotesOnly(!isViewingGeneralNotesOnly)}
            >
                <NotebookText className="w-3 h-3" /> 
                {isViewingGeneralNotesOnly ? 'Notițe Indexate' : 'Notițe Generale'}
            </Button>
        </div>
        
        {/* Separatorul de aici A FOST ELIMINAT anterior */}


        {/* Scratchpad (Secțiunea de Notițe) - Acum lipită de secțiunea de mai sus */}
        <div className="flex flex-col flex-grow pt-0 overflow-y-hidden"> 
          <div className="flex justify-between items-center mb-1">
            {/* APLICĂ TRANZIȚIA PE TITLU */}
            <h3 className="font-semibold text-sm flex items-center gap-1 transition-colors duration-500 ease-in-out">
                {isViewingGeneralNotesOnly ? (
                    'Vizualizare Notițe Generale'
                ) : (
                    'Vizualizare Notițe Indexate'
                )}
            </h3>
            
            <div className="flex items-center gap-2">
                {/* Butonul de Filtrare PIN (Afișat doar pentru notițele indexate) */}
                {!isViewingGeneralNotesOnly && (
                    <TooltipProvider delayDuration={100}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button 
                                    variant={filterPinned ? "default" : "outline"} 
                                    size="icon" 
                                    // APLICĂ TRANZIȚIA PE BUTON
                                    className="h-6 w-6 p-0 transition-colors duration-500 ease-in-out" 
                                    onClick={() => setFilterPinned(!filterPinned)}
                                >
                                    <Flag className="w-3 h-3" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                {/* APLICĂ TRANZIȚIA PE TEXT */}
                                <span className="transition-colors duration-500 ease-in-out">{filterPinned ? 'Arată Toate' : 'Filtrează PIN'}</span>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )}
            </div>
          </div>
          
          {/* Vizualizare Notițe Indexate */}
          {!isViewingGeneralNotesOnly && (
            // CORECTAT: RE-ADĂUGAT flex-grow pentru a se extinde vertical
            <div className="pb-2 flex flex-col flex-grow">
                {/* APLICĂ TRANZIȚIA PE TEXT */}
                <p className="text-xs font-semibold text-muted-foreground mb-1 transition-colors duration-500 ease-in-out">
                    Notițe Indexate ({finalChapterNotes.length})
                    {filterPinned && ' (Filtrate PIN)'}
                </p>
                {/* APLICĂ TRANZIȚIA PE CONTAINERUL LISTEI DE NOTIȚE */}
                <div className={`min-h-[50px] max-h-[45.51vh] overflow-y-auto border rounded-md p-2 bg-card ${scratchpadClass} transition-colors duration-500 ease-in-out`}>
                    {finalChapterNotes.length > 0 ? (
                        finalChapterNotes.map(note => renderNote(note, 'scratchpad'))
                    ) : (
                        <p className="text-muted-foreground text-sm transition-colors duration-500 ease-in-out">
                            {filterPinned ? 'Nici o notiță indexată PIN-uită.' : 'Nici o notiță indexată.'}
                        </p>
                    )}
                </div>
                
                {/* Editor Brut Notițe Indexate (Ascuns) */}
                <div className="hidden">
                    <Textarea
                        ref={scratchpadRef}
                        value={currentScratchpadContent}
                        onChange={onScratchpadChange}
                        placeholder={`Adaugă notițe indexate: \n• [#revizuiește:aici]: revizuiește aici`} 
                        className="hidden"
                        spellCheck={false}
                    />
                </div>
            </div>
          )}
          
          {/* Vizualizare Notițe Generale (Textarea) */}
          {isViewingGeneralNotesOnly && (
            // MODIFICAT: Eliminat flex-grow din div-ul wrapper
            <div className={`pt-2 max-h-full`}>
                {/* APLICĂ TRANZIȚIA PE TEXT */}
                <p className="text-xs font-semibold text-muted-foreground mb-1 transition-colors duration-500 ease-in-out">Notițe Generale</p>
                 {/* APLICĂ TRANZIȚIA PE TEXTAREA */}
                <Textarea
                    ref={generalNotesRef} 
                    value={
                        currentGeneralNotesContent.trim() === ''
                            ? '• '
                            : currentGeneralNotesContent
                    } 
                    onChange={onGeneralNotesChange} 
                    placeholder={`Începe să scrii o notiță generală. Fiecare linie nouă va începe automat cu '• '`} 
                    className={`min-h-[200px] max-h-[45vh] resize-none ${scratchpadClass} ${
                        isBookFormatActive ? "font-serif text-justify" : "font-sans text-left"
                    } p-3 transition-colors duration-500 ease-in-out`}
                    spellCheck={false}
                />
            </div>
          )}

        </div>
      </Card>
    </div>
  )
}