import type { ValidationMessage } from '../types'

interface ValidationListProps {
  messages: ValidationMessage[]
}

export function ValidationList({ messages }: ValidationListProps) {
  if (messages.length === 0) {
    return null
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-slate-700">インポート検証</h3>
      <ul className="mt-3 space-y-2 text-sm">
        {messages.map((message, index) => (
          <li
            key={`${message.message}-${index}`}
            className={`flex items-start gap-2 ${
              message.level === 'error' ? 'text-red-600' : 'text-amber-600'
            }`}
          >
            <span className="mt-0.5 h-2.5 w-2.5 flex-shrink-0 rounded-full bg-current" />
            <span>
              {message.message}
              {message.context ? ` (${message.context})` : ''}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
