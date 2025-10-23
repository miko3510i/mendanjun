import { useState } from 'react'
import type { AssignmentOutcome, AssignmentRecord } from '../types'
import { formatDateTime } from '../services/scheduler'

interface ResultsSectionProps {
  outcome: AssignmentOutcome | null
  onReset: () => void
  onDownloadAssignments: () => void
  onDownloadUnassigned: () => void
}

type Filter = 'all' | 'assigned' | 'auto_adjusted' | 'unassigned'

const FILTER_LABELS: Record<Filter, string> = {
  all: 'すべて',
  assigned: '希望どおり',
  auto_adjusted: '自動調整',
  unassigned: '未割当',
}

export function ResultsSection({
  outcome,
  onReset,
  onDownloadAssignments,
  onDownloadUnassigned,
}: ResultsSectionProps) {
  const [filter, setFilter] = useState<Filter>('all')

  if (!outcome) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
        自動割当を実行すると結果がここに表示されます。
      </div>
    )
  }

  const filteredRecords = filterRecords(outcome, filter)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">割当結果</h2>
          <p className="text-sm text-slate-500">
            合計 {outcome.summary.total} 件中、希望どおり {outcome.summary.assigned} 件、自動調整 {outcome.summary.autoAdjusted} 件、未割当 {outcome.summary.unassigned} 件です。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onDownloadAssignments}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            割当CSVをダウンロード
          </button>
          <button
            type="button"
            onClick={onDownloadUnassigned}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            未割当CSVをダウンロード
          </button>
          <button
            type="button"
            onClick={onReset}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
          >
            新しくやり直す
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {(Object.keys(FILTER_LABELS) as Filter[]).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={`rounded-full px-4 py-1 text-sm font-medium transition ${
              filter === key
                ? 'bg-brand-500 text-white shadow'
                : 'border border-slate-300 bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            {FILTER_LABELS[key]}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="max-h-[28rem] overflow-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-slate-600">出席番号</th>
                <th className="px-4 py-2 text-left font-medium text-slate-600">開始</th>
                <th className="px-4 py-2 text-left font-medium text-slate-600">終了</th>
                <th className="px-4 py-2 text-left font-medium text-slate-600">ステータス</th>
                <th className="px-4 py-2 text-left font-medium text-slate-600">priority</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {filteredRecords.map((record) => (
                <tr key={`${record.studentNumber}-${record.slotId ?? record.status}`}>
                  <td className="px-4 py-2 text-slate-600">{record.studentNumber}</td>
                  <td className="px-4 py-2 text-slate-600">{formatDateTime(record.assignedStart)}</td>
                  <td className="px-4 py-2 text-slate-600">{formatDateTime(record.assignedEnd)}</td>
                  <td className="px-4 py-2 text-slate-600">{FILTER_LABELS[record.status as Filter] ?? record.status}</td>
                  <td className="px-4 py-2 text-slate-600">{record.matchedPriority ?? '-'}</td>
                </tr>
              ))}
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-sm text-slate-500">
                    該当するレコードがありません。
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function filterRecords(outcome: AssignmentOutcome, filter: Filter): AssignmentRecord[] {
  if (filter === 'all') {
    return outcome.assignments.concat(outcome.unassigned)
  }

  if (filter === 'unassigned') {
    return outcome.unassigned
  }

  return outcome.assignments.filter((record) => record.status === filter)
}
