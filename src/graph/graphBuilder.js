// This file detects relationships between resources and creates edges

export function buildEdges(resources) {
  const edges = []

  resources.forEach((resource) => {
    if (resource.kind === 'Service') {
      const selector = resource.spec?.selector || {}

      // Find Deployments/StatefulSets whose labels match this Service's selector
      resources.forEach((other) => {
        if (
          other.kind === 'Deployment' ||
          other.kind === 'StatefulSet' ||
          other.kind === 'DaemonSet'
        ) {
          const podLabels =
            other.spec?.template?.metadata?.labels || {}

          const matches = Object.entries(selector).every(
            ([key, value]) => podLabels[key] === value
          )

          if (matches && Object.keys(selector).length > 0) {
            edges.push({
              id: `${other.kind}-${other.name}->${resource.kind}-${resource.name}`,
              source: `${other.kind}-${other.name}`,
              target: `${resource.kind}-${resource.name}`,
              label: 'exposes',
              style: { stroke: '#10b981' },
              labelStyle: { fill: '#10b981', fontSize: '10px' },
              animated: true,
            })
          }
        }
      })
    }

    if (resource.kind === 'Ingress') {
      // Connect Ingress to the Services it routes to
      const rules = resource.spec?.rules || []
      rules.forEach((rule) => {
        const paths = rule.http?.paths || []
        paths.forEach((path) => {
          const serviceName =
            path.backend?.service?.name ||
            path.backend?.serviceName

          if (serviceName) {
            edges.push({
              id: `Ingress-${resource.name}->Service-${serviceName}`,
              source: `Ingress-${resource.name}`,
              target: `Service-${serviceName}`,
              label: 'routes to',
              style: { stroke: '#f59e0b' },
              labelStyle: { fill: '#f59e0b', fontSize: '10px' },
              animated: true,
            })
          }
        })
      })
    }
  })

  return edges
}