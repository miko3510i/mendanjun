import Papa from 'papaparse'
import { formatDateTime } from './scheduler'
import type { AssignmentRecord } from '../types'

const createCsvBlob = (rows: Record<string, unknown>[]): Blob => {
  const csv = Papa.unparse(rows)
  return new Blob([csv], { type: 'text/csv;charset=utf-8;' })
}

const triggerDownload = (filename: string, blob: Blob) => {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

export const downloadAssignmentsCsv = (records: AssignmentRecord[]) => {
  const rows = records.map((record) => ({
    guardian_id: record.guardianId,
    guardian_name: record.guardianName,
    student_name: record.studentName,
    slot_id: record.slotId ?? '',
    assigned_start: formatDateTime(record.assignedStart),
    assigned_end: formatDateTime(record.assignedEnd),
    status: record.status,
    matched_priority: record.matchedPriority ?? '',
    notes: record.notes ?? '',
  }))

  triggerDownload('assignments.csv', createCsvBlob(rows))
}

export const downloadUnassignedCsv = (records: AssignmentRecord[]) => {
  const rows = records
    .filter((record) => record.status === 'unassigned')
    .map((record) => ({
      guardian_id: record.guardianId,
      guardian_name: record.guardianName,
      student_name: record.studentName,
      notes: record.notes ?? '',
    }))

  triggerDownload('unassigned.csv', createCsvBlob(rows))
}
