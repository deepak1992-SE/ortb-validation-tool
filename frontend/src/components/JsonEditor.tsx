import { useRef } from 'react'
import Editor from '@monaco-editor/react'
import { cn } from '@/lib/utils'

interface JsonEditorProps {
  value: string
  onChange: (value: string) => void
  height?: string
  placeholder?: string
  readOnly?: boolean
  className?: string
}

export function JsonEditor({
  value,
  onChange,
  height = '300px',
  placeholder,
  readOnly = false,
  className
}: JsonEditorProps) {
  const editorRef = useRef<any>(null)

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor
    
    // Configure editor options
    editor.updateOptions({
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      fontSize: 14,
      lineNumbers: 'on',
      roundedSelection: false,
      scrollbar: {
        vertical: 'visible',
        horizontal: 'visible',
        useShadows: false,
        verticalHasArrows: false,
        horizontalHasArrows: false,
        verticalScrollbarSize: 8,
        horizontalScrollbarSize: 8
      },
      folding: true,
      wordWrap: 'on',
      automaticLayout: true
    })

    // Add custom key bindings
    // @ts-ignore
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      // Format JSON on Ctrl+S
      editor.getAction('editor.action.formatDocument').run()
    })
  }

  const handleEditorChange = (newValue: string | undefined) => {
    onChange(newValue || '')
  }

  return (
    <div className={cn("border border-gray-300 rounded-md overflow-hidden", className)}>
      <Editor
        height={height}
        defaultLanguage="json"
        value={value}
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        options={{
          readOnly,
          // @ts-ignore
          placeholder,
          theme: 'vs',
          automaticLayout: true,
          formatOnPaste: true,
          formatOnType: true,
          tabSize: 2,
          insertSpaces: true,
          detectIndentation: false,
          bracketPairColorization: {
            enabled: true
          },
          suggest: {
            showKeywords: true,
            showSnippets: true
          },
          quickSuggestions: {
            other: true,
            comments: false,
            strings: true
          }
        }}
        loading={
          <div className="flex items-center justify-center h-full">
            <div className="spinner" />
          </div>
        }
      />
    </div>
  )
}