import React, { useRef, useEffect } from 'react'
import useStore from '../../store/store'

export default function YamlEditor() {
  const { yamlText, setYamlText, error, resources } = useStore()
  const textareaRef = useRef(null)
  const lineNumbersRef = useRef(null)

  // Split yamlText by newline to count lines (at least 1 line even if empty)
  const linesCount = Math.max(1, yamlText.split('\n').length)

  const handleScroll = (e) => {
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = e.target.scrollTop
    }
  }

  // Auto-focus textarea when the component mounts or resets
  useEffect(() => {
    if (textareaRef.current && yamlText === '') {
      textareaRef.current.focus()
    }
  }, [yamlText])

  const handleCopy = () => {
    navigator.clipboard.writeText(yamlText)
  }

  return (
    <div className="flex flex-col flex-1 h-full overflow-hidden bg-slate-900 border-r border-slate-800">
      {/* Editor Header */}
      <div className="px-4 py-2 bg-slate-950/60 border-b border-slate-800/80 flex justify-between items-center text-xs text-slate-400 font-mono select-none">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
          live-editor.yaml
        </span>
        <button
          onClick={handleCopy}
          title="Copy to clipboard"
          className="hover:text-white transition-colors cursor-pointer px-2 py-0.5 rounded hover:bg-slate-800 text-[10px]"
        >
          Copy Code
        </button>
      </div>

      {/* Editor Main Area (Lines + Textarea) */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Line Numbers Column */}
        <div
          ref={lineNumbersRef}
          className="w-10 bg-slate-950/30 text-right pr-2 py-4 select-none text-[11px] font-mono text-slate-600 overflow-hidden leading-6 border-r border-slate-800/40"
        >
          {Array.from({ length: linesCount }, (_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>

        {/* Text Area */}
        <textarea
          ref={textareaRef}
          value={yamlText}
          onChange={(e) => setYamlText(e.target.value)}
          onScroll={handleScroll}
          spellCheck="false"
          placeholder="# Paste or write Kubernetes YAML here...&#10;# Example:&#10;apiVersion: v1&#10;kind: Namespace&#10;metadata:&#10;  name: my-namespace"
          className="flex-1 resize-none bg-transparent outline-none p-4 text-[11.5px] font-mono text-slate-100 leading-6 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-800"
        />
      </div>

      {/* Validation Status Footer */}
      <div className="px-4 py-2 border-t border-slate-800 bg-slate-950/80 text-[11px] font-mono flex items-center justify-between select-none">
        {error ? (
          <span className="text-red-400 font-semibold truncate mr-2" title={error}>
            ❌ Syntax Error: {error}
          </span>
        ) : yamlText ? (
          <span className="text-emerald-400 font-semibold">
            ✓ Parsed successfully ({resources.length} resource{resources.length !== 1 ? 's' : ''})
          </span>
        ) : (
          <span className="text-slate-500">
            Waiting for input...
          </span>
        )}
      </div>
    </div>
  )
}
