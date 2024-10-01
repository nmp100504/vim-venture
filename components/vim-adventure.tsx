"use client"

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Command {
  instruction: string
  command: string
  effect: (text: string, cursorIndex: number) => { text: string; cursorIndex: number }
  description: string
  category: string
}

const commands: Command[] = [
  // Global
  { 
    instruction: "Open help for keyword", 
    command: ":h[elp] keyword", 
    effect: (text, cursorIndex) => ({ text, cursorIndex }),
    description: ":h[elp] keyword - open help for keyword",
    category: "Global"
  },
  { 
    instruction: "Save file as", 
    command: ":sav[eas] file", 
    effect: (text, cursorIndex) => ({ text, cursorIndex }),
    description: ":sav[eas] file - save file as",
    category: "Global"
  },
  { 
    instruction: "Close current pane", 
    command: ":clo[se]", 
    effect: (text, cursorIndex) => ({ text, cursorIndex }),
    description: ":clo[se] - close current pane",
    category: "Global"
  },
  { 
    instruction: "Open a terminal window", 
    command: ":ter[minal]", 
    effect: (text, cursorIndex) => ({ text, cursorIndex }),
    description: ":ter[minal] - open a terminal window",
    category: "Global"
  },
  { 
    instruction: "Open man page for word under the cursor", 
    command: "K", 
    effect: (text, cursorIndex) => ({ text, cursorIndex }),
    description: "K - open man page for word under the cursor",
    category: "Global"
  },

  // Cursor movement
  { 
    instruction: "Move cursor left", 
    command: "h", 
    effect: (text, cursorIndex) => ({ text, cursorIndex: Math.max(0, cursorIndex - 1) }),
    description: "h - move cursor left",
    category: "Cursor Movement"
  },
  { 
    instruction: "Move cursor down", 
    command: "j", 
    effect: (text, cursorIndex) => {
      const lines = text.split('\n')
      const currentLine = text.slice(0, cursorIndex).split('\n').length - 1
      if (currentLine < lines.length - 1) {
        const currentColumn = cursorIndex - text.lastIndexOf('\n', cursorIndex - 1) - 1
        const nextLineLength = lines[currentLine + 1].length
        return { text, cursorIndex: cursorIndex + lines[currentLine].length + 1 + Math.min(currentColumn, nextLineLength) }
      }
      return { text, cursorIndex }
    },
    description: "j - move cursor down",
    category: "Cursor Movement"
  },
  { 
    instruction: "Move cursor up", 
    command: "k", 
    effect: (text, cursorIndex) => {
      const lines = text.split('\n')
      const currentLine = text.slice(0, cursorIndex).split('\n').length - 1
      if (currentLine > 0) {
        const currentColumn = cursorIndex - text.lastIndexOf('\n', cursorIndex - 1) - 1
        const prevLineLength = lines[currentLine - 1].length
        return { text, cursorIndex: cursorIndex - lines[currentLine - 1].length - 1 - Math.min(currentColumn, prevLineLength) }
      }
      return { text, cursorIndex }
    },
    description: "k - move cursor up",
    category: "Cursor Movement"
  },
  { 
    instruction: "Move cursor right", 
    command: "l", 
    effect: (text, cursorIndex) => ({ text, cursorIndex: Math.min(text.length - 1, cursorIndex + 1) }),
    description: "l - move cursor right",
    category: "Cursor Movement"
  },
  { 
    instruction: "Move cursor down (multi-line text)", 
    command: "gj", 
    effect: (text, cursorIndex) => {
      const lines = text.split('\n')
      const currentLine = text.slice(0, cursorIndex).split('\n').length - 1
      if (currentLine < lines.length - 1) {
        const currentColumn = cursorIndex - text.lastIndexOf('\n', cursorIndex - 1) - 1
        const nextLineLength = lines[currentLine + 1].length
        return { text, cursorIndex: cursorIndex + lines[currentLine].length + 1 + Math.min(currentColumn, nextLineLength) }
      }
      return { text, cursorIndex }
    },
    description: "gj - move cursor down (multi-line text)",
    category: "Cursor Movement"
  },
  { 
    instruction: "Move cursor up (multi-line text)", 
    command: "gk", 
    effect: (text, cursorIndex) => {
      const lines = text.split('\n')
      const currentLine = text.slice(0, cursorIndex).split('\n').length - 1
      if (currentLine > 0) {
        const currentColumn = cursorIndex - text.lastIndexOf('\n', cursorIndex - 1) - 1
        const prevLineLength = lines[currentLine - 1].length
        return { text, cursorIndex: cursorIndex - lines[currentLine - 1].length - 1 - Math.min(currentColumn, prevLineLength) }
      }
      return { text, cursorIndex }
    },
    description: "gk - move cursor up (multi-line text)",
    category: "Cursor Movement"
  },
  { 
    instruction: "Move to top of screen", 
    command: "H", 
    effect: (text, cursorIndex) => ({ text, cursorIndex: 0 }),
    description: "H - move to top of screen",
    category: "Cursor Movement"
  },
  { 
    instruction: "Move to middle of screen", 
    command: "M", 
    effect: (text, cursorIndex) => {
      const lines = text.split('\n')
      const middleLine = Math.floor(lines.length / 2)
      return { text, cursorIndex: text.indexOf('\n', text.indexOf('\n', 0) + 1) + 1 }
    },
    description: "M - move to middle of screen",
    category: "Cursor Movement"
  },
  { 
    instruction: "Move to bottom of screen", 
    command: "L", 
    effect: (text, cursorIndex) => ({ text, cursorIndex: text.length - 1 }),
    description: "L - move to bottom of screen",
    category: "Cursor Movement"
  },
  { 
    instruction: "Jump forwards to the start of a word", 
    command: "w", 
    effect: (text, cursorIndex) => {
      const afterCursor = text.slice(cursorIndex)
      const nextWordStart = afterCursor.search(/\S/)
      return { text, cursorIndex: cursorIndex + (nextWordStart === -1 ? afterCursor.length : nextWordStart) }
    },
    description: "w - jump forwards to the start of a word",
    category: "Cursor Movement"
  },
  { 
    instruction: "Jump forwards to the start of a word (words can contain punctuation)", 
    command: "W", 
    effect: (text, cursorIndex) => {
      const afterCursor = text.slice(cursorIndex)
      const nextWordStart = afterCursor.search(/\S/)
      return { text, cursorIndex: cursorIndex + (nextWordStart === -1 ? afterCursor.length : nextWordStart) }
    },
    description: "W - jump forwards to the start of a word (words can contain punctuation)",
    category: "Cursor Movement"
  },
  { 
    instruction: "Jump forwards to the end of a word", 
    command: "e", 
    effect: (text, cursorIndex) => {
      const afterCursor = text.slice(cursorIndex)
      const nextWordEnd = afterCursor.search(/\S\s/)
      return { text, cursorIndex: cursorIndex + (nextWordEnd === -1 ? afterCursor.length - 1 : nextWordEnd) }
    },
    description: "e - jump forwards to the end of a word",
    category: "Cursor Movement"
  },
  { 
    instruction: "Jump forwards to the end of a word (words can contain punctuation)", 
    command: "E", 
    effect: (text, cursorIndex) => {
      const afterCursor = text.slice(cursorIndex)
      const nextWordEnd = afterCursor.search(/\S\s/)
      return { text, cursorIndex: cursorIndex + (nextWordEnd === -1 ? afterCursor.length - 1 : nextWordEnd) }
    },
    description: "E - jump forwards to the end of a word (words can contain punctuation)",
    category: "Cursor Movement"
  },
  { 
    instruction: "Jump backwards to the start of a word", 
    command: "b", 
    effect: (text, cursorIndex) => {
      const beforeCursor = text.slice(0, cursorIndex).split('').reverse().join('')
      const lastWordStart = beforeCursor.search(/\S/)
      return { text, cursorIndex: cursorIndex - (lastWordStart === -1 ? cursorIndex : lastWordStart) }
    },
    description: "b - jump backwards to the start of a word",
    category: "Cursor Movement"
  },
  { 
    instruction: "Jump backwards to the start of a word (words can contain punctuation)", 
    command: "B", 
    effect: (text, cursorIndex) => {
      const beforeCursor = text.slice(0, cursorIndex).split('').reverse().join('')
      const lastWordStart = beforeCursor.search(/\S/)
      return { text, cursorIndex: cursorIndex - (lastWordStart === -1 ? cursorIndex : lastWordStart) }
    },
    description: "B - jump backwards to the start of a word (words can contain punctuation)",
    category: "Cursor Movement"
  },
  { 
    instruction: "Jump backwards to the end of a word", 
    command: "ge", 
    effect: (text, cursorIndex) => {
      const beforeCursor = text.slice(0, cursorIndex).split('').reverse().join('')
      const lastWordEnd = beforeCursor.search(/\s\S/)
      return { text, cursorIndex: cursorIndex - (lastWordEnd === -1 ? cursorIndex : lastWordEnd + 1) }
    },
    description: "ge - jump backwards to the end of a word",
    category: "Cursor Movement"
  },
  { 
    instruction: "Jump backwards to the end of a word (words can contain punctuation)", 
    command: "gE", 
    effect: (text, cursorIndex) => {
      const beforeCursor = text.slice(0, cursorIndex).split('').reverse().join('')
      const lastWordEnd = beforeCursor.search(/\s\S/)
      return { text, cursorIndex: cursorIndex - (lastWordEnd === -1 ? cursorIndex : lastWordEnd + 1) }
    },
    description: "gE - jump backwards to the end of a word (words can contain punctuation)",
    category: "Cursor Movement"
  },
  { 
    instruction: "Move cursor to matching character", 
    command: "%", 
    effect: (text, cursorIndex) => {
      const pairs: { [key: string]: string } = { '(': ')', '{': '}', '[': ']' }
      const openChars = Object.keys(pairs)
      const closeChars = Object.values(pairs)
      const currentChar = text[cursorIndex]
      
      if (openChars.includes(currentChar)) {
        let depth = 1
        for (let i = cursorIndex + 1; i < text.length; i++) {
          if (text[i] === currentChar) depth++
          if (text[i] === pairs[currentChar]) depth--
          if (depth === 0) return { text, cursorIndex: i }
        }
      } else if (closeChars.includes(currentChar)) {
        let depth = 1
        for (let i = cursorIndex - 1; i >= 0; i--) {
          if (text[i] === currentChar) depth++
          if (openChars.includes(text[i]) && pairs[text[i]] === currentChar) depth--
          if (depth === 0) return { text, cursorIndex: i }
        }
      }
      return { text, cursorIndex }
    },
    description: "% - move cursor to matching character",
    category: "Cursor Movement"
  },
  { 
    instruction: "Jump to the start of the line", 
    command: "0", 
    effect: (text, cursorIndex) => {
      const currentLineStart = text.lastIndexOf('\n', cursorIndex - 1) + 1
      return { text, cursorIndex: currentLineStart }
    },
    description: "0 - jump to the start of the line",
    category: "Cursor Movement"
  },
  { 
    instruction: "Jump to the first non-blank character of the line", 
    command: "^", 
    effect: (text, cursorIndex) => {
      const currentLineStart = text.lastIndexOf('\n', cursorIndex - 1) + 1
      const firstNonBlank = text.slice(currentLineStart).search(/\S/)
      return { text, cursorIndex: currentLineStart + firstNonBlank }
    },
    description: "^ - jump to the first non-blank character of the line",
    category: "Cursor Movement"
  },
  { 
    instruction: "Jump to the end of the line", 
    command: "$", 
    effect: (text, cursorIndex) => {
      const currentLineEnd = text.indexOf('\n', cursorIndex)
      return { text, cursorIndex: currentLineEnd === -1 ? text.length - 1 : currentLineEnd - 1 }
    },
    description: "$ - jump to the end of the line",
    category: "Cursor Movement"
  },
  { 
    instruction: "Jump to the last non-blank character of the line", 
    command: "g_", 
    effect: (text, cursorIndex) => {
      const currentLineEnd = text.indexOf('\n', cursorIndex)
      const lineEndIndex = currentLineEnd === -1 ? text.length : currentLineEnd
      const lastNonBlank = text.slice(0, lineEndIndex).trimEnd().length - 1
      return { text, cursorIndex: lastNonBlank }
    },
    description: "g_ - jump to the last non-blank character of the line",
    category: "Cursor Movement"
  },
  { 
    instruction: "Go to the first line of the document", 
    command: "gg", 
    effect: (text, cursorIndex) => ({ text, cursorIndex: 0 }),
    description: "gg - go to the first line of the document",
    category: "Cursor Movement"
  },
  { 
    instruction: "Go to the last line of the document", 
    command: "G", 
    effect: (text, cursorIndex) => ({ text, cursorIndex: text.length - 1 }),
    description: "G - go to the last line of the document",
    category: "Cursor Movement"
  },

  // Insert mode - inserting/appending text
  { 
    instruction: "Insert before the cursor", 
    command: "i", 
    effect: (text, cursorIndex) => {
      const newText = text.slice(0, cursorIndex) + '_' + text.slice(cursorIndex)
      return { text: newText, cursorIndex }
    },
    description: "i - insert before the cursor",
    category: "Insert Mode"
  },
  { 
    instruction: "Insert at the beginning of the line", 
    command: "I", 
    effect: (text, cursorIndex) => {
      const currentLineStart = text.lastIndexOf('\n', cursorIndex - 1) + 1
      const newText = text.slice(0, currentLineStart) + '_' + text.slice(currentLineStart)
      return { text: newText, cursorIndex: currentLineStart }
    },
    description: "I - insert at the beginning of the line",
    category: "Insert Mode"
  },
  { 
    instruction: "Insert (append) after the cursor", 
    command: "a", 
    effect: (text, cursorIndex) => {
      const newText = text.slice(0, cursorIndex + 1) + '_' + text.slice(cursorIndex + 1)
      return { text: newText, cursorIndex: cursorIndex + 1 }
    },
    description: "a - insert (append) after the cursor",
    category: "Insert Mode"
  },
  { 
    instruction: "Insert (append) at the end of the line", 
    command: "A", 
    effect: (text, cursorIndex) => {
      const currentLineEnd = text.indexOf('\n', cursorIndex)
      const insertIndex = currentLineEnd === -1 ? text.length : currentLineEnd
      const newText = text.slice(0, insertIndex) + '_' + text.slice(insertIndex)
      return { text: newText, cursorIndex: insertIndex }
    },
    description: "A - insert (append) at the end of the line",
    category: "Insert Mode"
  },
  { 
    instruction: "Append (open) a new line below the current line", 
    command: "o", 
    effect: (text, cursorIndex) => {
      const currentLineEnd = text.indexOf('\n', cursorIndex)
      const insertIndex = currentLineEnd === -1 ? text.length : currentLineEnd + 1
      const newText = text.slice(0, insertIndex) + '\n_' + text.slice(insertIndex)
      return { text: newText, cursorIndex: insertIndex + 1 }
    },
    description: "o - append (open) a new line below the current line",
    category: "Insert Mode"
  },
  { 
    instruction: "Append (open) a new line above the current line", 
    command: "O", 
    effect: (text, cursorIndex) => {
      const currentLineStart = text.lastIndexOf('\n', cursorIndex - 1) + 1
      const newText = text.slice(0, currentLineStart) + '_\n' + text.slice(currentLineStart)
      return { text: newText, cursorIndex: currentLineStart }
    },
    description: "O - append (open) a new line above the current line",
    category: "Insert Mode"
  },
  { 
    instruction: "Insert (append) at the end of the word", 
    command: "ea", 
    effect: (text, cursorIndex) => {
      const afterCursor = text.slice(cursorIndex)
      const nextWordEnd = afterCursor.search(/\S\s/)
      const insertIndex = cursorIndex + (nextWordEnd === -1 ? afterCursor.length : nextWordEnd + 1)
      const newText = text.slice(0, insertIndex) + '_' + text.slice(insertIndex)
      return { text: newText, cursorIndex: insertIndex }
    },
    description: "ea - insert (append) at the end of the word",
    category: "Insert Mode"
  },

  // Editing
  { 
    instruction: "Replace a single character", 
    command: "r", 
    effect: (text, cursorIndex) => {
      const newText = text.slice(0, cursorIndex) + '_' + text.slice(cursorIndex + 1)
      return { text: newText, cursorIndex }
    },
    description: "r - replace a single character",
    category: "Editing"
  },
  { 
    instruction: "Replace more than one character, until ESC is pressed", 
    command: "R", 
    effect: (text, cursorIndex) => {
      const newText = text.slice(0, cursorIndex) + '_' + text.slice(cursorIndex + 1)
      return { text: newText, cursorIndex }
    },
    description: "R - replace more than one character, until ESC is pressed",
    category: "Editing"
  },
  { 
    instruction: "Join line below to the current one with one space in between", 
    command: "J", 
    effect: (text, cursorIndex) => {
      const currentLineEnd = text.indexOf('\n', cursorIndex)
      if (currentLineEnd !== -1) {
        const nextLineEnd = text.indexOf('\n', currentLineEnd + 1)
        const joinIndex = nextLineEnd === -1 ? text.length : nextLineEnd
        const newText = text.slice(0, currentLineEnd).trimEnd() + ' ' + text.slice(currentLineEnd + 1, joinIndex).trimStart() + text.slice(joinIndex)
        return { text: newText, cursorIndex }
      }
      return { text, cursorIndex }
    },
    description: "J - join line below to the current one with one space in between",
    category: "Editing"
  },
  { 
    instruction: "Join line below to the current one without space in between", 
    command: "gJ", 
    effect: (text, cursorIndex) => {
      const currentLineEnd = text.indexOf('\n', cursorIndex)
      if (currentLineEnd !== -1) {
        const nextLineEnd = text.indexOf('\n', currentLineEnd + 1)
        const joinIndex = nextLineEnd === -1 ? text.length : nextLineEnd
        const newText = text.slice(0, currentLineEnd) + text.slice(currentLineEnd + 1, joinIndex) + text.slice(joinIndex)
        return { text: newText, cursorIndex }
      }
      return { text, cursorIndex }
    },
    description: "gJ - join line below to the current one without space in between",
    category: "Editing"
  },
  { 
    instruction: "Change (replace) entire line", 
    command: "cc", 
    effect: (text, cursorIndex) => {
      const currentLineStart = text.lastIndexOf('\n', cursorIndex - 1) + 1
      const currentLineEnd = text.indexOf('\n', cursorIndex)
      const newText = text.slice(0, currentLineStart) + '_' + (currentLineEnd === -1 ? '' : text.slice(currentLineEnd))
      return { text: newText, cursorIndex: currentLineStart }
    },
    description: "cc - change (replace) entire line",
    category: "Editing"
  },
  { 
    instruction: "Change (replace) to the end of the line", 
    command: "C", 
    effect: (text, cursorIndex) => {
      const currentLineEnd = text.indexOf('\n', cursorIndex)
      const newText = text.slice(0, cursorIndex) + '_' + (currentLineEnd === -1 ? '' : text.slice(currentLineEnd))
      return { text: newText, cursorIndex }
    },
    description: "C - change (replace) to the end of the line",
    category: "Editing"
  },
  { 
    instruction: "Change (replace) entire word", 
    command: "ciw", 
    effect: (text, cursorIndex) => {
      const beforeCursor = text.slice(0, cursorIndex).split('').reverse().join('')
      const afterCursor = text.slice(cursorIndex)
      const wordStartOffset = beforeCursor.search(/\W/)
      const wordEndOffset = afterCursor.search(/\W/)
      const wordStart = wordStartOffset === -1 ? 0 : cursorIndex - wordStartOffset
      const wordEnd = wordEndOffset === -1 ? text.length : cursorIndex + wordEndOffset
      const newText = text.slice(0, wordStart) + '_' + text.slice(wordEnd)
      return { text: newText, cursorIndex: wordStart }
    },
    description: "ciw - change (replace) entire word",
    category: "Editing"
  },
  { 
    instruction: "Change (replace) to the end of the word", 
    command: "cw", 
    effect: (text, cursorIndex) => {
      const afterCursor = text.slice(cursorIndex)
      const wordEndOffset = afterCursor.search(/\W/)
      const wordEnd = wordEndOffset === -1 ? text.length : cursorIndex + wordEndOffset
      const newText = text.slice(0, cursorIndex) + '_' + text.slice(wordEnd)
      return { text: newText, cursorIndex }
    },
    description: "cw - change (replace) to the end of the word",
    category: "Editing"
  },
  { 
    instruction: "Delete character and substitute text", 
    command: "s", 
    effect: (text, cursorIndex) => {
      const newText = text.slice(0, cursorIndex) + '_' + text.slice(cursorIndex + 1)
      return { text: newText, cursorIndex }
    },
    description: "s - delete character and substitute text",
    category: "Editing"
  },
  { 
    instruction: "Delete line and substitute text", 
    command: "S", 
    effect: (text, cursorIndex) => {
      const currentLineStart = text.lastIndexOf('\n', cursorIndex - 1) + 1
      const currentLineEnd = text.indexOf('\n', cursorIndex)
      const newText = text.slice(0, currentLineStart) + '_' + (currentLineEnd === -1 ? '' : text.slice(currentLineEnd))
      return { text: newText, cursorIndex: currentLineStart }
    },
    description: "S - delete line and substitute text",
    category: "Editing"
  },
  { 
    instruction: "Transpose two letters (delete and paste)", 
    command: "xp", 
    effect: (text, cursorIndex) => {
      if (cursorIndex < text.length - 1) {
        const newText = text.slice(0, cursorIndex) + text[cursorIndex + 1] + text[cursorIndex] + text.slice(cursorIndex + 2)
        return { text: newText, cursorIndex: cursorIndex + 1 }
      }
      return { text, cursorIndex }
    },
    description: "xp - transpose two letters (delete and paste)",
    category: "Editing"
  },
  { 
    instruction: "Undo", 
    command: "u", 
    effect: (text, cursorIndex) => ({ text, cursorIndex }),
    description: "u - undo",
    category: "Editing"
  },
  { 
    instruction: "Restore (undo) last changed line", 
    command: "U", 
    effect: (text, cursorIndex) => ({ text, cursorIndex }),
    description: "U - restore (undo) last changed line",
    category: "Editing"
  },
  { 
    instruction: "Redo", 
    command: "Ctrl + r", 
    effect: (text, cursorIndex) => ({ text, cursorIndex }),
    description: "Ctrl + r - redo",
    category: "Editing"
  },
  { 
    instruction: "Repeat last command", 
    command: ".", 
    effect: (text, cursorIndex) => ({ text, cursorIndex }),
    description: ". - repeat last command",
    category: "Editing"
  },

  // Visual mode
  { 
    instruction: "Start visual mode, mark lines, then do a command (like y-yank)", 
    command: "v", 
    effect: (text, cursorIndex) => ({ text, cursorIndex }),
    description: "v - start visual mode, mark lines, then do a command (like y-yank)",
    category: "Visual Mode"
  },
  { 
    instruction: "Start linewise visual mode", 
    command: "V", 
    effect: (text, cursorIndex) => ({ text, cursorIndex }),
    description: "V - start linewise visual mode",
    category: "Visual Mode"
  },
  { 
    instruction: "Move to other end of marked area", 
    command: "o", 
    effect: (text, cursorIndex) => ({ text, cursorIndex }),
    description: "o - move to other end of marked area",
    category: "Visual Mode"
  },
  { 
    instruction: "Start visual block mode", 
    command: "Ctrl + v", 
    effect: (text, cursorIndex) => ({ text, cursorIndex }),
    description: "Ctrl + v - start visual block mode",
    category: "Visual Mode"
  },
  { 
    instruction: "Move to other corner of block", 
    command: "O", 
    effect: (text, cursorIndex) => ({ text, cursorIndex }),
    description: "O - move to other corner of block",
    category: "Visual Mode"
  },
  { 
    instruction: "Mark a word", 
    command: "aw", 
    effect: (text, cursorIndex) => ({ text, cursorIndex }),
    description: "aw - mark a word",
    category: "Visual Mode"
  },
  { 
    instruction: "A block with ()", 
    command: "ab", 
    effect: (text, cursorIndex) => ({ text, cursorIndex }),
    description: "ab - a block with ()",
    category: "Visual Mode"
  },
  { 
    instruction: "A block with {}", 
    command: "aB", 
    effect: (text, cursorIndex) => ({ text, cursorIndex }),
    description: "aB - a block with {}",
    category: "Visual Mode"
  },
  { 
    instruction: "A block with <> tags", 
    command: "at", 
    effect: (text, cursorIndex) => ({ text, cursorIndex }),
    description: "at - a block with <> tags",
    category: "Visual Mode"
  },
  { 
    instruction: "Inner block with ()", 
    command: "ib", 
    effect: (text, cursorIndex) => ({ text, cursorIndex }),
    description: "ib - inner block with ()",
    category: "Visual Mode"
  },
  { 
    instruction: "Inner block with {}", 
    command: "iB", 
    effect: (text, cursorIndex) => ({ text, cursorIndex }),
    description: "iB - inner block with {}",
    category: "Visual Mode"
  },
  { 
    instruction: "Inner block with <> tags", 
    command: "it", 
    effect: (text, cursorIndex) =>({ text, cursorIndex }),
    description: "it - inner block with <> tags",
    category: "Visual Mode"
  },

  // Visual commands
  { 
    instruction: "Shift text right", 
    command: ">", 
    effect: (text, cursorIndex) => {
      const currentLineStart = text.lastIndexOf('\n', cursorIndex - 1) + 1
      const currentLineEnd = text.indexOf('\n', cursorIndex)
      const newText = text.slice(0, currentLineStart) + '  ' + text.slice(currentLineStart, currentLineEnd) + (currentLineEnd === -1 ? '' : text.slice(currentLineEnd))
      return { text: newText, cursorIndex: cursorIndex + 2 }
    },
    description: "> - shift text right",
    category: "Visual Commands"
  },
  { 
    instruction: "Shift text left", 
    command: "<", 
    effect: (text, cursorIndex) => {
      const currentLineStart = text.lastIndexOf('\n', cursorIndex - 1) + 1
      const currentLineEnd = text.indexOf('\n', cursorIndex)
      const currentLine = text.slice(currentLineStart, currentLineEnd)
      const newLine = currentLine.replace(/^  /, '')
      const newText = text.slice(0, currentLineStart) + newLine + (currentLineEnd === -1 ? '' : text.slice(currentLineEnd))
      return { text: newText, cursorIndex: Math.max(cursorIndex - 2, currentLineStart) }
    },
    description: "< - shift text left",
    category: "Visual Commands"
  },
  { 
    instruction: "Yank (copy) marked text", 
    command: "y", 
    effect: (text, cursorIndex) => ({ text, cursorIndex }),
    description: "y - yank (copy) marked text",
    category: "Visual Commands"
  },
  { 
    instruction: "Delete marked text", 
    command: "d", 
    effect: (text, cursorIndex) => ({ text, cursorIndex }),
    description: "d - delete marked text",
    category: "Visual Commands"
  },
  { 
    instruction: "Switch case", 
    command: "~", 
    effect: (text, cursorIndex) => {
      if (cursorIndex < text.length) {
        const char = text[cursorIndex]
        const newChar = char === char.toLowerCase() ? char.toUpperCase() : char.toLowerCase()
        const newText = text.slice(0, cursorIndex) + newChar + text.slice(cursorIndex + 1)
        return { text: newText, cursorIndex: cursorIndex + 1 }
      }
      return { text, cursorIndex }
    },
    description: "~ - switch case",
    category: "Visual Commands"
  },
  { 
    instruction: "Change marked text to lowercase", 
    command: "u", 
    effect: (text, cursorIndex) => ({ text: text.toLowerCase(), cursorIndex }),
    description: "u - change marked text to lowercase",
    category: "Visual Commands"
  },
  { 
    instruction: "Change marked text to uppercase", 
    command: "U", 
    effect: (text, cursorIndex) => ({ text: text.toUpperCase(), cursorIndex }),
    description: "U - change marked text to uppercase",
    category: "Visual Commands"
  },

  // Cut and paste
  { 
    instruction: "Yank (copy) a line", 
    command: "yy", 
    effect: (text, cursorIndex) => ({ text, cursorIndex }),
    description: "yy - yank (copy) a line",
    category: "Cut and Paste"
  },
  { 
    instruction: "Yank (copy) 2 lines", 
    command: "2yy", 
    effect: (text, cursorIndex) => ({ text, cursorIndex }),
    description: "2yy - yank (copy) 2 lines",
    category: "Cut and Paste"
  },
  { 
    instruction: "Yank (copy) the characters of the word from the cursor position to the start of the next word", 
    command: "yw", 
    effect: (text, cursorIndex) => ({ text, cursorIndex }),
    description: "yw - yank (copy) the characters of the word from the cursor position to the start of the next word",
    category: "Cut and Paste"
  },
  { 
    instruction: "Yank (copy) word under the cursor", 
    command: "yiw", 
    effect: (text, cursorIndex) => ({ text, cursorIndex }),
    description: "yiw - yank (copy) word under the cursor",
    category: "Cut and Paste"
  },
  { 
    instruction: "Yank (copy) word under the cursor and the space after or before it", 
    command: "yaw", 
    effect: (text, cursorIndex) => ({ text, cursorIndex }),
    description: "yaw - yank (copy) word under the cursor and the space after or before it",
    category: "Cut and Paste"
  },
  { 
    instruction: "Yank (copy) to end of line", 
    command: "y$", 
    effect: (text, cursorIndex) => ({ text, cursorIndex }),
    description: "y$ - yank (copy) to end of line",
    category: "Cut and Paste"
  },
  { 
    instruction: "Put (paste) the clipboard after cursor", 
    command: "p", 
    effect: (text, cursorIndex) => ({ text, cursorIndex }),
    description: "p - put (paste) the clipboard after cursor",
    category: "Cut and Paste"
  },
  { 
    instruction: "Put (paste) before cursor", 
    command: "P", 
    effect: (text, cursorIndex) => ({ text, cursorIndex }),
    description: "P - put (paste) before cursor",
    category: "Cut and Paste"
  },
  { 
    instruction: "Delete (cut) a line", 
    command: "dd", 
    effect: (text, cursorIndex) => {
      const currentLineStart = text.lastIndexOf('\n', cursorIndex - 1) + 1
      const nextLineStart = text.indexOf('\n', cursorIndex) + 1
      const newText = text.slice(0, currentLineStart) + text.slice(nextLineStart)
      return { text: newText, cursorIndex: currentLineStart }
    },
    description: "dd - delete (cut) a line",
    category: "Cut and Paste"
  },
  { 
    instruction: "Delete (cut) 2 lines", 
    command: "2dd", 
    effect: (text, cursorIndex) => {
      const currentLineStart = text.lastIndexOf('\n', cursorIndex - 1) + 1
      let nextLineStart = text.indexOf('\n', cursorIndex) + 1
      nextLineStart = text.indexOf('\n', nextLineStart) + 1
      const newText = text.slice(0, currentLineStart) + text.slice(nextLineStart)
      return { text: newText, cursorIndex: currentLineStart }
    },
    description: "2dd - delete (cut) 2 lines",
    category: "Cut and Paste"
  },
  { 
    instruction: "Delete (cut) the characters of the word from the cursor position to the start of the next word", 
    command: "dw", 
    effect: (text, cursorIndex) => {
      const afterCursor = text.slice(cursorIndex)
      const nextWordStart = afterCursor.search(/\S/)
      const deleteEnd = nextWordStart === -1 ? text.length : cursorIndex + nextWordStart
      const newText = text.slice(0, cursorIndex) + text.slice(deleteEnd)
      return { text: newText, cursorIndex }
    },
    description: "dw - delete (cut) the characters of the word from the cursor position to the start of the next word",
    category: "Cut and Paste"
  },
  { 
    instruction: "Delete (cut) word under the cursor", 
    command: "diw", 
    effect: (text, cursorIndex) => {
      const beforeCursor = text.slice(0, cursorIndex).split('').reverse().join('')
      const afterCursor = text.slice(cursorIndex)
      const wordStartOffset = beforeCursor.search(/\W/)
      const wordEndOffset = afterCursor.search(/\W/)
      const wordStart = wordStartOffset === -1 ? 0 : cursorIndex - wordStartOffset
      const wordEnd = wordEndOffset === -1 ? text.length : cursorIndex + wordEndOffset
      const newText = text.slice(0, wordStart) + text.slice(wordEnd)
      return { text: newText, cursorIndex: wordStart }
    },
    description: "diw - delete (cut) word under the cursor",
    category: "Cut and Paste"
  },
  { 
    instruction: "Delete (cut) word under the cursor and the space after or before it", 
    command: "daw", 
    effect: (text, cursorIndex) => {
      const beforeCursor = text.slice(0, cursorIndex).split('').reverse().join('')
      const afterCursor = text.slice(cursorIndex)
      const wordStartOffset = beforeCursor.search(/\S/)
      const wordEndOffset = afterCursor.search(/\s/)
      const wordStart = wordStartOffset === -1 ? 0 : cursorIndex - wordStartOffset
      const wordEnd = wordEndOffset === -1 ? text.length : cursorIndex + wordEndOffset
      const newText = text.slice(0, wordStart) + text.slice(wordEnd).trimLeft()
      return { text: newText, cursorIndex: wordStart }
    },
    description: "daw - delete (cut) word under the cursor and the space after or before it",
    category: "Cut and Paste"
  },
  { 
    instruction: "Delete (cut) to the end of the line", 
    command: "D", 
    effect: (text, cursorIndex) => {
      const currentLineEnd = text.indexOf('\n', cursorIndex)
      const newText = text.slice(0, cursorIndex) + (currentLineEnd === -1 ? '' : text.slice(currentLineEnd))
      return { text: newText, cursorIndex }
    },
    description: "D - delete (cut) to the end of the line",
    category: "Cut and Paste"
  },
  { 
    instruction: "Delete (cut) character", 
    command: "x", 
    effect: (text, cursorIndex) => {
      const newText = text.slice(0, cursorIndex) + text.slice(cursorIndex + 1)
      return { text: newText, cursorIndex }
    },
    description: "x - delete (cut) character",
    category: "Cut and Paste"
  },

  // Exiting
  { 
    instruction: "Write (save) the file, but don't exit", 
    command: ":w", 
    effect: (text, cursorIndex) => ({ text, cursorIndex }),
    description: ":w - write (save) the file, but don't exit",
    category: "Exiting"
  },
  { 
    instruction: "Write out the current file using sudo", 
    command: ":w !sudo tee %", 
    effect: (text, cursorIndex) => ({ text, cursorIndex }),
    description: ":w !sudo tee % - write out the current file using sudo",
    category: "Exiting"
  },
  { 
    instruction: "Write (save) and quit", 
    command: ":wq", 
    effect: (text, cursorIndex) => ({ text, cursorIndex }),
    description: ":wq - write (save) and quit",
    category: "Exiting"
  },
  { 
    instruction: "Quit (fails if there are unsaved changes)", 
    command: ":q", 
    effect: (text, cursorIndex) => ({ text, cursorIndex }),
    description: ":q - quit (fails if there are unsaved changes)",
    category: "Exiting"
  },
  { 
    instruction: "Quit and throw away unsaved changes", 
    command: ":q!", 
    effect: (text, cursorIndex) => ({ text, cursorIndex }),
    description: ":q! - quit and throw away unsaved changes",
    category: "Exiting"
  },
  { 
    instruction: "Write (save) and quit on all tabs", 
    command: ":wqa", 
    effect: (text, cursorIndex) => ({ text, cursorIndex }),
    description: ":wqa - write (save) and quit on all tabs",
    category: "Exiting"
  },

  // Search and replace
  { 
    instruction: "Search for pattern", 
    command: "/pattern", 
    effect: (text, cursorIndex) => ({ text, cursorIndex }),
    description: "/pattern - search for pattern",
    category: "Search and Replace"
  },
  { 
    instruction: "Search backward for pattern", 
    command: "?pattern", 
    effect: (text, cursorIndex) => ({ text, cursorIndex }),
    description: "?pattern - search backward for pattern",
    category: "Search and Replace"
  },
  { 
    instruction: "Repeat search in same direction", 
    command: "n", 
    effect: (text, cursorIndex) => ({ text, cursorIndex }),
    description: "n - repeat search in same direction",
    category: "Search and Replace"
  },
  { 
    instruction: "Repeat search in opposite direction", 
    command: "N", 
    effect: (text, cursorIndex) => ({ text, cursorIndex }),
    description: "N - repeat search in opposite direction",
    category: "Search and Replace"
  },
  { 
    instruction: "Replace all old with new throughout file", 
    command: ":%s/old/new/g", 
    effect: (text, cursorIndex) => ({ text, cursorIndex }),
    description: ":%s/old/new/g - replace all old with new throughout file",
    category: "Search and Replace"
  },
  { 
    instruction: "Replace all old with new throughout file with confirmations", 
    command: ":%s/old/new/gc", 
    effect: (text, cursorIndex) => ({ text, cursorIndex }),
    description: ":%s/old/new/gc - replace all old with new throughout file with confirmations",
    category: "Search and Replace"
  },
  { 
    instruction: "Remove highlighting of search matches", 
    command: ":noh", 
    effect: (text, cursorIndex) => ({ text, cursorIndex }),
    description: ":noh - remove highlighting of search matches",
    category: "Search and Replace"
  },

  // Working with multiple files
  { 
    instruction: "Edit a file in a new buffer", 
    command: ":e file", 
    effect: (text, cursorIndex) => ({ text, cursorIndex }),
    description: ":e file - edit a file in a new buffer",
    category: "Multiple Files"
  },
  { 
    instruction: "Go to the next buffer", 
    command: ":bn", 
    effect: (text, cursorIndex) => ({ text, cursorIndex }),
    description: ":bn - go to the next buffer",
    category: "Multiple Files"
  },
  { 
    instruction: "Go to the previous buffer", 
    command: ":bp", 
    effect: (text, cursorIndex) => ({ text, cursorIndex }),
    description: ":bp - go to the previous buffer",
    category: "Multiple Files"
  },
  { 
    instruction: "Delete a buffer (close a file)", 
    command: ":bd", 
    effect: (text, cursorIndex) => ({ text, cursorIndex }),
    description: ":bd - delete a buffer (close a file)",
    category: "Multiple Files"
  },
  { 
    instruction: "List all open buffers", 
    command: ":ls", 
    effect: (text, cursorIndex) => ({ text, cursorIndex }),
    description: ":ls - list all open buffers",
    category: "Multiple Files"
  },
  { 
    instruction: "Open a file in a new buffer and split window", 
    command: ":sp file", 
    effect: (text, cursorIndex) => ({ text, cursorIndex }),
    description: ":sp file - open a file in a new buffer and split window",
    category: "Multiple Files"
  },
  { 
    instruction: "Open a file in a new buffer and vertically split window", 
    command: ":vsp file", 
    effect: (text, cursorIndex) => ({ text, cursorIndex }),
    description: ":vsp file - open a file in a new buffer and vertically split window",
    category: "Multiple Files"
  },
  { 
    instruction: "Make all windows equal height & width", 
    command: "Ctrl + w =", 
    effect: (text, cursorIndex) => ({ text, cursorIndex }),
    description: "Ctrl + w = - make all windows equal height & width",
    category: "Multiple Files"
  },
]

const VimAdventure: React.FC = () => {
  const [currentCommand, setCurrentCommand] = useState<Command>(commands[0])
  const [userInput, setUserInput] = useState('')
  const [text, setText] = useState('The quick brown fox\njumps over the lazy dog.\nVim is awesome!\nLet\'s learn more commands.')
  const [cursorIndex, setCursorIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [level, setLevel] = useState(1)
  const [gameOver, setGameOver] = useState(false)
  const [commandHistory, setCommandHistory] = useState<string[]>([])
  const [timeLeft, setTimeLeft] = useState(60)
  const [showHint, setShowHint] = useState(false)
  const [isPracticeMode, setIsPracticeMode] = useState(true)
  const [lastCommandResult, setLastCommandResult] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>("All")
  const inputRef = useRef<HTMLInputElement>(null)

  const filteredCommands = selectedCategory === "All" 
    ? commands 
    : commands.filter(cmd => cmd.category === selectedCategory)

  const nextCommand = useCallback(() => {
    const nextIndex = Math.floor(Math.random() * filteredCommands.length)
    setCurrentCommand(filteredCommands[nextIndex])
    setUserInput('')
    setShowHint(false)
    setLastCommandResult(null)
  }, [filteredCommands])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserInput(e.target.value)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (userInput === currentCommand.command) {
      const result = currentCommand.effect(text, cursorIndex)
      setText(result.text)
      setCursorIndex(result.cursorIndex)
      setScore(score + 1)
      setCommandHistory(prev => [...prev, currentCommand.description])
      setLastCommandResult(`Command "${currentCommand.command}" executed successfully!`)
      if (score + 1 >= level * 10) {
        setLevel(level + 1)
        if (!isPracticeMode) {
          setTimeLeft(prev => Math.min(prev + 30, 180))
        }
      }
      if (!isPracticeMode) {
        setTimeLeft(prev => Math.min(prev + 5, 180))
      }
      nextCommand()
    } else {
      setLastCommandResult(`Incorrect command. Try again!`)
    }
    setUserInput('')
  }

  const resetGame = useCallback(() => {
    setScore(0)
    setLevel(1)
    setGameOver(false)
    setCommandHistory([])
    setText('The quick brown fox\njumps over the lazy dog.\nVim is awesome!\nLet\'s learn more commands.')
    setCursorIndex(0)
    setTimeLeft(60)
    setLastCommandResult(null)
    nextCommand()
  }, [nextCommand])

  const toggleMode = useCallback(() => {
    setIsPracticeMode(prev => !prev)
    resetGame()
  }, [resetGame])

  useEffect(() => {
    nextCommand()
  }, [nextCommand])

  useEffect(() => {
    if (!isPracticeMode && timeLeft > 0 && !gameOver) {
      const timer = setTimeout(() => setTimeLeft(prev => prev - 1), 1000)
      return () => clearTimeout(timer)
    } else if (!isPracticeMode && timeLeft === 0) {
      setGameOver(true)
    }
  }, [timeLeft, gameOver, isPracticeMode])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && document.activeElement !== inputRef.current) {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const CommandDisplay: React.FC<{ command: Command }> = React.memo(({ command }) => (
    <div className="bg-gray-100 p-4 rounded-lg mb-4">
      <p className="font-bold">{command.instruction}</p>
      <p className="text-sm text-gray-600">{command.description}</p>
      <p className="text-xs text-gray-500">Category: {command.category}</p>
    </div>
  ))

  const TextEditor: React.FC<{ text: string; cursorIndex: number }> = React.memo(({ text, cursorIndex }) => (
    <div className="bg-white p-4 rounded-lg mb-4 font-mono text-lg relative border-2 border-gray-300" aria-label="Text editor">
      <pre className="whitespace-pre-wrap">
        {text.split('').map((char, index) => (
          <span key={index} className={index === cursorIndex ? 'bg-blue-500 text-white' : ''}>
            {char}
          </span>
        ))}
      </pre>
    </div>
  ))

  return (
    <Card className="w-full max-w-4xl mx-auto p-6">
      <div className="text-center mb-4">
        <h1 className="text-3xl font-bold mb-2">Vim Adventure</h1>
        <div className="flex items-center justify-center mb-2">
          <Switch
            id="practice-mode"
            checked={isPracticeMode}
            onCheckedChange={toggleMode}
          />
          <Label htmlFor="practice-mode" className="ml-2">
            Practice Mode: {isPracticeMode ? 'On' : 'Off'}
          </Label>
        </div>
        <p className="text-lg">Score: {score} | Level: {level} {!isPracticeMode && `| Time Left: ${timeLeft}s`}</p>
        {!isPracticeMode && <Progress value={(timeLeft / 180) * 100} className="mt-2" />}
      </div>

      <div className="mb-4">
        <Label htmlFor="category-select">Select Command Category:</Label>
        <Select onValueChange={(value) => setSelectedCategory(value)}>
          <SelectTrigger id="category-select">
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All</SelectItem>
            {Array.from(new Set(commands.map(cmd => cmd.category))).map(category => (
              <SelectItem key={category} value={category}>{category}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <CommandDisplay command={currentCommand} />

      <TextEditor text={text} cursorIndex={cursorIndex} />

      <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
        <Input
          type="text"
          value={userInput}
          onChange={handleInputChange}
          placeholder="Enter Vim command"
          className="flex-grow"
          aria-label="Vim command input"
          ref={inputRef}
        />
        <Button type="submit">Execute</Button>
      </form>

      <AnimatePresence>
        {lastCommandResult && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`p-2 rounded-lg mb-4 text-center ${
              lastCommandResult.includes('successfully') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}
          >
            {lastCommandResult}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-4">
        <h2 className="text-lg font-semibold mb-2">Command History:</h2>
        <ul className="list-disc pl-5">
          {commandHistory.slice(-5).map((cmd, index) => (
            <li key={index}>{cmd}</li>
          ))}
        </ul>
      </div>

      <Button 
        onClick={() => setShowHint(!showHint)} 
        className="mt-4"
        variant="outline"
      >
        {showHint ? 'Hide Hint' : 'Show Hint'}
      </Button>
      <AnimatePresence>
        {showHint && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="text-sm text-muted-foreground mt-2"
          >
            Hint: Use the command "{currentCommand.command}"
          </motion.p>
        )}
      </AnimatePresence>

      {gameOver && !isPracticeMode && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50"
        >
          <Card className="p-6 text-center">
            <h2 className="text-2xl font-bold mb-4">Game Over!</h2>
            <p className="text-lg mb-4">Final Score: {score}</p>
            <Button onClick={resetGame}>Play Again</Button>
          </Card>
        </motion.div>
      )}
    </Card>
  )
}

export default VimAdventure