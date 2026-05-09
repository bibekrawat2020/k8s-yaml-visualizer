import yaml from 'js-yaml'

// This function takes raw YAML text and returns an array of Kubernetes resources
export function parseYAML(yamlText) {
  try {
    // Kubernetes files can have multiple resources separated by ---
    // loadAll handles that and gives us each one separately
    const documents = []
    yaml.loadAll(yamlText, (doc) => {
      if (doc) documents.push(doc)
    })
    return { resources: documents, error: null }
  } catch (err) {
    return { resources: [], error: err.message }
  }
}

// This function extracts the important fields we care about from each resource
export function normalizeResources(resources) {
  return resources
    .filter(r => r && r.kind && r.metadata)
    .map(r => ({
      kind: r.kind,                                      // e.g. Deployment, Service
      name: r.metadata?.name || 'unnamed',              // resource name
      namespace: r.metadata?.namespace || 'default',    // which namespace
      labels: r.metadata?.labels || {},                 // labels on the resource
      spec: r.spec || {},                               // full spec for later analysis
      raw: r                                            // keep original for reference
    }))
}