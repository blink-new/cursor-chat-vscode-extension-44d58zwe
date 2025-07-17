import { useState, useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import { StreamingCodeBlock } from './StreamingCodeBlock'

interface StreamingMessageProps {
  content: string
  isStreaming?: boolean
  streamingSpeed?: number
  onStreamComplete?: () => void
}

export const StreamingMessage = ({ 
  content, 
  isStreaming = false, 
  streamingSpeed = 20,
  onStreamComplete 
}: StreamingMessageProps) => {
  const [displayedContent, setDisplayedContent] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isStreamingActive, setIsStreamingActive] = useState(isStreaming)
  const streamingRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    if (isStreaming) {
      setIsStreamingActive(true)
      setCurrentIndex(0)
      setDisplayedContent('')
      
      const streamText = () => {
        if (currentIndex < content.length) {
          setDisplayedContent(content.slice(0, currentIndex + 1))
          setCurrentIndex(prev => prev + 1)
          streamingRef.current = setTimeout(streamText, streamingSpeed)
        } else {
          setIsStreamingActive(false)
          onStreamComplete?.()
        }
      }
      
      streamText()
    } else {
      setDisplayedContent(content)
      setIsStreamingActive(false)
    }

    return () => {
      if (streamingRef.current) {
        clearTimeout(streamingRef.current)
      }
    }
  }, [content, isStreaming, streamingSpeed, currentIndex, onStreamComplete])

  // Parse content to identify code blocks for special streaming treatment
  const parseContentForStreaming = (text: string) => {
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g
    const parts = []
    let lastIndex = 0
    let match

    while ((match = codeBlockRegex.exec(text)) !== null) {
      // Add text before code block
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: text.slice(lastIndex, match.index)
        })
      }
      
      // Add code block
      parts.push({
        type: 'code',
        language: match[1] || 'text',
        content: match[2]
      })
      
      lastIndex = match.index + match[0].length
    }
    
    // Add remaining text
    if (lastIndex < text.length) {
      parts.push({
        type: 'text',
        content: text.slice(lastIndex)
      })
    }
    
    return parts
  }

  const contentToDisplay = isStreamingActive ? displayedContent : content

  return (
    <div className="prose prose-sm dark:prose-invert max-w-none">
      <ReactMarkdown
        components={{
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '')
            const codeContent = String(children).replace(/\n$/, '')
            
            return !inline && match ? (
              <StreamingCodeBlock 
                className={className}
                isStreaming={isStreamingActive && contentToDisplay.includes(codeContent)}
                streamingSpeed={10}
              >
                {codeContent}
              </StreamingCodeBlock>
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
        {contentToDisplay}
      </ReactMarkdown>
      {isStreamingActive && (
        <span className="inline-block w-2 h-4 bg-primary ml-1 streaming-cursor" />
      )}
    </div>
  )
}