// This file detects relationships between resources and creates edges

export function buildEdges(resources) {
  const edges = []
  const edgeIds = new Set()

  // Helper to add edges safely without duplicates
  function addEdge(sourceId, targetId, label, color, animated = true) {
    const id = `${sourceId}->${targetId}`
    if (edgeIds.has(id)) return
    edgeIds.add(id)
    edges.push({
      id,
      source: sourceId,
      target: targetId,
      label,
      style: { stroke: color },
      labelStyle: { fill: color, fontSize: '10px', fontWeight: '500' },
      animated,
    })
  }

  // Filter resources by Kind for optimized linear scans
  const services = []
  const ingresses = []
  const configMaps = new Set()
  const secrets = new Set()
  const pvcs = new Set()
  const controllers = []
  const hpas = []

  resources.forEach((r) => {
    if (r.kind === 'Service') services.push(r)
    else if (r.kind === 'Ingress') ingresses.push(r)
    else if (r.kind === 'ConfigMap') configMaps.add(r.name)
    else if (r.kind === 'Secret') secrets.add(r.name)
    else if (r.kind === 'PersistentVolumeClaim' || r.kind === 'PVC') pvcs.add(r.name)
    else if (r.kind === 'HorizontalPodAutoscaler' || r.kind === 'HPA') hpas.push(r)
    else if (
      r.kind === 'Deployment' ||
      r.kind === 'StatefulSet' ||
      r.kind === 'DaemonSet' ||
      r.kind === 'Job' ||
      r.kind === 'CronJob' ||
      r.kind === 'Pod'
    ) {
      controllers.push(r)
    }
  })

  // Index controllers and services by key for O(1) lookups
  const serviceMap = new Map(services.map(s => [s.name, s]))

  // 1. Service -> Controller relationship (exposes)
  services.forEach((service) => {
    const selector = service.spec?.selector || {}
    const selectorKeys = Object.keys(selector)
    if (selectorKeys.length === 0) return

    controllers.forEach((controller) => {
      const podLabels = controller.spec?.template?.metadata?.labels || {}
      
      const matches = selectorKeys.every(
        (key) => podLabels[key] === selector[key]
      )

      if (matches) {
        // Source is the controller (providing traffic), target is the Service (exposing it)
        addEdge(
          `${controller.kind}-${controller.name}`,
          `Service-${service.name}`,
          'exposes',
          '#10b981' // Green
        )
      }
    })
  })

  // 2. Ingress -> Service relationship (routes to)
  ingresses.forEach((ingress) => {
    const rules = ingress.spec?.rules || []
    rules.forEach((rule) => {
      const paths = rule.http?.paths || []
      paths.forEach((path) => {
        const serviceName =
          path.backend?.service?.name ||
          path.backend?.serviceName

        if (serviceName && serviceMap.has(serviceName)) {
          addEdge(
            `Ingress-${ingress.name}`,
            `Service-${serviceName}`,
            'routes to',
            '#f59e0b' // Amber
          )
        }
      })
    })
  })

  // 3. Controller -> ConfigMap / Secret / PVC relationships (uses/claims)
  controllers.forEach((controller) => {
    const podSpec = controller.spec?.template?.spec || controller.spec || {}
    const volumes = podSpec.volumes || []
    const containers = podSpec.containers || []
    const controllerId = `${controller.kind}-${controller.name}`

    // Check Volume mounts
    volumes.forEach((vol) => {
      if (vol.configMap?.name && configMaps.has(vol.configMap.name)) {
        addEdge(
          controllerId,
          `ConfigMap-${vol.configMap.name}`,
          'uses config',
          '#6b7280', // Gray
          false
        )
      }
      if (vol.secret?.secretName && secrets.has(vol.secret.secretName)) {
        addEdge(
          controllerId,
          `Secret-${vol.secret.secretName}`,
          'uses secret',
          '#ef4444', // Red
          false
        )
      }
      if (vol.persistentVolumeClaim?.claimName && pvcs.has(vol.persistentVolumeClaim.claimName)) {
        addEdge(
          controllerId,
          `PVC-${vol.persistentVolumeClaim.claimName}`,
          'claims volume',
          '#f97316', // Orange
          false
        )
      }
    })

    // Check Container environment variables references
    containers.forEach((container) => {
      const env = container.env || []
      const envFrom = container.envFrom || []

      env.forEach((e) => {
        const cmRef = e.valueFrom?.configMapKeyRef?.name
        const secRef = e.valueFrom?.secretKeyRef?.name

        if (cmRef && configMaps.has(cmRef)) {
          addEdge(
            controllerId,
            `ConfigMap-${cmRef}`,
            'ref config',
            '#6b7280',
            false
          )
        }
        if (secRef && secrets.has(secRef)) {
          addEdge(
            controllerId,
            `Secret-${secRef}`,
            'ref secret',
            '#ef4444',
            false
          )
        }
      })

      envFrom.forEach((ef) => {
        const cmRef = ef.configMapRef?.name
        const secRef = ef.secretRef?.name

        if (cmRef && configMaps.has(cmRef)) {
          addEdge(
            controllerId,
            `ConfigMap-${cmRef}`,
            'ref config env',
            '#6b7280',
            false
          )
        }
        if (secRef && secrets.has(secRef)) {
          addEdge(
            controllerId,
            `Secret-${secRef}`,
            'ref secret env',
            '#ef4444',
            false
          )
        }
      })
    })
  })

  // 4. HPA -> Controller relationship (scales)
  hpas.forEach((hpa) => {
    const scaleTarget = hpa.spec?.scaleTargetRef
    if (scaleTarget && scaleTarget.name) {
      // Find matching controller
      const targetId = `${scaleTarget.kind}-${scaleTarget.name}`
      const targetExists = controllers.some(
        c => c.kind === scaleTarget.kind && c.name === scaleTarget.name
      )

      if (targetExists) {
        addEdge(
          `HPA-${hpa.name}`,
          targetId,
          'scales',
          '#ec4899', // Pink
          true
        )
      }
    }
  })

  return edges
}