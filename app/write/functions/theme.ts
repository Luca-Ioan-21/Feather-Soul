// theme.ts

"use client"

/**
 * FUNCȚII PENTRU GESTIONAREA TEMEI ȘI FONTULUI
 * - Gestionează tema (light/dark)
 * - Controlează mărimea fontului (small/medium/large)
 */

import { useState, useEffect } from "react"

export type FontSize = "small" | "medium" | "large"

// NOU: Cheie de localStorage pentru a memora MODUL (light/dark)
const APP_MODE_KEY = 'app-mode'

// Funcții ajutătoare pentru temă
// CORECTAT: S-au adăugat toate ID-urile noilor teme întunecate
const isThemeDark = (themeName: string) => [
    'negru', 
    'navy', 
    'midnight', 
    'dark_cinder', 
    'dark_forest', 
    'espresso', 
    'night_blue'
].includes(themeName)

const getSavedThemeForMode = (isDark: boolean) => {
    const key = isDark ? 'app-theme-dark' : 'app-theme-light'
    // Fallback la tema implicită a modului
    return localStorage.getItem(key) || (isDark ? 'negru' : 'alb') 
}

// Funcție ajutătoare pentru a aplica tema pe elementul <html>
// MODIFICATĂ: Acum salvează și modul în APP_MODE_KEY
const applyTheme = (themeName: string) => {
    const root = document.documentElement
    const isDarkTheme = isThemeDark(themeName) 
    const mode = isDarkTheme ? "dark" : "light" // Determină modul

    // 1. GESTIONAREA LIGHT/DARK MODE (clasa .dark)
    root.classList.toggle('dark', isDarkTheme)

    // 2. GESTIONAREA CULORII SPECIFICE (data-theme)
    const dataTheme = (themeName === 'alb' || themeName === 'negru') ? 'default' : themeName
    root.setAttribute('data-theme', dataTheme)

    // 3. NOU: Salvează modul curent. Această cheie va fi folosită la refresh.
    localStorage.setItem(APP_MODE_KEY, mode)
}

// NOU: Funcție pentru a citi modul salvat la încărcarea paginii
const getInitialMode = (): 'light' | 'dark' => {
    if (typeof window !== "undefined") {
        const savedMode = localStorage.getItem(APP_MODE_KEY) as 'light' | 'dark'
        // Dacă nu există nimic salvat, folosim implicit 'light'
        return savedMode || 'light' 
    }
    return 'light'
}


/**
 * Hook pentru gestionarea temei light/dark
 * CORECTAT: Acum citește modul salvat din 'app-mode' la inițializare.
 */
export const useTheme = () => {
    const initialMode = getInitialMode()
    const [theme, setTheme] = useState(initialMode)

    useEffect(() => {
        // CORECȚIE CRITICĂ: APLICĂ TEMA SALVATĂ ȘI MODUL SALVAT LA PRIMA RULARE (inclusiv după refresh)
        if (typeof window !== "undefined") {
            const currentMode = getInitialMode()
            const isDark = currentMode === 'dark'
            
            // Citim tema specifică ('navy' sau 'vernil') salvată pentru modul citit
            const savedSpecificTheme = getSavedThemeForMode(isDark) 
            
            // Aplică tema imediat, setând clasa 'dark', atributul 'data-theme' și salvând 'app-mode'
            applyTheme(savedSpecificTheme) 
            
            // Actualizăm starea internă pentru ThemeToggle
            setTheme(isThemeDark(savedSpecificTheme) ? "dark" : "light")
        }
    }, []) 

    // Funcția care comută între Light/Dark (apelată de ThemeToggle din sidebar)
    const toggleTheme = () => {
        // Determină NOUA stare a modului (dacă acum e dark, noua stare va fi light)
        const currentIsDark = document.documentElement.classList.contains('dark')
        const newIsDark = !currentIsDark
        
        // 1. Găsim ULTIMA temă specifică salvată pentru NOUA stare (Light/Dark)
        const newThemeName = getSavedThemeForMode(newIsDark) 
        
        // 2. Aplicăm tema găsită (Ex: de la 'navy' la 'vernil'). Această funcție salvează acum și APP_MODE_KEY.
        applyTheme(newThemeName) 

        // 3. Actualizăm starea hook-ului
        setTheme(newIsDark ? "dark" : "light")
    }

    return { theme, toggleTheme }
}

/**
 * Hook pentru gestionarea mărimii fontului
 * Salvează preferința în localStorage
 */
export const useFontSize = () => {
  const [currentFontSize, setCurrentFontSize] = useState<FontSize>(() => {
    if (typeof window !== "undefined") {
      const savedSize = localStorage.getItem("appFontSize") as FontSize
      if (savedSize && ["small", "medium", "large"].includes(savedSize)) {
        return savedSize
      }
    }
    return "medium"
  })

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("appFontSize", currentFontSize)
    }
  }, [currentFontSize])

  const toggleFontSize = () => {
    setCurrentFontSize((prev) => {
      if (prev === "small") return "medium"
      if (prev === "medium") return "large"
      return "small"
    })
  }

  // 🟢 AICI SUNT MODIFICĂRILE PENTRU DIMENSIUNI MAI MARI
  const fontSizeClasses = {
    // Small este acum mai mare (fostul Medium)
    small: { 
        mainContentClass: "!text-lg",      // Text 18px
        scratchpadClass: "!text-base",     // Notițe 16px
        iconClass: "text-xl" 
    },
    // Medium este acum mult mai vizibil
    medium: { 
        mainContentClass: "!text-2xl",     // Text 24px (Mare)
        scratchpadClass: "!text-lg",       // Notițe 18px
        iconClass: "text-2xl" 
    },
    // Large este acum foarte mare
    large: { 
        mainContentClass: "!text-3xl",     // Text 30px (Foarte Mare)
        scratchpadClass: "!text-xl",       // Notițe 20px
        iconClass: "text-3xl" 
    },
  }

  return { currentFontSize, toggleFontSize, fontSizeClasses }
}

/**
 * Mock router pentru navigare simulată
 * Redirecționează utilizatorii la pagini specifice
 */
export const router = {
  push: (path: string) => {
    console.log(`Navigare simulată: Se încearcă accesarea căii ${path}`)
  },
  back: () => console.log("Navigare simulată: Back"),
  forward: () => console.log("Navigare simulată: Forward"),
  refresh: () => console.log("Navigare simulată: Refresh"),
  replace: (path: string) => console.log(`Navigare simulată: Replace cu ${path}`),
}