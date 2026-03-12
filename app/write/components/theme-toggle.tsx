/**
 * COMPONENTĂ: Buton pentru comutarea teme (light/dark)
 * Folosește hook-ul useTheme din functions/theme.ts
 */

"use client"

import { Button } from "@/components/ui/button"
import { Sun, Moon } from "lucide-react"
// Presupunem că acest hook aplică/elimină clasa 'dark' pe document.documentElement
import { useTheme } from "../functions/theme" 

export const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme()

  return (
    // ADAUGĂ TRANZIȚIA PE CULORI ȘI UN HOVER SOFT
    <Button 
        variant="ghost" 
        size="icon" 
        onClick={toggleTheme} 
        aria-label="Toggle theme"
        className="text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors duration-500 ease-in-out"
    >
      {/* Iconița Sun este vizibilă în Light Mode și rotită/invizibilă în Dark Mode */}
      {theme === "light" ? (
        <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      ) : (
        /* Iconița Moon este invizibilă în Light Mode și vizibilă în Dark Mode */
        <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}