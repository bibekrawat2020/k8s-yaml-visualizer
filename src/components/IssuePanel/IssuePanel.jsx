import useStore from '../../store/store'

const SEVERITY_STYLES = {
  high: {
    badge: 'bg-red-500 text-white',
    border: 'border-red-800',
    bg: 'bg-red-950',
  },
  medium: {
    badge: 'bg-yellow-500 text-black',
    border: 'border-yellow-800',
    bg: 'bg-yellow-950',
  },
  low: {
    badge: 'bg-blue-500 text-white',
    border: 'border-blue-800',
    bg: 'bg-blue-950',
  },
}

function IssuePanel() {
  const { issues } = useStore()

  const high = issues.filter((i) => i.severity === 'high')
  const medium = issues.filter((i) => i.severity === 'medium')
  const low = issues.filter((i) => i.severity === 'low')

  if (issues.length === 0) {
    return (
      <div className="p-4 text-gray-500 text-sm">
        No issues detected.
      </div>
    )
  }

  return (
    <div className="p-4 space-y-2 overflow-y-auto">
      {/* Summary bar */}
      <div className="flex gap-3 mb-4 text-xs font-semibold">
        <span className="bg-red-500 text-white px-2 py-1 rounded">
          {high.length} High
        </span>
        <span className="bg-yellow-500 text-black px-2 py-1 rounded">
          {medium.length} Medium
        </span>
        <span className="bg-blue-500 text-white px-2 py-1 rounded">
          {low.length} Low
        </span>
      </div>

      {/* Issue cards */}
      {issues.map((issue, i) => {
        const style = SEVERITY_STYLES[issue.severity]
        return (
          <div
            key={i}
            className={`rounded-lg border p-3 ${style.bg} ${style.border}`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs font-bold px-2 py-0.5 rounded ${style.badge}`}>
                {issue.severity.toUpperCase()}
              </span>
              <span className="text-xs text-gray-400 font-mono">
                {issue.resource}
              </span>
            </div>
            <p className="text-sm text-gray-200">{issue.message}</p>
          </div>
        )
      })}
    </div>
  )
}

export default IssuePanel