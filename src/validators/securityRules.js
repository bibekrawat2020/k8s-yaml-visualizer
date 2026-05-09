export function runSecurityChecks(resources) {
  const issues = []

  resources.forEach((resource) => {
    if (
      resource.kind === 'Deployment' ||
      resource.kind === 'StatefulSet' ||
      resource.kind === 'DaemonSet'
    ) {
      const containers = resource.spec?.template?.spec?.containers || []
      const podSpec = resource.spec?.template?.spec || {}

      // Check: host network usage
      if (podSpec.hostNetwork === true) {
        issues.push({
          severity: 'high',
          resource: `${resource.kind}/${resource.name}`,
          message: `hostNetwork is enabled. Pod shares the node's network namespace which is a serious security risk.`,
        })
      }

      // Check: host PID usage
      if (podSpec.hostPID === true) {
        issues.push({
          severity: 'high',
          resource: `${resource.kind}/${resource.name}`,
          message: `hostPID is enabled. Pod can see all processes on the node which is a serious security risk.`,
        })
      }

      containers.forEach((container) => {
        const name = container.name || resource.name
        const sc = container.securityContext || {}
        const envVars = container.env || []

        // Check 1: latest image tag
        if (
          container.image &&
          (container.image.endsWith(':latest') ||
            !container.image.includes(':'))
        ) {
          issues.push({
            severity: 'high',
            resource: `${resource.kind}/${resource.name}`,
            message: `Container "${name}" uses latest or untagged image. Pin to a specific version.`,
          })
        }

        // Check 2: missing securityContext
        if (!container.securityContext) {
          issues.push({
            severity: 'medium',
            resource: `${resource.kind}/${resource.name}`,
            message: `Container "${name}" has no securityContext defined.`,
          })
        }

        // Check 3: privileged container
        if (sc.privileged === true) {
          issues.push({
            severity: 'high',
            resource: `${resource.kind}/${resource.name}`,
            message: `Container "${name}" is running in privileged mode. This is a serious security risk.`,
          })
        }

        // Check 4: missing resource limits
        if (!container.resources?.limits) {
          issues.push({
            severity: 'medium',
            resource: `${resource.kind}/${resource.name}`,
            message: `Container "${name}" has no resource limits set. This can cause resource exhaustion.`,
          })
        }

        // Check 5: runAsNonRoot not set
        if (sc.runAsNonRoot !== true) {
          issues.push({
            severity: 'medium',
            resource: `${resource.kind}/${resource.name}`,
            message: `Container "${name}" does not set runAsNonRoot: true. Container may run as root user.`,
          })
        }

        // Check 6: readOnlyRootFilesystem not set
        if (sc.readOnlyRootFilesystem !== true) {
          issues.push({
            severity: 'medium',
            resource: `${resource.kind}/${resource.name}`,
            message: `Container "${name}" does not set readOnlyRootFilesystem: true. Filesystem is writable which increases attack surface.`,
          })
        }

        // Check 7: allowPrivilegeEscalation not explicitly disabled
        if (sc.allowPrivilegeEscalation !== false) {
          issues.push({
            severity: 'medium',
            resource: `${resource.kind}/${resource.name}`,
            message: `Container "${name}" does not set allowPrivilegeEscalation: false. A process could gain more privileges than its parent.`,
          })
        }

        // Check 8: hardcoded secrets in environment variables
        const sensitiveKeywords = [
          'password', 'secret', 'token', 'api_key',
          'apikey', 'auth', 'credential', 'private_key'
        ]

        envVars.forEach((env) => {
          const keyLower = (env.name || '').toLowerCase()
          const isSensitive = sensitiveKeywords.some((keyword) =>
            keyLower.includes(keyword)
          )

          // Flag only if value is hardcoded (not from secretKeyRef or configMapKeyRef)
          if (isSensitive && env.value) {
            issues.push({
              severity: 'high',
              resource: `${resource.kind}/${resource.name}`,
              message: `Container "${name}" has a hardcoded sensitive value in env var "${env.name}". Use a Kubernetes Secret with secretKeyRef instead.`,
            })
          }
        })
      })
    }

    // Check: NodePort exposure
    if (resource.kind === 'Service' && resource.spec?.type === 'NodePort') {
      issues.push({
        severity: 'medium',
        resource: `Service/${resource.name}`,
        message: `Service is exposed via NodePort. Consider using a LoadBalancer or Ingress instead.`,
      })
    }

    // Check: missing ingress TLS
    if (resource.kind === 'Ingress') {
      const tls = resource.spec?.tls
      if (!tls || tls.length === 0) {
        issues.push({
          severity: 'high',
          resource: `Ingress/${resource.name}`,
          message: `Ingress has no TLS configured. Traffic is served over plain HTTP.`,
        })
      }

      // Check: wildcard ingress host
      const rules = resource.spec?.rules || []
      rules.forEach((rule) => {
        if (rule.host && rule.host.startsWith('*')) {
          issues.push({
            severity: 'medium',
            resource: `Ingress/${resource.name}`,
            message: `Ingress uses a wildcard host "${rule.host}". This may expose unintended services.`,
          })
        }
      })
    }
  })

  return issues
}