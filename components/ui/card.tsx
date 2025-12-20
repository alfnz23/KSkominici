export function Card({ children, className = '' }) {
  return <div className={`bg-white rounded-lg border p-4 ${className}`}>{children}</div>
}

export function CardHeader({ children }) {
  return <div className="mb-4">{children}</div>
}

export function CardTitle({ children }) {
  return <h3 className="text-lg font-bold">{children}</h3>
}

export function CardContent({ children }) {
  return <div>{children}</div>
}