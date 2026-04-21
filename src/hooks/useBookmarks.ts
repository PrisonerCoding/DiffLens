import { useState, useEffect, useCallback } from 'react'

export interface Bookmark {
  lineNumber: number
  side: 'left' | 'right'
  label?: string
  timestamp: number
}

const STORAGE_KEY = 'beyond-compare-bookmarks'

export function useBookmarks(sessionId?: string): {
  bookmarks: Bookmark[]
  addBookmark: (lineNumber: number, side: 'left' | 'right', label?: string) => void
  removeBookmark: (lineNumber: number, side: 'left' | 'right') => void
  toggleBookmark: (lineNumber: number, side: 'left' | 'right') => void
  clearBookmarks: () => void
  goToBookmark: (bookmark: Bookmark) => void
  getBookmarksForSide: (side: 'left' | 'right') => Bookmark[]
  nextBookmark: (currentLine: number, side: 'left' | 'right') => Bookmark | null
  prevBookmark: (currentLine: number, side: 'left' | 'right') => Bookmark | null
  isBookmarked: (lineNumber: number, side: 'left' | 'right') => boolean
} {
  const storageKey = sessionId ? `${STORAGE_KEY}-${sessionId}` : STORAGE_KEY

  const [bookmarks, setBookmarks] = useState<Bookmark[]>(() => {
    const stored = localStorage.getItem(storageKey)
    if (stored) {
      try {
        return JSON.parse(stored)
      } catch {
        return []
      }
    }
    return []
  })

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(bookmarks))
  }, [bookmarks, storageKey])

  const addBookmark = useCallback((lineNumber: number, side: 'left' | 'right', label?: string) => {
    setBookmarks(prev => {
      const exists = prev.some(b => b.lineNumber === lineNumber && b.side === side)
      if (exists) return prev
      return [...prev, { lineNumber, side, label, timestamp: Date.now() }]
    })
  }, [])

  const removeBookmark = useCallback((lineNumber: number, side: 'left' | 'right') => {
    setBookmarks(prev => prev.filter(b => !(b.lineNumber === lineNumber && b.side === side)))
  }, [])

  const toggleBookmark = useCallback((lineNumber: number, side: 'left' | 'right') => {
    setBookmarks(prev => {
      const exists = prev.some(b => b.lineNumber === lineNumber && b.side === side)
      if (exists) {
        return prev.filter(b => !(b.lineNumber === lineNumber && b.side === side))
      }
      return [...prev, { lineNumber, side, timestamp: Date.now() }]
    })
  }, [])

  const clearBookmarks = useCallback(() => {
    setBookmarks([])
  }, [])

  const getBookmarksForSide = useCallback((side: 'left' | 'right') => {
    return bookmarks.filter(b => b.side === side).sort((a, b) => a.lineNumber - b.lineNumber)
  }, [bookmarks])

  const isBookmarked = useCallback((lineNumber: number, side: 'left' | 'right') => {
    return bookmarks.some(b => b.lineNumber === lineNumber && b.side === side)
  }, [bookmarks])

  const nextBookmark = useCallback((currentLine: number, side: 'left' | 'right') => {
    const sideBookmarks = getBookmarksForSide(side)
    const next = sideBookmarks.find(b => b.lineNumber > currentLine)
    return next || (sideBookmarks.length > 0 ? sideBookmarks[0] : null)
  }, [getBookmarksForSide])

  const prevBookmark = useCallback((currentLine: number, side: 'left' | 'right') => {
    const sideBookmarks = getBookmarksForSide(side)
    const reversed = [...sideBookmarks].reverse()
    const prev = reversed.find(b => b.lineNumber < currentLine)
    return prev || (sideBookmarks.length > 0 ? reversed[0] : null)
  }, [getBookmarksForSide])

  const goToBookmark = useCallback((bookmark: Bookmark) => {
    // This will be handled by the editor component
    window.dispatchEvent(new CustomEvent('goto-bookmark', {
      detail: { lineNumber: bookmark.lineNumber, side: bookmark.side }
    }))
  }, [])

  return {
    bookmarks,
    addBookmark,
    removeBookmark,
    toggleBookmark,
    clearBookmarks,
    goToBookmark,
    getBookmarksForSide,
    nextBookmark,
    prevBookmark,
    isBookmarked,
  }
}