import { create } from 'zustand'
import { applyNodeChanges, applyEdgeChanges } from 'reactflow'
import { buildNodes } from '../graph/nodeFactory'
import { buildEdges } from '../graph/graphBuilder'
import { parseYAML, normalizeResources } from '../parsers/yamlParser'

const useStore = create((set) => ({
  // The raw YAML text state
  yamlText: '',
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
  setYamlText: (yamlText) => {
    set({ yamlText })
    const { resources, error } = parseYAML(yamlText)
    if (error) {
      set({ error })
    } else {
      const normalized = normalizeResources(resources)
      set({
        error: null,
        resources: normalized,
        nodes: buildNodes(normalized),
        edges: buildEdges(normalized),
      })
    }
  },

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
  reset: () => set({ resources: [], nodes: [], edges: [], error: null, issues: [], yamlText: '' }),
}))

export default useStore
