import { useEffect, useState } from 'react'
import Header from './components/Header/Header'
import YamlEditor from './components/YamlEditor/YamlEditor'
import UploadPanel from './components/UploadPanel/UploadPanel'
import GraphCanvas from './components/GraphCanvas/GraphCanvas'
import IssuePanel from './components/IssuePanel/IssuePanel'
import useStore from './store/store'
import { runSecurityChecks } from './validators/securityRules'
import { runReliabilityChecks } from './validators/reliabilityRules'

const SAMPLE_YAML = `apiVersion: v1
kind: Namespace
metadata:
  name: demo-app
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: web-ingress
  namespace: demo-app
spec:
  rules:
  - host: "app.example.com"
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: web-service
            port:
              number: 80
---
apiVersion: v1
kind: Service
metadata:
  name: web-service
  namespace: demo-app
spec:
  type: NodePort
  selector:
    app: demo-web
  ports:
  - port: 80
    targetPort: 8080
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-deployment
  namespace: demo-app
spec:
  replicas: 1
  selector:
    matchLabels:
      app: demo-web
  template:
    metadata:
      labels:
        app: demo-web
    spec:
      containers:
      - name: main-app
        image: nginx:latest
        ports:
        - containerPort: 8080
        env:
        - name: DB_HOST
          valueFrom:
            configMapKeyRef:
              name: app-config
              key: db_host
        - name: DB_PASSWORD
          value: "super-secret-plain-text-pass"
        - name: API_TOKEN
          valueFrom:
            secretKeyRef:
              name: app-secret
              key: api_token
        volumes:
        - name: config-volume
          configMap:
            name: app-config
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
  namespace: demo-app
data:
  db_host: "postgres-service.db.svc.cluster.local"
---
apiVersion: v1
kind: Secret
metadata:
  name: app-secret
  namespace: demo-app
type: Opaque
data:
  api_token: "dGVzdC10b2tlbi0xMjM0NQ=="
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: web-hpa
  namespace: demo-app
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: web-deployment
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 80
`

function App() {
  const { yamlText, setYamlText, resources, setIssues, issues } = useStore()
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  // Run scanners automatically whenever resources change
  useEffect(() => {
    if (resources.length === 0) {
      setIssues([])
      return
    }
    const securityIssues = runSecurityChecks(resources)
    const reliabilityIssues = runReliabilityChecks(resources)
    setIssues([...securityIssues, ...reliabilityIssues])
  }, [resources])

  const handleLoadSample = () => {
    setYamlText(SAMPLE_YAML)
  }

  const handleOpenBlank = () => {
    setYamlText('# Write your Kubernetes YAML configuration here...\n')
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden select-none">
      <Header />

      {/* Main container */}
      <div className="flex flex-1 overflow-hidden relative">
        {!yamlText ? (
          /* Landing/Empty State */
          <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gradient-to-b from-slate-900 to-slate-950">
            <div className="max-w-md w-full text-center space-y-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-400 text-3xl shadow-inner select-none">
                ☸️
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-bold tracking-tight text-white select-none">
                  Visualize your K8s YAML
                </h2>
                <p className="text-xs text-slate-400 leading-relaxed select-none">
                  Upload, paste, or write Kubernetes manifests to auto-generate connection graphs, detect resource dependencies, and run validation audits.
                </p>
              </div>

              {/* Upload Dropzone */}
              <div className="bg-slate-900/40 backdrop-blur border border-slate-800 rounded-xl overflow-hidden shadow-xl text-left">
                <UploadPanel />
              </div>

              {/* Quick Actions */}
              <div className="flex items-center justify-center gap-4 text-xs">
                <button
                  onClick={handleLoadSample}
                  className="px-4 py-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 hover:text-white transition-colors cursor-pointer font-semibold text-slate-300"
                >
                  💡 Load Sample
                </button>
                <button
                  onClick={handleOpenBlank}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors cursor-pointer"
                >
                  ✏️ Open Blank Editor
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Split-Screen layout */
          <>
            {/* Column 1: Live Editor */}
            <div className="w-[38%] min-w-[340px] max-w-[600px] h-full flex flex-col">
              <YamlEditor />
            </div>

            {/* Column 2: Graph Canvas */}
            <main className="flex-1 h-full relative bg-slate-950">
              <GraphCanvas />

              {/* Float Toggle for Sidebar */}
              {!isSidebarOpen && (
                <button
                  onClick={() => setIsSidebarOpen(true)}
                  className="absolute right-4 top-4 z-20 bg-slate-900 border border-slate-800 hover:border-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xl text-slate-300 transition-colors cursor-pointer"
                >
                  🔍 Scan Details ({issues.length})
                </button>
              )}
            </main>

            {/* Column 3: Collapsible Right Sidebar */}
            {isSidebarOpen && (
              <aside className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col overflow-hidden h-full relative shadow-2xl">
                {/* Close handle */}
                <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/20 select-none">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Scan Report
                  </h3>
                  <button
                    onClick={() => setIsSidebarOpen(false)}
                    className="text-slate-500 hover:text-slate-200 text-xs font-semibold px-2 py-0.5 rounded hover:bg-slate-800 cursor-pointer"
                    title="Hide sidebar"
                  >
                    Hide
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-slate-800">
                  {/* Resources list summary */}
                  {resources.length > 0 && (
                    <div className="p-4 bg-slate-950/10">
                      <h4 className="text-xs font-semibold text-slate-400 mb-2">
                        Resources ({resources.length})
                      </h4>
                      <ul className="space-y-1.5">
                        {resources.map((r, i) => (
                          <li
                            key={i}
                            className="text-[11px] text-slate-300 bg-slate-950/40 border border-slate-800/60 rounded px-2.5 py-1.5 flex items-center justify-between font-mono"
                          >
                            <span className="truncate pr-2" title={r.name}>{r.name}</span>
                            <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-slate-800/80 text-blue-400 font-sans font-bold shrink-0">
                              {r.kind}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Issues pane */}
                  <div className="flex flex-col">
                    <h4 className="text-xs font-semibold text-slate-400 px-4 pt-4 pb-2">
                      Detected Issues ({issues.length})
                    </h4>
                    <IssuePanel />
                  </div>
                </div>
              </aside>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default App