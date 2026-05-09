import ReactFlow, {
  Background,
  Controls,
  MiniMap,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { buildNodes } from '../../graph/nodeFactory'
import { buildEdges } from '../../graph/graphBuilder'
import useStore from '../../store/store'

function GraphCanvas() {
  const { resources } = useStore()

  const nodes = buildNodes(resources)
  const edges = buildEdges(resources)

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
      >
        {/* Grid background */}
        <Background color="#374151" gap={20} />

        {/* Zoom and pan controls */}
        <Controls />

        {/* Mini map in corner */}
        <MiniMap
          nodeColor={(node) => node.style?.background || '#374151'}
          style={{ background: '#1f2937' }}
        />
      </ReactFlow>
    </div>
  )
}

export default GraphCanvas