interface StepperProps {
  steps: string[]
  currentStep: number
}

export function Stepper({ steps, currentStep }: StepperProps) {
  return (
    <ol className="flex flex-wrap gap-4 text-sm text-slate-600">
      {steps.map((label, index) => {
        const isActive = index === currentStep
        const isCompleted = index < currentStep
        return (
          <li
            key={label}
            className={`flex items-center gap-2 rounded-full border px-3 py-1 ${
              isActive
                ? 'border-brand-500 bg-brand-50 text-brand-700'
                : isCompleted
                  ? 'border-brand-200 bg-white text-brand-400'
                  : 'border-slate-200 bg-white'
            }`}
          >
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                isActive
                  ? 'bg-brand-500 text-white'
                  : isCompleted
                    ? 'bg-brand-200 text-brand-700'
                    : 'bg-slate-200 text-slate-600'
              }`}
            >
              {index + 1}
            </span>
            <span className="whitespace-nowrap">{label}</span>
          </li>
        )
      })}
    </ol>
  )
}
