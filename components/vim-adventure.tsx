"use client"

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"

interface Command {
  instruction: string
  command: string
  effect: (text: string, cursorIndex: number) => { text: string; cursorIndex: number }
  description: string
}

const commands: Command[] = [
  { 
    instruction: "Move cursor to the end of the line", 
    command: "$", 
    effect: (text, cursorIndex) => ({ text, cursorIndex: text.length - 1 }),
    description: "$ - Move to end of line"
  },
  { 
    instruction: "Move cursor to the start of the line", 
    command: "0", 
    effect: (text, cursorIndex) => ({ text, cursorIndex: 0 }),
    description: "0 - Move to start of line"
  },
  { 
    instruction: "Delete the current word", 
    command: "dw", 
    effect: (text, cursorIndex) => {
      const afterCursor = text.slice(cursorIndex)
      const nextSpace = afterCursor.indexOf(' ')
      const newText = text.slice(0, cursorIndex) + (nextSpace === -1 ? '' : afterCursor.slice(nextSpace + 1))
      return { text: newText, cursorIndex }
    },
    description: "dw - Delete word"
  },
  { 
    instruction: "Delete the current line", 
    command: "dd", 
    effect: (text, cursorIndex) => {
      const lines = text.split('\n')
      const currentLineIndex = text.slice(0, cursorIndex).split('\n').length - 1
      lines.splice(currentLineIndex, 1)
      const newText = lines.join('\n')
      return { text: newText, cursorIndex: Math.min(cursorIndex, newText.length - 1) }
    },
    description: "dd - Delete line"
  },
  { 
    instruction: "Append text after the cursor", 
    command: "a", 
    effect: (text, cursorIndex) => {
      const newText = text.slice(0, cursorIndex + 1) + '_' + text.slice(cursorIndex + 1)
      return { text: newText, cursorIndex: cursorIndex + 1 }
    },
    description: "a - Append after cursor"
  },
  {
    instruction: "Move cursor one word forward",
    command: "w",
    effect: (text, cursorIndex) => {
      const afterCursor = text.slice(cursorIndex)
      const nextSpace = afterCursor.indexOf(' ')
      const newCursorIndex = nextSpace === -1 ? text.length - 1 : cursorIndex + nextSpace + 1
      return { text, cursorIndex: newCursorIndex }
    },
    description: "w - Move one word forward"
  },
  {
    instruction: "Move cursor one word backward",
    command: "b",
    effect: (text, cursorIndex) => {
      const beforeCursor = text.slice(0, cursorIndex)
      const lastSpace = beforeCursor.lastIndexOf(' ')
      const newCursorIndex = lastSpace === -1 ? 0 : lastSpace + 1
      return { text, cursorIndex: newCursorIndex }
    },
    description: "b - Move one word backward"
  },
  {
    instruction: "Delete from cursor to end of line",
    command: "D",
    effect: (text, cursorIndex) => {
      const lines = text.split('\n')
      const currentLineIndex = text.slice(0, cursorIndex).split('\n').length - 1
      const currentLine = lines[currentLineIndex]
      const newLine = currentLine.slice(0, cursorIndex - text.lastIndexOf('\n', cursorIndex) - 1)
      lines[currentLineIndex] = newLine
      return { text: lines.join('\n'), cursorIndex }
    },
    description: "D - Delete to end of line"
  },
  {
    instruction: "Join the current line with the next line",
    command: "J",
    effect: (text, cursorIndex) => {
      const lines = text.split('\n')
      const currentLineIndex = text.slice(0, cursorIndex).split('\n').length - 1
      if (currentLineIndex < lines.length - 1) {
        lines[currentLineIndex] = lines[currentLineIndex].trimEnd() + ' ' + lines[currentLineIndex + 1].trimStart()
        lines.splice(currentLineIndex + 1, 1)
      }
      return { text: lines.join('\n'), cursorIndex }
    },
    description: "J - Join lines"
  },
  {
    instruction: "Go to the beginning of the file",
    command: "gg",
    effect: (text, cursorIndex) => ({ text, cursorIndex: 0 }),
    description: "gg - Go to beginning of file"
  },
  {
    instruction: "Go to the end of the file",
    command: "G",
    effect: (text, cursorIndex) => ({ text, cursorIndex: text.length - 1 }),
    description: "G - Go to end of file"
  },
  {
    instruction: "Delete the character under the cursor",
    command: "x",
    effect: (text, cursorIndex) => ({
      text: text.slice(0, cursorIndex) + text.slice(cursorIndex + 1),
      cursorIndex
    }),
    description: "x - Delete character under cursor"
  },
  {
    instruction: "Change (replace) the current word",
    command: "cw",
    effect: (text, cursorIndex) => {
      const afterCursor = text.slice(cursorIndex)
      const nextSpace = afterCursor.indexOf(' ')
      const newText = text.slice(0, cursorIndex) + '_' + (nextSpace === -1 ? '' : afterCursor.slice(nextSpace))
      return { text: newText, cursorIndex }
    },
    description: "cw - Change word"
  },
  {
    instruction: "Yank (copy) the current line",
    command: "yy",
    effect: (text, cursorIndex) => ({ text, cursorIndex }),
    description: "yy - Yank line"
  },
  {
    instruction: "Put (paste) the yanked text after the cursor",
    command: "p",
    effect: (text, cursorIndex) => {
      const lines = text.split('\n')
      const currentLineIndex = text.slice(0, cursorIndex).split('\n').length - 1
      lines.splice(currentLineIndex + 1, 0, lines[currentLineIndex])
      return { text: lines.join('\n'), cursorIndex: cursorIndex + lines[currentLineIndex].length + 1 }
    },
    description: "p - Put yanked text"
  }
]

export function VimAdventureComponent() {
  const [currentCommand, setCurrentCommand] = useState<Command>(commands[0])
  const [userInput, setUserInput] = useState('')
  const [text, setText] = useState('The quick brown fox\njumps over the lazy dog.\nVim is awesome!\nLet\'s learn more commands.')
  const [cursorIndex, setCursorIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [level, setLevel] = useState(1)
  const [gameOver, setGameOver] = useState(false)
  const [commandHistory, setCommandHistory] = useState<string[]>([])
  const [timeLeft, setTimeLeft] = useState(30)
  const [showHint, setShowHint] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const nextCommand = useCallback(() => {
    const nextIndex = Math.floor(Math.random() * commands.length)
    setCurrentCommand(commands[nextIndex])
    setUserInput('')
    setShowHint(false)
  }, [])

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
      if (score + 1 >= level * 10) {
        setLevel(level + 1)
        setTimeLeft(prev => Math.max(prev + 10, 60))
      }
      nextCommand()
    } else {
      setTimeLeft(prev => Math.max(prev - 5, 0))
    }
    setUserInput('')
  }

  const resetGame = () => {
    setScore(0)
    setLevel(1)
    setGameOver(false)
    setCommandHistory([])
    setText('The quick brown fox\njumps over the lazy dog.\nVim is awesome!\nLet\'s learn more commands.')
    setCursorIndex(0)
    setTimeLeft(30)
    nextCommand()
  }

  useEffect(() => {
    nextCommand()
  }, [nextCommand])

  useEffect(() => {
    if (timeLeft > 0 && !gameOver) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else if (timeLeft === 0) {
      setGameOver(true)
    }
  }, [timeLeft, gameOver])

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

  return (
    <Card className="w-full max-w-4xl mx-auto p-6">
      <div className="text-center mb-4">
        <h1 className="text-3xl font-bold mb-2">Vim Adventure</h1>
        <p className="text-lg">Score: {score} | Level: {level} | Time Left: {timeLeft}s</p>
        <Progress value={(timeLeft / 30) * 100} className="mt-2" />
      </div>
      <div className="mb-4">
        <p className="text-lg font-semibold">Instruction:</p>
        <p className="text-xl">{currentCommand.instruction}</p>
        <Button 
          onClick={() => setShowHint(!showHint)} 
          className="mt-2"
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
      </div>
      <div className="bg-gray-100 p-4 rounded-lg mb-4 font-mono text-lg relative" aria-label="Text editor">
        <pre className="whitespace-pre-wrap">
          {text.split('').map((char, index) => (
            <span key={index} className={index === cursorIndex ? 'bg-blue-500 text-white' : ''}>
              {char}
            </span>
          ))}
        </pre>
      </div>
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
      <div className="mt-4">
        <h2 className="text-lg font-semibold mb-2">Command History:</h2>
        <ul className="list-disc pl-5">
          {commandHistory.slice(-5).map((cmd, index) => (
            <li key={index}>{cmd}</li>
          ))}
        </ul>
      </div>
      {gameOver && (
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