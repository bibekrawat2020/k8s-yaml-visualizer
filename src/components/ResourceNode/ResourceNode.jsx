import React from 'react'
import { Handle, Position } from 'reactflow'
import useStore from '../../store/store'

const KIND_CONFIGS = {
  Deployment: {
    border: 'border-blue-500/30 hover:border-blue-400/80',
    bg: 'from-blue-950/40 to-slate-900/90',
    text: 'text-blue-400',
    icon: '📦',
  },
  StatefulSet: {
    border: 'border-violet-500/30 hover:border-violet-400/80',
    bg: 'from-violet-950/40 to-slate-900/90',
    text: 'text-violet-400',
    icon: '💾',
  },
  DaemonSet: {
    border: 'border-cyan-500/30 hover:border-cyan-400/80',
    bg: 'from-cyan-950/40 to-slate-900/90',
    text: 'text-cyan-400',
    icon: '⚙️',
  },
  Service: {
    border: 'border-emerald-500/30 hover:border-emerald-400/80',
    bg: 'from-emerald-950/40 to-slate-900/90',
    text: 'text-emerald-400',
    icon: '🔌',
  },
  Ingress: {
    border: 'border-amber-500/30 hover:border-amber-400/80',
    bg: 'from-amber-950/40 to-slate-900/90',
    text: 'text-amber-400',
    icon: '🌐',
  },
  ConfigMap: {
    border: 'border-slate-500/30 hover:border-slate-400/80',
    bg: 'from-slate-800/40 to-slate-900/90',
    text: 'text-slate-400',
    icon: '📝',
  },
  Secret: {
    border: 'border-red-500/30 hover:border-red-400/80',
    bg: 'from-red-950/40 to-slate-900/90',
    text: 'text-red-400',
    icon: '🔑',
  },
  PersistentVolumeClaim: {
    border: 'border-orange-500/30 hover:border-orange-400/80',
    bg: 'from-orange-950/40 to-slate-900/90',
    text: 'text-orange-400',
    icon: '📁',
  },
  PVC: {
    border: 'border-orange-500/30 hover:border-orange-400/80',
    bg: 'from-orange-950/40 to-slate-900/90',
    text: 'text-orange-400',
    icon: '📁',
  },
  Namespace: {
    border: 'border-teal-500/30 hover:border-teal-400/80',
    bg: 'from-teal-950/40 to-slate-900/90',
    text: 'text-teal-400',
    icon: '🏷️',
  },
  HorizontalPodAutoscaler: {
    border: 'border-pink-500/30 hover:border-pink-400/80',
    bg: 'from-pink-950/40 to-slate-900/90',
    text: 'text-pink-400',
    icon: '📈',
  },
  HPA: {
    border: 'border-pink-500/30 hover:border-pink-400/80',
    bg: 'from-pink-950/40 to-slate-900/90',
    text: 'text-pink-400',
    icon: '📈',
  },
  Job: {
    border: 'border-lime-500/30 hover:border-lime-400/80',
    bg: 'from-lime-950/40 to-slate-900/90',
    text: 'text-lime-400',
    icon: '🏃',
  },
  CronJob: {
    border: 'border-lime-500/30 hover:border-lime-400/80',
    bg: 'from-lime-950/40 to-slate-900/90',
    text: 'text-lime-400',
    icon: '⏱️',
  },
  Pod: {
    border: 'border-indigo-500/30 hover:border-indigo-400/80',
    bg: 'from-indigo-950/40 to-slate-900/90',
    text: 'text-indigo-400',
    icon: '🐳',
  },
}

const fallbackConfig = {
  border: 'border-slate-600/30 hover:border-slate-500',
  bg: 'from-slate-800/40 to-slate-900/90',
  text: 'text-slate-400',
  icon: '📦',
}

export default function ResourceNode({ data }) {
  const { kind, name, namespace } = data
  const issues = useStore((state) => state.issues)

  // Filter issues targeting this specific resource
  const resourceIssues = issues.filter(
    (i) => i.resource.toLowerCase() === `${kind}/${name}`.toLowerCase()
  )

  const highCount = resourceIssues.filter((i) => i.severity === 'high').length
  const mediumCount = resourceIssues.filter((i) => i.severity === 'medium').length
  const lowCount = resourceIssues.filter((i) => i.severity === 'low').length

  const config = KIND_CONFIGS[kind] || fallbackConfig

  return (
    <div className={`relative px-4 py-3 rounded-xl border bg-gradient-to-br ${config.bg} ${config.border} backdrop-blur-md shadow-2xl transition-all duration-300 w-[180px] text-left group`}>
      <Handle
        type="target"
        position={Position.Top}
        className="w-2 h-2 !bg-slate-600 border-none rounded-full hover:!bg-blue-400 transition-colors"
      />

      {/* Node Content */}
      <div className="flex items-center gap-2">
        <span className="text-xl select-none" role="img" aria-label={kind}>
          {config.icon}
        </span>
        <div className="flex-1 min-w-0">
          <span className={`text-[9px] uppercase font-bold tracking-wider block ${config.text}`}>
            {kind}
          </span>
          <h4 className="text-[11px] font-semibold text-gray-100 truncate font-mono mt-0.5" title={name}>
            {name}
          </h4>
          {namespace && namespace !== 'default' && (
            <span className="text-[8px] text-gray-500 block truncate mt-0.5">
              ns: {namespace}
            </span>
          )}
        </div>
      </div>

      {/* Dynamic Issue Counter Badges */}
      {resourceIssues.length > 0 && (
        <div className="absolute -top-3 -right-2 flex items-center gap-1 bg-slate-950/90 border border-slate-800 rounded-full px-1.5 py-0.5 shadow-lg group-hover:scale-105 transition-transform text-[8px] font-semibold">
          {highCount > 0 && (
            <span className="text-red-500 font-mono flex items-center gap-0.5" title={`${highCount} High`}>
              🔴{highCount}
            </span>
          )}
          {mediumCount > 0 && (
            <span className="text-yellow-500 font-mono flex items-center gap-0.5" title={`${mediumCount} Medium`}>
              🟡{mediumCount}
            </span>
          )}
          {lowCount > 0 && (
            <span className="text-blue-400 font-mono flex items-center gap-0.5" title={`${lowCount} Low`}>
              🔵{lowCount}
            </span>
          )}
        </div>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        className="w-2 h-2 !bg-slate-600 border-none rounded-full hover:!bg-blue-400 transition-colors"
      />
    </div>
  )
}

