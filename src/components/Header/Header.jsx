import React, { useRef } from 'react'
import useStore from '../../store/store'

export default function Header() {
  const { yamlText, setYamlText, reset } = useStore()
  const fileInputRef = useRef(null)

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (evt) => {
      setYamlText(evt.target.result)
    }
    reader.readAsText(file)
  }

  const handleDownload = () => {
    if (!yamlText) return
    const blob = new Blob([yamlText], { type: 'text/yaml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'k8s-architecture.yaml'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <header className="bg-slate-900/90 border-b border-slate-800 backdrop-blur-md px-6 py-3 flex items-center justify-between sticky top-0 z-50 shadow-md">
      <div className="flex items-center gap-3">
        <span className="text-2xl select-none" role="img" aria-label="k8s-logo">☸️</span>
        <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent select-none">
          K8s YAML Visualizer
        </h1>
      </div>
      
      <div className="flex items-center gap-3">
        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".yaml,.yml"
          className="hidden"
        />
        
        <button
          onClick={() => fileInputRef.current.click()}
          className="px-3.5 py-1.5 rounded-lg border border-slate-700 bg-slate-800/50 hover:bg-slate-800 text-xs font-semibold text-slate-200 transition-colors shadow-sm cursor-pointer"
        >
          Import YAML
        </button>

        <button
          onClick={handleDownload}
          disabled={!yamlText}
          className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 disabled:cursor-not-allowed text-xs font-semibold text-white transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
        >
          Download YAML
        </button>

        {yamlText && (
          <button
            onClick={reset}
            className="px-3.5 py-1.5 rounded-lg border border-red-900/30 bg-red-950/20 hover:bg-red-950/40 text-xs font-semibold text-red-400 transition-colors cursor-pointer"
          >
            Reset
          </button>
        )}
      </div>
    </header>
  )
}
