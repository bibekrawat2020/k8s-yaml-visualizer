import { create } from 'zustand'

const useStore = create((set) => ({
  // The raw parsed resources from the YAML file
  resources: [],
  // Any parse error message
  error: null,
  // Security and reliability issues found
  issues: [],

  // Actions
  setResources: (resources) => set({ resources }),
  setError: (error) => set({ error }),
  setIssues: (issues) => set({ issues }),
  reset: () => set({ resources: [], error: null, issues: [] }),
}))

export default useStore