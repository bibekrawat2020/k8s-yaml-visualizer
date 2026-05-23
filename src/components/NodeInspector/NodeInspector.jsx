import React, { useState } from 'react'
import yaml from 'js-yaml'
import useStore from '../../store/store'

const REMEDIATIONS = {
  replica: 'Set spec.replicas to 2 or more to prevent single points of failure and support rolling updates.',
  liveness: 'Add a livenessProbe to monitor container health and trigger automatic restarts if the process hangs.',
  readiness: 'Add a readinessProbe to ensure traffic is only routed to containers that have finished initial startup.',
  requests: 'Define cpu/memory resource requests to help the Kubernetes scheduler make informed node placement decisions.',
  latest: 'Pin the container image to a specific tag (e.g., v1.2.3) instead of latest to ensure deterministic deployment behavior.',
  securitycontext: 'Configure a securityContext to restrict processes and system permissions for this container.',
  privileged: 'Disable privileged mode (set privileged: false) immediately unless running a system daemon that requires raw host access.',
  limits: 'Set cpu/memory resource limits to prevent a single leaking container from exhausting node resources (OOM Kills).',
  nonroot: 'Set runAsNonRoot: true to guarantee the container process does not execute as the root user.',
  readonly: 'Set readOnlyRootFilesystem: true to block write operations to the container root filesystem, decreasing attack surface.',
  escalation: 'Set allowPrivilegeEscalation: false to prevent child processes from gaining more privileges than their parent process.',
  hardcoded: 'Move this plain text secret to a Kubernetes Secret resource and inject it using secretKeyRef environment mapping.',
  nodeport: 'Use an Ingress controller or a LoadBalancer service type instead of NodePort to avoid open ports on host nodes.',
  tls: 'Add a tls section to the Ingress spec, mapping a TLS Secret certificate to secure traffic over HTTPS.',
  wildcard: 'Specify explicit subdomains (e.g., app.domain.com) instead of wildcards to restrict access to target backend routes.',
}

function getRemediation(message) {
  const msgLower = message.toLowerCase()
  if (msgLower.includes('replica')) return REMEDIATIONS.replica
  if (msgLower.includes('livenessprobe')) return REMEDIATIONS.liveness
  if (msgLower.includes('readinessprobe')) return REMEDIATIONS.readiness
  if (msgLower.includes('resource requests')) return REMEDIATIONS.requests
  if (msgLower.includes('latest') || msgLower.includes('untagged')) return REMEDIATIONS.latest
  if (msgLower.includes('privileged')) return REMEDIATIONS.privileged
  if (msgLower.includes('limits')) return REMEDIATIONS.limits
  if (msgLower.includes('runasnonroot')) return REMEDIATIONS.nonroot
  if (msgLower.includes('readonlyrootfilesystem')) return REMEDIATIONS.readonly
  if (msgLower.includes('allowprivilegeescalation')) return REMEDIATIONS.escalation
  if (msgLower.includes('hardcoded')) return REMEDIATIONS.hardcoded
  if (msgLower.includes('nodeport')) return REMEDIATIONS.nodeport
  if (msgLower.includes('tls')) return REMEDIATIONS.tls
  if (msgLower.includes('wildcard')) return REMEDIATIONS.wildcard
  if (msgLower.includes('securitycontext')) return REMEDIATIONS.securitycontext
  return 'Review the resource configuration and configure standard Kubernetes security and reliability settings.'
}

export default function NodeInspector() {
  const { selectedNodeId, setSelectedNodeId, resources, issues } = useStore()
  const [activeTab, setActiveTab] = useState('overview')

  const resource = resources.find(r => `${r.kind}-${r.name}` === selectedNodeId)

  if (!resource) {
    return (
      <div className="p-4 text-slate-500 text-xs font-mono text-center">
        Resource not found. Selection cleared.
        <button
          onClick={() => setSelectedNodeId(null)}
          className="mt-3 block w-full bg-slate-800 hover:bg-slate-700 py-1.5 rounded text-white"
        >
          Reset Selection
        </button>
      </div>
    )
  }

  const { kind, name, namespace, labels, raw, spec } = resource

  // Filter issues targeting this specific resource
  const resourceIssues = issues.filter(
    (i) => i.resource.toLowerCase() === `${kind}/${name}`.toLowerCase()
  )

  const handleBack = () => {
    setSelectedNodeId(null)
  }

  return (
    <div className="flex flex-col h-full bg-slate-900 overflow-hidden">
      {/* Inspector Header */}
      <div className="p-4 bg-slate-950/40 border-b border-slate-800/80 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-800 text-blue-400 font-sans">
            {kind}
          </span>
          <button
            onClick={handleBack}
            className="text-[10px] font-semibold text-slate-400 hover:text-white px-2 py-0.5 rounded hover:bg-slate-800 transition-colors cursor-pointer"
          >
            ← Back to Report
          </button>
        </div>
        <h3 className="text-sm font-bold text-white truncate font-mono mt-1" title={name}>
          {name}
        </h3>
        <span className="text-[10px] text-slate-500 font-mono">ns: {namespace}</span>
      </div>

      {/* Tab Selector */}
      <div className="flex bg-slate-950/20 border-b border-slate-800 select-none text-[11px] font-semibold">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 py-2 text-center border-b-2 transition-colors cursor-pointer ${
            activeTab === 'overview'
              ? 'border-blue-500 text-white bg-slate-800/20'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('yaml')}
          className={`flex-1 py-2 text-center border-b-2 transition-colors cursor-pointer ${
            activeTab === 'yaml'
              ? 'border-blue-500 text-white bg-slate-800/20'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Source YAML
        </button>
        <button
          onClick={() => setActiveTab('scans')}
          className={`flex-1 py-2 text-center border-b-2 transition-colors cursor-pointer ${
            activeTab === 'scans'
              ? 'border-blue-500 text-white bg-slate-800/20'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Audits ({resourceIssues.length})
        </button>
      </div>

      {/* Tab Content Panels */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === 'overview' && (
          <div className="space-y-4 text-xs">
            {/* Metadata Section */}
            <div className="space-y-2">
              <h4 className="font-bold text-slate-400 uppercase tracking-wider text-[9px]">Labels</h4>
              {Object.keys(labels).length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(labels).map(([k, v]) => (
                    <span
                      key={k}
                      className="bg-slate-950/50 border border-slate-800 rounded px-2 py-0.5 text-[10px] font-mono text-slate-300"
                    >
                      {k}: {v}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-slate-600 font-mono text-[10px]">No labels defined</span>
              )}
            </div>

            {/* Spec Highlights */}
            <div className="space-y-3 pt-2">
              <h4 className="font-bold text-slate-400 uppercase tracking-wider text-[9px]">Spec Properties</h4>
              
              {/* Kind specific helpers */}
              {(kind === 'Deployment' || kind === 'StatefulSet') && (
                <div className="bg-slate-950/30 rounded-lg border border-slate-800 p-3 space-y-2 font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Replicas:</span>
                    <span className="text-slate-200 font-bold">{spec.replicas ?? 1}</span>
                  </div>
                  {spec.selector?.matchLabels && (
                    <div className="space-y-1">
                      <span className="text-slate-500">Selector Labels:</span>
                      <div className="pl-2 space-y-0.5 text-slate-400 text-[11px]">
                        {Object.entries(spec.selector.matchLabels).map(([k, v]) => (
                          <div key={k}>{k} = {v}</div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Containers */}
              {(kind === 'Deployment' || kind === 'StatefulSet' || kind === 'DaemonSet' || kind === 'Job' || kind === 'CronJob') && (
                <div className="space-y-2">
                  <h5 className="font-semibold text-slate-400 text-[10px]">Containers</h5>
                  {(spec.template?.spec?.containers || spec.containers || []).map((c, i) => (
                    <div key={i} className="bg-slate-950/30 rounded-lg border border-slate-800 p-3 space-y-1.5">
                      <div className="flex justify-between font-mono">
                        <span className="text-slate-200 font-bold truncate max-w-[120px]">{c.name}</span>
                        <span className="text-slate-400 truncate max-w-[120px] text-[10px]" title={c.image}>
                          {c.image?.split('@')[0]}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-1 text-[10px] font-mono text-slate-500">
                        <div>
                          Ports: {c.ports?.map(p => p.containerPort).join(', ') || 'none'}
                        </div>
                        <div>
                          Limits: {c.resources?.limits ? 'Yes' : 'No'}
                        </div>
                        <div>
                          Liveness: {c.livenessProbe ? '✓' : '✗'}
                        </div>
                        <div>
                          Readiness: {c.readinessProbe ? '✓' : '✗'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Service Details */}
              {kind === 'Service' && (
                <div className="bg-slate-950/30 rounded-lg border border-slate-800 p-3 space-y-2 font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Type:</span>
                    <span className="text-slate-200 font-bold">{spec.type || 'ClusterIP'}</span>
                  </div>
                  {spec.selector && (
                    <div className="space-y-1">
                      <span className="text-slate-500">Target Selectors:</span>
                      <div className="pl-2 space-y-0.5 text-slate-400 text-[11px]">
                        {Object.entries(spec.selector).map(([k, v]) => (
                          <div key={k}>{k} = {v}</div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="space-y-1">
                    <span className="text-slate-500">Ports Mapping:</span>
                    <div className="pl-2 space-y-0.5 text-slate-300 text-[11px]">
                      {spec.ports?.map((p, idx) => (
                        <div key={idx}>
                          {p.protocol || 'TCP'} {p.port} → {p.targetPort || p.port} {p.nodePort ? `(NodePort: ${p.nodePort})` : ''}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Ingress Details */}
              {kind === 'Ingress' && (
                <div className="bg-slate-950/30 rounded-lg border border-slate-800 p-3 space-y-2 font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-500">TLS Encryption:</span>
                    <span className={spec.tls && spec.tls.length > 0 ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                      {spec.tls && spec.tls.length > 0 ? '🔒 Secured' : '🔓 Plain Text'}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <span className="text-slate-500">Routing Rules:</span>
                    {(spec.rules || []).map((r, rIdx) => (
                      <div key={rIdx} className="pl-2 border-l border-slate-800/80 space-y-1 mt-1 text-[11px]">
                        <div className="text-slate-200 font-bold">{r.host || '* (All Hosts)'}</div>
                        {r.http?.paths?.map((p, pIdx) => (
                          <div key={pIdx} className="text-slate-400 pl-2">
                            `{p.path}` ({p.pathType}) → <span className="text-blue-400">{p.backend?.service?.name || p.backend?.serviceName}</span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* HPA Details */}
              {kind === 'HorizontalPodAutoscaler' && (
                <div className="bg-slate-950/30 rounded-lg border border-slate-800 p-3 space-y-2 font-mono">
                  <div className="space-y-0.5">
                    <span className="text-slate-500 block">Target Resource:</span>
                    <span className="text-blue-400 font-bold">
                      {spec.scaleTargetRef?.kind}/{spec.scaleTargetRef?.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Scale Capacity:</span>
                    <span className="text-slate-300">
                      {spec.minReplicas ?? 1} - {spec.maxReplicas} replicas
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'yaml' && (
          <div className="space-y-2">
            <pre className="text-[10.5px] font-mono bg-slate-950 border border-slate-850 p-4 rounded-xl text-slate-300 overflow-x-auto select-text leading-5 max-h-[460px] scrollbar-thin scrollbar-thumb-slate-800">
              {yaml.dump(raw)}
            </pre>
          </div>
        )}

        {activeTab === 'scans' && (
          <div className="space-y-3">
            {resourceIssues.length === 0 ? (
              <div className="bg-emerald-950/20 border border-emerald-900/60 rounded-xl p-4 text-center space-y-2">
                <span className="text-2xl">🛡️</span>
                <h4 className="text-emerald-400 font-bold text-xs">No Warnings Found</h4>
                <p className="text-[10px] text-slate-500">This resource passed all validation audits.</p>
              </div>
            ) : (
              resourceIssues.map((issue, idx) => {
                const badgeColor =
                  issue.severity === 'high'
                    ? 'bg-red-500 text-white'
                    : issue.severity === 'medium'
                    ? 'bg-yellow-500 text-black'
                    : 'bg-blue-500 text-white'

                const borderClass =
                  issue.severity === 'high'
                    ? 'border-red-950/80 bg-red-950/15'
                    : issue.severity === 'medium'
                    ? 'border-yellow-950/80 bg-yellow-950/15'
                    : 'border-blue-950/80 bg-blue-950/15'

                return (
                  <div key={idx} className={`p-3 rounded-xl border flex flex-col gap-2 ${borderClass}`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${badgeColor}`}>
                        {issue.severity.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-200 mt-0.5 leading-relaxed">
                      {issue.message}
                    </p>
                    <div className="mt-1 border-t border-slate-800/60 pt-2 text-[10px] text-slate-400">
                      <span className="font-bold text-slate-300 block mb-0.5">Remediation:</span>
                      {getRemediation(issue.message)}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>
    </div>
  )
}
