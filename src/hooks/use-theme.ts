import { useEffect, useState } from 'react'

export type Theme = 'light' | 'dark' | 'system'

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    // Check if we're in VSCode extension context
    if (typeof window !== 'undefined' && window.acquireVsCodeApi) {
      // In VSCode, detect theme from CSS variables or body class
      const isDark = document.body.classList.contains('vscode-dark') ||
                     document.body.classList.contains('vscode-high-contrast') ||
                     getComputedStyle(document.documentElement).getPropertyValue('--vscode-editor-background').includes('30')
      return isDark ? 'dark' : 'light'
    }
    
    // Fallback to localStorage or system preference
    const stored = localStorage.getItem('theme') as Theme
    if (stored) return stored
    
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  useEffect(() => {
    const root = window.document.documentElement
    
    // Remove previous theme classes
    root.classList.remove('light', 'dark')
    
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      root.classList.add(systemTheme)
    } else {
      root.classList.add(theme)
    }
    
    // Save to localStorage (except when in VSCode)
    if (typeof window !== 'undefined' && !window.acquireVsCodeApi) {
      localStorage.setItem('theme', theme)
    }
  }, [theme])

  useEffect(() => {
    // Listen for VSCode theme changes
    if (typeof window !== 'undefined' && window.acquireVsCodeApi) {
      const observer = new MutationObserver(() => {
        const isDark = document.body.classList.contains('vscode-dark') ||
                       document.body.classList.contains('vscode-high-contrast') ||
                       getComputedStyle(document.documentElement).getPropertyValue('--vscode-editor-background').includes('30')
        setTheme(isDark ? 'dark' : 'light')
      })
      
      observer.observe(document.body, { attributes: true, attributeFilter: ['class'] })
      
      return () => observer.disconnect()
    }
    
    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      if (theme === 'system') {
        setTheme('system') // Trigger re-render
      }
    }
    
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme])

  return { theme, setTheme }
}

// Extend window type for VSCode API
declare global {
  interface Window {
    acquireVsCodeApi?: () => any
  }
}