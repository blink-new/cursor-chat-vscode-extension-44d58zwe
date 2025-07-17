import { useState, useRef, useEffect } from 'react'
import { Terminal as TerminalIcon, X, Maximize2, Minimize2, Copy, Check } from 'lucide-react'
import { Button } from './ui/button'
import { ScrollArea } from './ui/scroll-area'
import { Badge } from './ui/badge'

interface TerminalLine {
  id: string
  type: 'command' | 'output' | 'error' | 'info'
  content: string
  timestamp: Date
}

interface TerminalProps {
  title?: string
  onClose?: () => void
  className?: string
  initialLines?: TerminalLine[]
}

export const Terminal = ({ 
  title = "Terminal", 
  onClose,
  className = "",
  initialLines = []
}: TerminalProps) => {
  const [lines, setLines] = useState<TerminalLine[]>(initialLines)
  const [input, setInput] = useState('')
  const [isMaximized, setIsMaximized] = useState(false)
  const [copied, setCopied] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Auto-scroll to bottom when new lines are added
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [lines])

  const addLine = (type: TerminalLine['type'], content: string) => {
    const newLine: TerminalLine = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date()
    }
    setLines(prev => [...prev, newLine])
  }

  const handleCommand = (command: string) => {
    // Add the command to terminal
    addLine('command', `$ ${command}`)
    
    // Simulate command execution
    setTimeout(() => {
      switch (command.toLowerCase().trim()) {
        case 'help':
          addLine('info', 'Available commands:')
          addLine('info', '  help     - Show this help message')
          addLine('info', '  clear    - Clear terminal')
          addLine('info', '  ls       - List files')
          addLine('info', '  pwd      - Print working directory')
          addLine('info', '  npm run dev - Start development server')
          addLine('info', '  git status - Show git status')
          break
        case 'clear':
          setLines([])
          break
        case 'ls':
          addLine('output', 'src/')
          addLine('output', 'public/')
          addLine('output', 'package.json')
          addLine('output', 'tsconfig.json')
          addLine('output', 'vite.config.ts')
          break
        case 'pwd':
          addLine('output', '/workspace/etab-vscode-extension')
          break
        case 'npm run dev':
          addLine('info', 'Starting development server...')
          addLine('output', '> etab@1.0.0 dev')
          addLine('output', '> vite')
          addLine('output', '')
          addLine('output', '  VITE v5.0.0  ready in 1234 ms')
          addLine('output', '')
          addLine('output', '  ➜  Local:   http://localhost:3000/')
          addLine('output', '  ➜  Network: use --host to expose')
          break
        case 'git status':
          addLine('output', 'On branch main')
          addLine('output', 'Your branch is up to date with \'origin/main\'.')
          addLine('output', '')
          addLine('output', 'Changes not staged for commit:')
          addLine('output', '  (use "git add <file>..." to update what will be committed)')
          addLine('output', '  (use "git restore <file>..." to discard changes in working directory)')
          addLine('output', '        modified:   src/components/ChatInterface.tsx')
          addLine('output', '')
          addLine('output', 'no changes added to commit (use "git add" or "git commit -a")')
          break
        default:
          if (command.trim()) {
            addLine('error', `Command not found: ${command}`)
            addLine('info', 'Type "help" for available commands')
          }
      }
    }, 300 + Math.random() * 500) // Simulate network delay
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim()) {
      handleCommand(input.trim())
      setInput('')
    }
  }

  const handleCopyAll = async () => {
    const content = lines.map(line => {
      const prefix = line.type === 'command' ? '' : '  '
      return `${prefix}${line.content}`
    }).join('\n')
    
    await navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const getLineColor = (type: TerminalLine['type']) => {
    switch (type) {
      case 'command':
        return 'text-blue-400'
      case 'error':
        return 'text-red-400'
      case 'info':
        return 'text-yellow-400'
      default:
        return 'text-foreground'
    }
  }

  return (
    <div className={`terminal border border-border rounded-lg overflow-hidden ${isMaximized ? 'fixed inset-4 z-50' : ''} ${className}`}>
      {/* Terminal Header */}
      <div className="flex items-center justify-between bg-card border-b border-border px-3 py-2">
        <div className="flex items-center gap-2">
          <TerminalIcon className="h-4 w-4" />
          <span className="text-sm font-medium">{title}</span>
          <Badge variant="outline" className="text-xs">
            {lines.length} lines
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopyAll}
            className="h-6 w-6 p-0"
          >
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMaximized(!isMaximized)}
            className="h-6 w-6 p-0"
          >
            {isMaximized ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
          </Button>
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Terminal Content */}
      <div className="bg-background text-foreground font-mono text-sm">
        <ScrollArea className="h-64" ref={scrollRef}>
          <div className="p-3 space-y-1">
            {lines.map((line) => (
              <div key={line.id} className={`${getLineColor(line.type)} leading-relaxed`}>
                {line.content}
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Terminal Input */}
        <form onSubmit={handleSubmit} className="border-t border-border p-3">
          <div className="flex items-center gap-2">
            <span className="text-blue-400">$</span>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a command..."
              className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground"
              autoFocus
            />
          </div>
        </form>
      </div>
    </div>
  )
}