// This file decides the position and style of each node on the graph

const KIND_COLORS = {
  Deployment: '#3b82f6',    // blue
  StatefulSet: '#8b5cf6',   // purple
  DaemonSet: '#06b6d4',     // cyan
  Service: '#10b981',       // green
  Ingress: '#f59e0b',       // amber
  ConfigMap: '#6b7280',     // gray
  Secret: '#ef4444',        // red
  PVC: '#f97316',           // orange
  Namespace: '#14b8a6',     // teal
  HPA: '#ec4899',           // pink
  Job: '#84cc16',           // lime
  CronJob: '#84cc16',       // lime
}

export function buildNodes(resources) {
  return resources.map((resource, index) => ({
    id: `${resource.kind}-${resource.name}`,
    type: 'default',
    position: {
      // Arrange nodes in a grid layout automatically
      x: (index % 4) * 220 + 50,
      y: Math.floor(index / 4) * 150 + 50,
    },
    data: {
      label: `${resource.kind}\n${resource.name}`,
    },
    style: {
      background: KIND_COLORS[resource.kind] || '#374151',
      color: '#ffffff',
      border: 'none',
      borderRadius: '8px',
      padding: '10px 16px',
      fontSize: '12px',
      fontWeight: '600',
      minWidth: '160px',
      textAlign: 'center',
      whiteSpace: 'pre-line',
    },
  }))
}