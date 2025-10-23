import type { Dayjs } from 'dayjs'
import type {
  AssignmentOutcome,
  AssignmentRecord,
  GuardianRequest,
  TeacherSlot,
} from '../types'

const differenceInMinutes = (a: Dayjs, b: Dayjs): number =>
  Math.abs(a.diff(b, 'minute'))

const cloneSlots = (slots: TeacherSlot[]): TeacherSlot[] =>
  [...slots].sort((a, b) => (a.start.isBefore(b.start) ? -1 : 1))

export function scheduleMeetings(
  requests: GuardianRequest[],
  slots: TeacherSlot[],
): AssignmentOutcome {
  const availableSlots = cloneSlots(slots)
  const assignments: AssignmentRecord[] = []
  const unassigned: AssignmentRecord[] = []

  requests.forEach((request) => {
    let assignedRecord: AssignmentRecord | null = null

    for (const preference of request.preferences) {
      const index = availableSlots.findIndex(
        (slot) =>
          slot.start.isSame(preference.preferredStart) &&
          slot.end.isSame(preference.preferredEnd),
      )

      if (index !== -1) {
        const [slot] = availableSlots.splice(index, 1)
        assignedRecord = {
          studentNumber: request.studentNumber,
          slotId: slot.slotId,
          assignedStart: slot.start,
          assignedEnd: slot.end,
          status: 'assigned',
          matchedPriority: preference.priority,
        }
        break
      }
    }

    if (!assignedRecord) {
      const topPreference = request.preferences[0]

      if (topPreference && availableSlots.length > 0) {
        const targetStart = topPreference.preferredStart
        let closestIndex = 0
        let smallestDelta = Number.POSITIVE_INFINITY

        availableSlots.forEach((slot, index) => {
          const delta = differenceInMinutes(slot.start, targetStart)
          if (delta < smallestDelta) {
            smallestDelta = delta
            closestIndex = index
          }
        })

        const [slot] = availableSlots.splice(closestIndex, 1)
        assignedRecord = {
          studentNumber: request.studentNumber,
          slotId: slot.slotId,
          assignedStart: slot.start,
          assignedEnd: slot.end,
          status: 'auto_adjusted',
          matchedPriority: topPreference.priority,
        }
      }
    }

    if (!assignedRecord) {
      unassigned.push({ studentNumber: request.studentNumber, status: 'unassigned' })
    } else {
      assignments.push(assignedRecord)
    }
  })

  const summary = {
    total: requests.length,
    assigned: assignments.filter((record) => record.status === 'assigned').length,
    autoAdjusted: assignments.filter((record) => record.status === 'auto_adjusted').length,
    unassigned: unassigned.length,
  }

  return {
    assignments,
    unassigned,
    summary,
  }
}

export const formatDateTime = (value: Dayjs | undefined): string =>
  value ? value.format('YYYY-MM-DD HH:mm') : ''
