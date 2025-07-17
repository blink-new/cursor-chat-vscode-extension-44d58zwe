import { useState } from 'react'
import { Check, Copy, ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from './ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible'
import { Badge } from './ui/badge'

interface DiffLine {
  type: 'added' | 'removed' | 'unchanged' | 'modified'
  content: string
  lineNumber?: number
  oldLineNumber?: number
  newLineNumber?: number
}

interface CodeDiffProps {
  title?: string
  filename?: string
  language?: string
  oldCode?: string
  newCode?: string
  diff?: DiffLine[]
  className?: string
}

export const CodeDiff = ({ 
  title = "Code Changes", 
  filename, 
  language = "typescript",
  oldCode,
  newCode,
  diff,
  className = "" 
}: CodeDiffProps) => {
  const [copied, setCopied] = useState(false)
  const [isOpen, setIsOpen] = useState(true)

  // Generate diff if not provided
  const generateDiff = (): DiffLine[] => {
    if (diff) return diff
    
    if (!oldCode || !newCode) return []
    
    const oldLines = oldCode.split('\n')
    const newLines = newCode.split('\n')
    const result: DiffLine[] = []
    
    // Simple diff algorithm (for demo purposes)
    let oldIndex = 0
    let newIndex = 0
    
    while (oldIndex < oldLines.length || newIndex < newLines.length) {
      const oldLine = oldLines[oldIndex]
      const newLine = newLines[newIndex]
      
      if (oldIndex >= oldLines.length) {
        // Only new lines left
        result.push({
          type: 'added',
          content: newLine,
          newLineNumber: newIndex + 1
        })
        newIndex++
      } else if (newIndex >= newLines.length) {
        // Only old lines left
        result.push({
          type: 'removed',
          content: oldLine,
          oldLineNumber: oldIndex + 1
        })
        oldIndex++
      } else if (oldLine === newLine) {
        // Lines are the same
        result.push({
          type: 'unchanged',
          content: oldLine,
          oldLineNumber: oldIndex + 1,
          newLineNumber: newIndex + 1
        })
        oldIndex++
        newIndex++
      } else {
        // Lines are different - mark as modified
        result.push({
          type: 'removed',
          content: oldLine,
          oldLineNumber: oldIndex + 1
        })
        result.push({
          type: 'added',
          content: newLine,
          newLineNumber: newIndex + 1
        })
        oldIndex++
        newIndex++
      }
    }
    
    return result
  }

  const diffLines = generateDiff()
  const addedCount = diffLines.filter(line => line.type === 'added').length
  const removedCount = diffLines.filter(line => line.type === 'removed').length

  const handleCopy = async () => {
    const content = diffLines.map(line => line.content).join('\n')
    await navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const getLineClass = (type: DiffLine['type']) => {
    switch (type) {
      case 'added':
        return 'diff-added bg-green-500/10 border-l-green-500'
      case 'removed':
        return 'diff-removed bg-red-500/10 border-l-red-500'
      case 'modified':
        return 'diff-modified bg-blue-500/10 border-l-blue-500'
      default:
        return ''
    }
  }

  const getLinePrefix = (type: DiffLine['type']) => {
    switch (type) {
      case 'added':
        return '+'
      case 'removed':
        return '-'
      default:
        return ' '
    }
  }

  return (
    <div className={`border border-border rounded-lg overflow-hidden ${className}`}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between bg-card border-b border-border px-4 py-3 hover:bg-muted/50 cursor-pointer">
            <div className="flex items-center gap-3">
              {isOpen ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
              <div>
                <h3 className="font-medium text-sm">{title}</h3>
                {filename && (
                  <p className="text-xs text-muted-foreground font-mono">{filename}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {addedCount > 0 && (
                <Badge variant="outline" className="text-green-600 border-green-600/20 bg-green-600/10">
                  +{addedCount}
                </Badge>
              )}
              {removedCount > 0 && (
                <Badge variant="outline" className="text-red-600 border-red-600/20 bg-red-600/10">
                  -{removedCount}
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  handleCopy()
                }}
                className="h-6 w-6 p-0"
              >
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              </Button>
            </div>
          </div>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <div className="bg-muted/30">
            <div className="font-mono text-xs">
              {diffLines.map((line, index) => (
                <div
                  key={index}
                  className={`flex items-start border-l-2 border-transparent ${getLineClass(line.type)}`}
                >
                  <div className="flex-shrink-0 w-16 px-2 py-1 text-muted-foreground text-right border-r border-border/50">
                    {line.oldLineNumber || line.newLineNumber || ''}
                  </div>
                  <div className="flex-shrink-0 w-6 px-1 py-1 text-center text-muted-foreground">
                    {getLinePrefix(line.type)}
                  </div>
                  <div className="flex-1 px-2 py-1 overflow-x-auto">
                    <code className="whitespace-pre">{line.content}</code>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}