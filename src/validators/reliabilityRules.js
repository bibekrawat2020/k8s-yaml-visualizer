export function runReliabilityChecks(resources) {
  const issues = []

  resources.forEach((resource) => {
    if (
      resource.kind === 'Deployment' ||
      resource.kind === 'StatefulSet'
    ) {
      const containers = resource.spec?.template?.spec?.containers || []

      // Check 1: single replica
      const replicas = resource.spec?.replicas
      if (!replicas || replicas === 1) {
        issues.push({
          severity: 'medium',
          resource: `${resource.kind}/${resource.name}`,
          message: `Only 1 replica defined. This is a single point of failure. Consider at least 2 replicas.`,
        })
      }

      containers.forEach((container) => {
        const name = container.name || resource.name

        // Check 2: missing liveness probe
        if (!container.livenessProbe) {
          issues.push({
            severity: 'low',
            resource: `${resource.kind}/${resource.name}`,
            message: `Container "${name}" has no livenessProbe. Kubernetes won't know if it crashes silently.`,
          })
        }

        // Check 3: missing readiness probe
        if (!container.readinessProbe) {
          issues.push({
            severity: 'low',
            resource: `${resource.kind}/${resource.name}`,
            message: `Container "${name}" has no readinessProbe. Traffic may reach unready pods.`,
          })
        }

        // Check 4: missing resource requests
        if (!container.resources?.requests) {
          issues.push({
            severity: 'low',
            resource: `${resource.kind}/${resource.name}`,
            message: `Container "${name}" has no resource requests. Scheduler can't make good placement decisions.`,
          })
        }
      })
    }
  })

  return issues
}