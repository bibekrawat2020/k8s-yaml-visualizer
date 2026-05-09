import { useEffect } from 'react'
import UploadPanel from './components/UploadPanel/UploadPanel'
import GraphCanvas from './components/GraphCanvas/GraphCanvas'
import IssuePanel from './components/IssuePanel/IssuePanel'
import useStore from './store/store'
import { runSecurityChecks } from './validators/securityRules'
import { runReliabilityChecks } from './validators/reliabilityRules'

function App() {
  const { resources, error, setIssues } = useStore()

  // Run scanners automatically whenever resources change
  useEffect(() => {
    if (resources.length === 0) return
    const securityIssues = runSecurityChecks(resources)
    const reliabilityIssues = runReliabilityChecks(resources)
    setIssues([...securityIssues, ...reliabilityIssues])
  }, [resources])

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">

      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <h1 className="text-xl font-bold text-blue-400">
          K8s YAML Visualizer
        </h1>
      </header>

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left sidebar */}
        <aside className="w-80 bg-gray-900 border-r border-gray-800 flex flex-col overflow-hidden">
          <UploadPanel />

          {resources.length > 0 && (
            <div className="p-4 border-b border-gray-800">
              <h3 className="text-sm font-semibold text-gray-400 mb-2">
                Detected Resources ({resources.length})
              </h3>
              <ul className="space-y-1">
                {resources.map((r, i) => (
                  <li
                    key={i}
                    className="text-sm text-gray-300 bg-gray-800 rounded px-3 py-2"
                  >
                    <span className="text-blue-400 font-medium">{r.kind}</span>
                    <span className="text-gray-500 mx-1">/</span>
                    {r.name}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {error && (
            <div className="m-4 p-3 bg-red-900 border border-red-700 rounded text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* Issues section */}
          {resources.length > 0 && (
            <div className="flex flex-col flex-1 overflow-hidden">
              <h3 className="text-sm font-semibold text-gray-400 px-4 pt-4 pb-2">
                Issues
              </h3>
              <div className="flex-1 overflow-y-auto">
                <IssuePanel />
              </div>
            </div>
          )}
        </aside>

        {/* Graph canvas */}
        <main className="flex-1">
          {resources.length === 0 ? (
            <div className="h-full flex items-center justify-center text-gray-600">
              Upload a YAML file to visualize your architecture
            </div>
          ) : (
            <GraphCanvas />
          )}
        </main>

      </div>
    </div>
  )
}

export default App