import Papa from 'papaparse'
import type { ParseResult } from 'papaparse'
import { dayjs } from '../utils/dayjs'
import type {
  GuardianPreference,
  GuardianRequest,
  ParsedData,
  TeacherSlot,
  ValidationMessage,
} from '../types'

const REQUIRED_FAMILY_FIELDS = [
  'guardian_id',
  'guardian_name',
  'student_name',
  'priority',
  'preferred_start',
  'preferred_end',
]

const REQUIRED_SLOT_FIELDS = ['slot_id', 'start', 'end']

const trim = (value: unknown): string => (typeof value === 'string' ? value.trim() : '')

const normaliseRow = (row: Record<string, unknown>): Record<string, string> => {
  return Object.entries(row).reduce<Record<string, string>>((acc, [key, value]) => {
    acc[key.trim().toLowerCase()] = trim(value)
    return acc
  }, {})
}

const isRowEmpty = (row: Record<string, string>): boolean =>
  Object.values(row).every((value) => value === '')

async function parseCsvFile(file: File): Promise<Record<string, string>[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: 'greedy',
      transformHeader: (header: string) => header.trim().toLowerCase(),
      complete: (results: ParseResult<Record<string, string>>) => {
        if (results.errors.length > 0) {
          reject(results.errors.map((error) => error.message).join('\n'))
          return
        }
        resolve(results.data.filter((row) => !isRowEmpty(row)))
      },
    })
  })
}

export async function parseFamilyFile(file: File): Promise<ParsedData<GuardianRequest[]>> {
  const rows = await parseCsvFile(file)
  return transformFamilyRows(rows)
}

export async function parseTeacherFile(file: File): Promise<ParsedData<TeacherSlot[]>> {
  const rows = await parseCsvFile(file)
  return transformTeacherRows(rows)
}

export function transformFamilyRows(
  rows: Record<string, string>[],
): ParsedData<GuardianRequest[]> {
  const messages: ValidationMessage[] = []
  const requests = new Map<string, GuardianRequest>()

  rows.forEach((originalRow, index) => {
    const rowNumber = index + 2 // header = row 1
    const row = normaliseRow(originalRow)

    for (const field of REQUIRED_FAMILY_FIELDS) {
      if (!row[field]) {
        messages.push({
          level: 'error',
          message: `${field} は必須です`,
          context: `row ${rowNumber}`,
        })
        return
      }
    }

    const guardianId = row.guardian_id
    const guardianName = row.guardian_name
    const studentName = row.student_name
    const priority = Number.parseInt(row.priority, 10)
    const preferredStart = dayjs(row.preferred_start)
    const preferredEnd = dayjs(row.preferred_end)
    const notes = row.notes || undefined

    if (Number.isNaN(priority) || priority <= 0) {
      messages.push({
        level: 'error',
        message: `priority は正の整数で入力してください`,
        context: `row ${rowNumber}`,
      })
      return
    }

    if (!preferredStart.isValid()) {
      messages.push({
        level: 'error',
        message: `preferred_start の日時形式が不正です`,
        context: `row ${rowNumber}`,
      })
      return
    }

    if (!preferredEnd.isValid()) {
      messages.push({
        level: 'error',
        message: `preferred_end の日時形式が不正です`,
        context: `row ${rowNumber}`,
      })
      return
    }

    if (!preferredEnd.isAfter(preferredStart)) {
      messages.push({
        level: 'error',
        message: `preferred_end は開始時刻より後である必要があります`,
        context: `row ${rowNumber}`,
      })
      return
    }

    const preference: GuardianPreference = {
      priority,
      preferredStart,
      preferredEnd,
      rowNumber,
    }

    if (!requests.has(guardianId)) {
      requests.set(guardianId, {
        guardianId,
        guardianName,
        studentName,
        notes,
        preferences: [preference],
      })
    } else {
      const request = requests.get(guardianId)!
      if (request.guardianName !== guardianName || request.studentName !== studentName) {
        messages.push({
          level: 'warning',
          message: `guardian_id ${guardianId} で氏名が一致していません`,
          context: `row ${rowNumber}`,
        })
      }
      if (notes && !request.notes) {
        request.notes = notes
      }
      request.preferences.push(preference)
    }
  })

  const dedupedRequests = Array.from(requests.values()).map((request) => {
    const sortedPreferences = [...request.preferences].sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority
      if (a.preferredStart.isSame(b.preferredStart)) return 0
      return a.preferredStart.isBefore(b.preferredStart) ? -1 : 1
    })

    const seenPriority = new Set<number>()
    sortedPreferences.forEach((pref) => {
      if (seenPriority.has(pref.priority)) {
        messages.push({
          level: 'warning',
          message: `${request.guardianId} の priority ${pref.priority} が重複しています`,
          context: `row ${pref.rowNumber}`,
        })
      }
      seenPriority.add(pref.priority)
    })

    return {
      ...request,
      preferences: sortedPreferences,
    }
  })

  const hasErrors = messages.some((message) => message.level === 'error')

  return {
    data: hasErrors ? [] : dedupedRequests,
    messages,
    hasErrors,
  }
}

export function transformTeacherRows(
  rows: Record<string, string>[],
): ParsedData<TeacherSlot[]> {
  const messages: ValidationMessage[] = []
  const slots: TeacherSlot[] = []
  const slotIds = new Set<string>()

  rows.forEach((originalRow, index) => {
    const rowNumber = index + 2
    const row = normaliseRow(originalRow)

    for (const field of REQUIRED_SLOT_FIELDS) {
      if (!row[field]) {
        messages.push({
          level: 'error',
          message: `${field} は必須です`,
          context: `row ${rowNumber}`,
        })
        return
      }
    }

    if (slotIds.has(row.slot_id)) {
      messages.push({
        level: 'warning',
        message: `slot_id ${row.slot_id} が重複しています`,
        context: `row ${rowNumber}`,
      })
    } else {
      slotIds.add(row.slot_id)
    }

    const start = dayjs(row.start)
    const end = dayjs(row.end)

    if (!start.isValid()) {
      messages.push({
        level: 'error',
        message: `start の日時形式が不正です`,
        context: `row ${rowNumber}`,
      })
      return
    }

    if (!end.isValid()) {
      messages.push({
        level: 'error',
        message: `end の日時形式が不正です`,
        context: `row ${rowNumber}`,
      })
      return
    }

    if (!end.isAfter(start)) {
      messages.push({
        level: 'error',
        message: `end は開始時刻より後である必要があります`,
        context: `row ${rowNumber}`,
      })
      return
    }

    slots.push({
      slotId: row.slot_id,
      start,
      end,
      rowNumber,
    })
  })

  const sortedSlots = slots.sort((a, b) => (a.start.isBefore(b.start) ? -1 : 1))

  for (let i = 1; i < sortedSlots.length; i += 1) {
    const previous = sortedSlots[i - 1]
    const current = sortedSlots[i]
    if (current.start.isBefore(previous.end)) {
      messages.push({
        level: 'warning',
        message: `slot ${current.slotId} は前の枠と重なっています`,
        context: `row ${current.rowNumber}`,
      })
    }
  }

  const hasErrors = messages.some((message) => message.level === 'error')

  return {
    data: hasErrors ? [] : sortedSlots,
    messages,
    hasErrors,
  }
}
