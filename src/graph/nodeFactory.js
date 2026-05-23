// This file decides the position and layout of each node on the graph

const KIND_LAYERS = {
  Namespace: 0,
  Ingress: 0,
  Service: 1,
  Deployment: 2,
  StatefulSet: 2,
  DaemonSet: 2,
  Job: 2,
  CronJob: 2,
  // Default layer for ConfigMap, Secret, PVC, HPA, etc., is 3.
}

export function buildNodes(resources) {
  // Initialize the node structures
  const nodes = resources.map((resource) => ({
    id: `${resource.kind}-${resource.name}`,
    type: 'resourceNode',
    data: {
      resource,
      kind: resource.kind,
      name: resource.name,
      namespace: resource.namespace,
      labels: resource.labels || {},
    },
    position: { x: 0, y: 0 } // Will be calculated below
  }))

  // Group nodes by their semantic layer
  const nodesByLayer = [[], [], [], []]
  nodes.forEach((node) => {
    const layer = KIND_LAYERS[node.data.kind] !== undefined ? KIND_LAYERS[node.data.kind] : 3
    nodesByLayer[layer].push(node)
  })

  // Calculate layout coordinates dynamically with row wrapping (max 4 per row)
  let currentY = 50
  const LAYER_SPACING = 200
  const ROW_SPACING = 140
  const NODE_WIDTH_SPACING = 240
  const CENTER_X = 400

  for (let layerIdx = 0; layerIdx < 4; layerIdx++) {
    const layerNodes = nodesByLayer[layerIdx]
    if (layerNodes.length === 0) continue

    const rowsCount = Math.ceil(layerNodes.length / 4)

    layerNodes.forEach((node, idx) => {
      const rowIdx = Math.floor(idx / 4)
      const colIdx = idx % 4
      
      // Determine how many items are in this specific row
      const itemsInRow = Math.min(4, layerNodes.length - rowIdx * 4)
      
      // Center-align the items within the row
      const startX = CENTER_X - ((itemsInRow - 1) * NODE_WIDTH_SPACING) / 2
      
      node.position = {
        x: startX + colIdx * NODE_WIDTH_SPACING,
        y: currentY + rowIdx * ROW_SPACING,
      }
    })

    // Advance Y coordinate for the next layer, accounting for multiple rows in this layer
    currentY += rowsCount * ROW_SPACING + LAYER_SPACING - ROW_SPACING
  }

  return nodes
}