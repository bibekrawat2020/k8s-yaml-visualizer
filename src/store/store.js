import { create } from 'zustand'
import { applyNodeChanges, applyEdgeChanges } from 'reactflow'
import { buildNodes } from '../graph/nodeFactory'
import { buildEdges } from '../graph/graphBuilder'

const useStore = create((set) => ({
  // The raw parsed resources from the YAML file
  resources: [],
  // React Flow state for nodes and edges
  nodes: [],
  edges: [],
  // Any parse error message
  error: null,
  // Security and reliability issues found
  issues: [],

  // Actions
  setResources: (resources) => {
    set({
      resources,
      nodes: buildNodes(resources),
      edges: buildEdges(resources),
    })
  },
  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  
  onNodesChange: (changes) => {
    set((state) => ({
      nodes: applyNodeChanges(changes, state.nodes),
    }))
  },
  
  onEdgesChange: (changes) => {
    set((state) => ({
      edges: applyEdgeChanges(changes, state.edges),
    }))
  },

  setError: (error) => set({ error }),
  setIssues: (issues) => set({ issues }),
  reset: () => set({ resources: [], nodes: [], edges: [], error: null, issues: [] }),
}))

export default useStore