import type { Dayjs } from 'dayjs'

export type Severity = 'error' | 'warning'

export interface ValidationMessage {
  level: Severity
  message: string
  context?: string
}

export interface ParsedData<T> {
  data: T
  messages: ValidationMessage[]
  hasErrors: boolean
}

export interface GuardianPreference {
  priority: number
  preferredStart: Dayjs
  preferredEnd: Dayjs
  rowNumber: number
}

export interface GuardianRequest {
  studentNumber: string
  preferences: GuardianPreference[]
}

export interface TeacherSlot {
  slotId: string
  start: Dayjs
  end: Dayjs
  rowNumber: number
}

export type AssignmentStatus = 'assigned' | 'auto_adjusted' | 'unassigned'

export interface AssignmentRecord {
  studentNumber: string
  slotId?: string
  assignedStart?: Dayjs
  assignedEnd?: Dayjs
  status: AssignmentStatus
  matchedPriority?: number
}

export interface AssignmentOutcome {
  assignments: AssignmentRecord[]
  unassigned: AssignmentRecord[]
  summary: {
    total: number
    assigned: number
    autoAdjusted: number
    unassigned: number
  }
}
