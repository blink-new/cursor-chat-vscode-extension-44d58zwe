import { useState, useRef, useEffect } from 'react'
import { 
  Send, 
  Paperclip, 
  Settings, 
  MoreVertical, 
  Copy, 
  Check, 
  Terminal as TerminalIcon,
  FileText,
  GitCompare,
  Sparkles,
  Moon,
  Sun,
  Monitor
} from 'lucide-react'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from './ui/dropdown-menu'
import { Badge } from './ui/badge'
import { ScrollArea } from './ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { useTheme } from '../hooks/use-theme'
import { CodeDiff } from './CodeDiff'
import { Terminal } from './Terminal'

interface Message {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: Date
  attachments?: string[]
  hasCodeDiff?: boolean
  hasTerminal?: boolean
  terminalLines?: any[]
}

interface CodeBlockProps {
  children: string
  className?: string
}

const CodeBlock = ({ children, className }: CodeBlockProps) => {
  const [copied, setCopied] = useState(false)
  const { theme } = useTheme()
  const language = className?.replace('language-', '') || 'text'

  const handleCopy = async () => {
    await navigator.clipboard.writeText(children)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)

  return (
    <div className="relative group my-4">
      <div className="flex items-center justify-between bg-card border border-border rounded-t-md px-3 py-2">
        <span className="text-xs text-muted-foreground font-mono">{language}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
        </Button>
      </div>
      <SyntaxHighlighter
        language={language}
        style={isDark ? vscDarkPlus : vs}
        customStyle={{
          margin: 0,
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
          borderBottomLeftRadius: '0.375rem',
          borderBottomRightRadius: '0.375rem',
          fontSize: '0.875rem',
          lineHeight: '1.5',
          background: isDark ? 'hsl(30 30 30)' : 'hsl(255 255 255)',
        }}
      >
        {children}
      </SyntaxHighlighter>
    </div>
  )
}

const MessageBubble = ({ message }: { message: Message }) => {
  const isUser = message.type === 'user'
  const [showTerminal, setShowTerminal] = useState(false)

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-6 group`}>
      <div className={`max-w-[85%] ${isUser ? 'order-2' : 'order-1'}`}>
        <div
          className={`rounded-lg px-4 py-3 ${
            isUser
              ? 'bg-primary text-primary-foreground ml-4'
              : 'bg-card border border-border mr-4'
          }`}
        >
          {isUser ? (
            <p className="text-sm leading-relaxed">{message.content}</p>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown
                components={{
                  code({ node, inline, className, children, ...props }) {
                    const match = /language-(\\w+)/.exec(className || '')
                    return !inline && match ? (
                      <CodeBlock className={className}>
                        {String(children).replace(/\\n$/, '')}
                      </CodeBlock>
                    ) : (
                      <code
                        className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono"
                        {...props}
                      >
                        {children}
                      </code>
                    )
                  },
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}
          
          {/* Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {message.attachments.map((attachment, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  <FileText className="h-3 w-3 mr-1" />
                  {attachment}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Code Diff */}
        {message.hasCodeDiff && !isUser && (
          <div className="mt-3 mr-4">
            <CodeDiff
              title="Suggested Changes"
              filename="src/components/Example.tsx"
              language="typescript"
              oldCode={`function oldFunction() {
  console.log("Old implementation");
  return false;
}`}
              newCode={`function newFunction() {
  console.log("New implementation");
  // Added error handling
  try {
    return processData();
  } catch (error) {
    console.error("Error:", error);
    return false;
  }
}`}
            />
          </div>
        )}

        {/* Terminal */}
        {message.hasTerminal && !isUser && (
          <div className="mt-3 mr-4">
            <Collapsible open={showTerminal} onOpenChange={setShowTerminal}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <TerminalIcon className="h-4 w-4 mr-2" />
                  {showTerminal ? 'Hide Terminal Output' : 'Show Terminal Output'}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                <Terminal
                  title="Command Output"
                  initialLines={message.terminalLines || [
                    {
                      id: '1',
                      type: 'command',
                      content: '$ npm install @types/react',
                      timestamp: new Date()
                    },
                    {
                      id: '2',
                      type: 'output',
                      content: 'added 1 package, and audited 2 packages in 2s',
                      timestamp: new Date()
                    },
                    {
                      id: '3',
                      type: 'output',
                      content: 'found 0 vulnerabilities',
                      timestamp: new Date()
                    }
                  ]}
                />
              </CollapsibleContent>
            </Collapsible>
          </div>
        )}

        {/* Message Actions */}
        <div className="flex items-center gap-2 mt-2 px-1">
          <span className="text-xs text-muted-foreground">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          {!isUser && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreVertical className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy message
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Regenerate
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <FileText className="h-4 w-4 mr-2" />
                  Edit prompt
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <GitCompare className="h-4 w-4 mr-2" />
                  Show diff
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <TerminalIcon className="h-4 w-4 mr-2" />
                  Run in terminal
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </div>
  )
}

export const ChatInterface = () => {
  const { theme, setTheme } = useTheme()
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: `# Welcome to ETAB! 🚀

I'm your AI coding assistant, designed to work seamlessly with VSCode. I can help you with:

## 🔧 **Code Development**
- **Code generation** and debugging
- **Code explanations** and documentation  
- **Refactoring** suggestions and best practices
- **Framework-specific** guidance (React, Vue, Angular, etc.)

## 🎯 **Advanced Features**
- **Code diffs** - Visual comparisons of changes
- **Terminal integration** - Execute and explain commands
- **File context** - Reference your project files
- **Multi-model support** - Choose the best AI for your task

## 🎨 **VSCode Integration**
- **Theme sync** - Automatically matches your VSCode theme
- **Syntax highlighting** - Proper code formatting
- **Extension-ready** - Built for VSCode environment

What would you like to work on today? Try asking me to:
- "Show me a React component example"
- "Explain this error message"
- "Help me refactor this function"
- "Generate a terminal command"`,
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [selectedModel, setSelectedModel] = useState('gpt-4')
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('chat')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    // Simulate AI response with enhanced features
    setTimeout(() => {
      const shouldShowDiff = input.toLowerCase().includes('refactor') || input.toLowerCase().includes('change') || input.toLowerCase().includes('improve')
      const shouldShowTerminal = input.toLowerCase().includes('install') || input.toLowerCase().includes('run') || input.toLowerCase().includes('command') || input.toLowerCase().includes('terminal')
      
      let responseContent = `I understand you want help with: "${input}"\n\n`
      
      if (shouldShowDiff) {
        responseContent += `I'll help you refactor that code. Here's an improved version with better error handling and performance:\n\n`
      } else if (shouldShowTerminal) {
        responseContent += `I'll help you with that command. Here's what you need to run:\n\n`
      }
      
      responseContent += `\`\`\`typescript
// Enhanced TypeScript solution
interface UserInput {
  value: string;
  isValid: boolean;
}

function processUserInput(input: string): UserInput {
  // Input validation with detailed checks
  const cleanInput = input.trim()
  
  if (!cleanInput) {
    throw new Error('Input cannot be empty')
  }
  
  if (cleanInput.length > 1000) {
    throw new Error('Input too long (max 1000 characters)')
  }
  
  // Process the input with enhanced logic
  const processed = cleanInput.toLowerCase()
  const isValid = /^[a-zA-Z0-9\\s]+$/.test(processed)
  
  return {
    value: \`Processed: \${processed}\`,
    isValid
  }
}

// Usage with comprehensive error handling
try {
  const result = processUserInput("${input}")
  
  if (result.isValid) {
    console.log('✅ Success:', result.value)
  } else {
    console.warn('⚠️ Invalid input format')
  }
} catch (error) {
  console.error('❌ Error:', error.message)
}
\`\`\`

This enhanced solution includes:
- **Type safety** with TypeScript interfaces
- **Comprehensive validation** (empty, length, format)
- **Detailed error handling** with specific error messages
- **Return object** with validation status
- **Input sanitization** and processing
- **Clear logging** with status indicators

${shouldShowDiff ? 'Check the code diff below to see the specific changes I made.' : ''}
${shouldShowTerminal ? 'See the terminal output below for the command execution.' : ''}

Would you like me to explain any part of this code or help you with something else?`

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: responseContent,
        timestamp: new Date(),
        hasCodeDiff: shouldShowDiff,
        hasTerminal: shouldShowTerminal,
      }
      
      setMessages(prev => [...prev, assistantMessage])
      setIsLoading(false)
    }, 1500)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px'
    }
  }

  useEffect(() => {
    adjustTextareaHeight()
  }, [input])

  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className="h-4 w-4" />
      case 'dark':
        return <Moon className="h-4 w-4" />
      default:
        return <Monitor className="h-4 w-4" />
    }
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">E</span>
          </div>
          <div>
            <h1 className="font-semibold text-sm">ETAB</h1>
            <p className="text-xs text-muted-foreground">Enhanced Terminal AI Bot</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedModel} onValueChange={setSelectedModel}>
            <SelectTrigger className="w-36 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gpt-4">GPT-4 Turbo</SelectItem>
              <SelectItem value="gpt-3.5">GPT-3.5 Turbo</SelectItem>
              <SelectItem value="claude">Claude 3.5 Sonnet</SelectItem>
              <SelectItem value="codellama">CodeLlama 70B</SelectItem>
              <SelectItem value="gemini">Gemini Pro</SelectItem>
            </SelectContent>
          </Select>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                {getThemeIcon()}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme('light')}>
                <Sun className="h-4 w-4 mr-2" />
                Light
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('dark')}>
                <Moon className="h-4 w-4 mr-2" />
                Dark
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('system')}>
                <Monitor className="h-4 w-4 mr-2" />
                System
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        <div className="flex-1 flex flex-col">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <div className="border-b border-border px-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="chat" className="text-xs">Chat</TabsTrigger>
                <TabsTrigger value="files" className="text-xs">Files</TabsTrigger>
                <TabsTrigger value="terminal" className="text-xs">Terminal</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="chat" className="flex-1 flex flex-col m-0">
              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <MessageBubble key={message.id} message={message} />
                  ))}
                  {isLoading && (
                    <div className="flex justify-start mb-4">
                      <div className="max-w-[85%] mr-4">
                        <div className="bg-card border border-border rounded-lg px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex gap-1">
                              <div className="w-2 h-2 bg-primary rounded-full typing-dot"></div>
                              <div className="w-2 h-2 bg-primary rounded-full typing-dot"></div>
                              <div className="w-2 h-2 bg-primary rounded-full typing-dot"></div>
                            </div>
                            <span className="text-xs text-muted-foreground">ETAB is thinking...</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Input Area */}
              <div className="p-4 border-t border-border bg-card">
                <div className="flex items-end gap-2">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 mb-1">
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <div className="flex-1 relative">
                    <Textarea
                      ref={textareaRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Ask ETAB anything about your code..."
                      className="min-h-[40px] max-h-[120px] resize-none pr-12 text-sm"
                      rows={1}
                    />
                    <Button
                      onClick={handleSend}
                      disabled={!input.trim() || isLoading}
                      size="sm"
                      className="absolute right-2 bottom-2 h-6 w-6 p-0"
                    >
                      <Send className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                  <span>Press Enter to send, Shift+Enter for new line</span>
                  <span>{selectedModel} • {messages.length} messages • Theme: {theme}</span>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="files" className="flex-1 p-4 m-0">
              <div className="text-center text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="font-medium mb-2">File Explorer</h3>
                <p className="text-sm">Connect to your workspace to browse files</p>
              </div>
            </TabsContent>

            <TabsContent value="terminal" className="flex-1 p-4 m-0">
              <Terminal 
                title="ETAB Terminal"
                initialLines={[
                  {
                    id: '1',
                    type: 'info',
                    content: 'Welcome to ETAB Terminal! Type "help" for available commands.',
                    timestamp: new Date()
                  }
                ]}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}