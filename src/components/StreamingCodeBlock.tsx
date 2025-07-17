import { useState, useEffect, useRef } from 'react'
import { Copy, Check, Play, Pause } from 'lucide-react'
import { Button } from './ui/button'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { useTheme } from '../hooks/use-theme'

interface StreamingCodeBlockProps {
  children: string
  className?: string
  isStreaming?: boolean
  streamingSpeed?: number
  onStreamComplete?: () => void
}

export const StreamingCodeBlock = ({ 
  children, 
  className, 
  isStreaming = false,
  streamingSpeed = 30,
  onStreamComplete
}: StreamingCodeBlockProps) => {
  const [copied, setCopied] = useState(false)
  const [displayedCode, setDisplayedCode] = useState('')
  const [isStreamingActive, setIsStreamingActive] = useState(isStreaming)
  const [isPaused, setIsPaused] = useState(false)
  const { theme } = useTheme()
  const language = className?.replace('language-', '') || 'text'
  const streamingRef = useRef<NodeJS.Timeout>()
  const currentIndexRef = useRef(0)

  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)

  useEffect(() => {
    if (isStreaming && !isPaused) {
      setIsStreamingActive(true)
      currentIndexRef.current = 0
      setDisplayedCode('')
      
      const streamCode = () => {
        if (currentIndexRef.current < children.length) {
          setDisplayedCode(children.slice(0, currentIndexRef.current + 1))
          currentIndexRef.current++
          streamingRef.current = setTimeout(streamCode, streamingSpeed)
        } else {
          setIsStreamingActive(false)
          onStreamComplete?.()
        }
      }
      
      streamCode()
    } else if (!isStreaming) {
      setDisplayedCode(children)
      setIsStreamingActive(false)
    }

    return () => {
      if (streamingRef.current) {
        clearTimeout(streamingRef.current)
      }
    }
  }, [children, isStreaming, streamingSpeed, isPaused, onStreamComplete])

  const handleCopy = async () => {
    await navigator.clipboard.writeText(children)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const togglePause = () => {
    setIsPaused(!isPaused)
  }

  const codeToDisplay = isStreamingActive ? displayedCode : children

  return (
    <div className="relative group my-4">
      <div className="flex items-center justify-between bg-card border border-border rounded-t-md px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-mono">{language}</span>
          {isStreamingActive && (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-green-600 dark:text-green-400">Streaming...</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1">
          {isStreaming && (
            <Button
              variant="ghost"
              size="sm"
              onClick={togglePause}
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              {isPaused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          </Button>
        </div>
      </div>
      <div className="relative">
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
            minHeight: '3rem',
          }}
        >
          {codeToDisplay}
        </SyntaxHighlighter>
        {isStreamingActive && (
          <div className="absolute bottom-2 right-2 w-2 h-4 bg-primary streaming-cursor" />
        )}
      </div>
    </div>
  )
}