import type { Dayjs } from 'dayjs'
import type { GuardianRequest, TeacherSlot, ValidationMessage } from '../types'
import { ValidationList } from './ValidationList'

interface PreviewSectionProps {
  requests: GuardianRequest[]
  slots: TeacherSlot[]
  messages: ValidationMessage[]
  meetingMinutes: number
  onChangeMeetingMinutes: (minutes: number) => void
  onBack: () => void
  onRunAssignment: () => void
  disableRun: boolean
}

const formatRange = (start: Dayjs, end: Dayjs) =>
  `${start.format('MM/DD HH:mm')} - ${end.format('HH:mm')}`

export function PreviewSection({
  requests,
  slots,
  messages,
  meetingMinutes,
  onChangeMeetingMinutes,
  onBack,
  onRunAssignment,
  disableRun,
}: PreviewSectionProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">内容確認</h2>
          <p className="text-sm text-slate-500">
            読み込んだ保護者希望と教師枠を確認し、問題がなければ自動割当を実行します。
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <span>面談時間（分）</span>
          <select
            value={meetingMinutes}
            onChange={(event) => onChangeMeetingMinutes(Number(event.target.value))}
            className="rounded-md border border-slate-300 bg-white px-2 py-1"
          >
            {[10, 15, 20, 30].map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
      </div>

      <ValidationList messages={messages} />

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <header className="border-b border-slate-200 bg-slate-100 px-4 py-3">
            <h3 className="text-sm font-semibold text-slate-700">保護者希望（{requests.length}件）</h3>
          </header>
          <div className="max-h-80 overflow-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-slate-600">保護者</th>
                  <th className="px-4 py-2 text-left font-medium text-slate-600">生徒</th>
                  <th className="px-4 py-2 text-left font-medium text-slate-600">希望枠</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {requests.map((request) => (
                  <tr key={request.guardianId}>
                    <td className="px-4 py-2">
                      <div className="font-medium text-slate-800">{request.guardianName}</div>
                      <div className="text-xs text-slate-400">ID: {request.guardianId}</div>
                    </td>
                    <td className="px-4 py-2 text-slate-600">{request.studentName}</td>
                    <td className="px-4 py-2 text-slate-600">
                      <ul className="space-y-1">
                        {request.preferences.map((preference) => {
                          const duration = preference.preferredEnd.diff(preference.preferredStart, 'minute')
                          const mismatch = duration !== meetingMinutes
                          return (
                            <li key={`${request.guardianId}-${preference.priority}`}>
                              <span className="font-semibold">第{preference.priority}希望:</span>{' '}
                              <span>{formatRange(preference.preferredStart, preference.preferredEnd)}</span>
                              {mismatch ? (
                                <span className="ml-1 text-xs text-amber-600">（{duration}分）</span>
                              ) : null}
                            </li>
                          )
                        })}
                      </ul>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <header className="border-b border-slate-200 bg-slate-100 px-4 py-3">
            <h3 className="text-sm font-semibold text-slate-700">教師枠（{slots.length}件）</h3>
          </header>
          <div className="max-h-80 overflow-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-slate-600">slot_id</th>
                  <th className="px-4 py-2 text-left font-medium text-slate-600">時間</th>
                  <th className="px-4 py-2 text-left font-medium text-slate-600">長さ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {slots.map((slot) => {
                  const duration = slot.end.diff(slot.start, 'minute')
                  return (
                    <tr key={slot.slotId}>
                      <td className="px-4 py-2 text-slate-600">{slot.slotId}</td>
                      <td className="px-4 py-2 text-slate-600">{formatRange(slot.start, slot.end)}</td>
                      <td className="px-4 py-2 text-slate-600">{duration} 分</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <div className="flex justify-between">
        <button
          type="button"
          onClick={onBack}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
        >
          アップロードに戻る
        </button>
        <button
          type="button"
          onClick={onRunAssignment}
          disabled={disableRun}
          className="rounded-lg bg-brand-500 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-brand-300"
        >
          自動割当を実行
        </button>
      </div>
    </div>
  )
}
