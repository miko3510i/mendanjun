import { useRef, type ChangeEvent } from 'react'

interface FileMeta {
  filename: string
  count: number
  hasErrors: boolean
}

interface UploadSectionProps {
  onUploadFamilies: (file: File) => Promise<void>
  onUploadSlots: (file: File) => Promise<void>
  familyMeta?: FileMeta
  slotMeta?: FileMeta
  familyLoading: boolean
  slotLoading: boolean
  onNext: () => void
  canProceed: boolean
}

interface UploadCardProps {
  title: string
  description: string
  onUpload: (file: File) => Promise<void>
  meta?: FileMeta
  isLoading: boolean
  accept?: string
}

function UploadCard({ title, description, onUpload, meta, isLoading, accept }: UploadCardProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)

  const handleFileSelect = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    await onUpload(file)
    event.target.value = ''
  }

  const handleClick = () => {
    inputRef.current?.click()
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-dashed border-slate-300 bg-white p-6">
      <div>
        <p className="text-base font-semibold text-slate-800">{title}</p>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
      <button
        type="button"
        onClick={handleClick}
        disabled={isLoading}
        className="inline-flex items-center justify-center rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-brand-300"
      >
        {isLoading ? '読み込み中…' : 'CSVを選択'}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={accept ?? '.csv'}
        className="hidden"
        onChange={handleFileSelect}
      />
      {meta ? (
        <div className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-600">
          <p className="font-medium text-slate-700">{meta.filename}</p>
          <p>
            {meta.count} 件のレコードを読み込みました
            {meta.hasErrors ? '（エラーあり）' : ''}
          </p>
        </div>
      ) : (
        <p className="text-sm text-slate-400">まだファイルが選択されていません</p>
      )}
    </div>
  )
}

export function UploadSection({
  onUploadFamilies,
  onUploadSlots,
  familyMeta,
  slotMeta,
  familyLoading,
  slotLoading,
  onNext,
  canProceed,
}: UploadSectionProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <UploadCard
          title="希望一覧CSV"
          description="student_number / priority / preferred_start などの列を含むCSVをアップロードしてください。"
          onUpload={onUploadFamilies}
          meta={familyMeta}
          isLoading={familyLoading}
        />
        <UploadCard
          title="教師枠CSV"
          description="slot_id / start / end 列を含む教師の空き枠CSVをアップロードしてください。"
          onUpload={onUploadSlots}
          meta={slotMeta}
          isLoading={slotLoading}
        />
      </div>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onNext}
          disabled={!canProceed}
          className="rounded-lg bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          プレビューへ進む
        </button>
      </div>
    </div>
  )
}
