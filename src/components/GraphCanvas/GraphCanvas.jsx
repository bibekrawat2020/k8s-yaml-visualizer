import React, { useMemo } from 'react'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
} from 'reactflow'
import 'reactflow/dist/style.css'
import useStore from '../../store/store'
import ResourceNode from '../ResourceNode/ResourceNode'

// Define custom node types outside component to prevent unnecessary re-render triggers
const nodeTypes = {
  resourceNode: ResourceNode,
}

// MiniMap node color mapper matching kind palettes
const getMiniMapNodeColor = (node) => {
  switch (node.data?.kind) {
    case 'Deployment': return '#3b82f6'
    case 'StatefulSet': return '#8b5cf6'
    case 'DaemonSet': return '#06b6d4'
    case 'Service': return '#10b981'
    case 'Ingress': return '#f59e0b'
    case 'ConfigMap': return '#6b7280'
    case 'Secret': return '#ef4444'
    case 'PersistentVolumeClaim':
    case 'PVC': return '#f97316'
    case 'Namespace': return '#14b8a6'
    case 'HorizontalPodAutoscaler':
    case 'HPA': return '#ec4899'
    case 'Job':
    case 'CronJob': return '#84cc16'
    case 'Pod': return '#6366f1'
    default: return '#475569'
  }
}

function GraphCanvas() {
  const { nodes, edges, onNodesChange, onEdgesChange } = useStore()

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
      >
        {/* Custom Grid background */}
        <Background color="#334155" gap={20} size={1} />

        {/* Zoom and pan controls */}
        <Controls className="!bg-slate-900 border !border-slate-800 !text-white" />

        {/* Premium Mini map in bottom-right corner */}
        <MiniMap
          nodeColor={getMiniMapNodeColor}
          style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }}
          maskColor="rgba(15, 23, 42, 0.6)"
        />
      </ReactFlow>
    </div>
  )
}

export default GraphCanvas