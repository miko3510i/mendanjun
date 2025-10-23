import { describe, expect, it } from 'vitest'
import { scheduleMeetings } from './scheduler'
import { dayjs } from '../utils/dayjs'
import type { GuardianRequest, TeacherSlot } from '../types'

describe('scheduleMeetings', () => {
  const buildRequest = (overrides: Partial<GuardianRequest>): GuardianRequest => ({
    guardianId: 'g1',
    guardianName: '保護者A',
    studentName: '生徒A',
    notes: undefined,
    preferences: [
      {
        priority: 1,
        preferredStart: dayjs('2025-03-01 10:00'),
        preferredEnd: dayjs('2025-03-01 10:15'),
        rowNumber: 2,
      },
    ],
    ...overrides,
  })

  const buildSlot = (slotId: string, start: string, end: string): TeacherSlot => ({
    slotId,
    start: dayjs(start),
    end: dayjs(end),
    rowNumber: 2,
  })

  it('優先希望どおりに割り当てる', () => {
    const requests = [buildRequest({})]
    const slots = [buildSlot('s1', '2025-03-01 10:00', '2025-03-01 10:15')]

    const outcome = scheduleMeetings(requests, slots)

    expect(outcome.assignments).toHaveLength(1)
    expect(outcome.assignments[0]).toMatchObject({
      guardianId: 'g1',
      slotId: 's1',
      status: 'assigned',
      matchedPriority: 1,
    })
    expect(outcome.summary).toMatchObject({ assigned: 1, autoAdjusted: 0, unassigned: 0 })
  })

  it('希望が埋まっていたら近い枠に自動調整する', () => {
    const requests = [
      buildRequest({
        preferences: [
          {
            priority: 1,
            preferredStart: dayjs('2025-03-01 10:00'),
            preferredEnd: dayjs('2025-03-01 10:15'),
            rowNumber: 2,
          },
        ],
      }),
    ]

    const slots = [
      buildSlot('s1', '2025-03-01 09:30', '2025-03-01 09:45'),
      buildSlot('s2', '2025-03-01 10:30', '2025-03-01 10:45'),
    ]

    const outcome = scheduleMeetings(requests, slots)

    expect(outcome.assignments[0]).toMatchObject({
      slotId: 's1',
      status: 'auto_adjusted',
      matchedPriority: 1,
    })
    expect(outcome.summary).toMatchObject({ assigned: 0, autoAdjusted: 1, unassigned: 0 })
  })

  it('枠が足りなければ未割当とする', () => {
    const requests = [
      buildRequest({ guardianId: 'g1' }),
      buildRequest({ guardianId: 'g2', guardianName: '保護者B', studentName: '生徒B' }),
    ]
    const slots = [buildSlot('s1', '2025-03-01 10:00', '2025-03-01 10:15')]

    const outcome = scheduleMeetings(requests, slots)

    expect(outcome.assignments).toHaveLength(1)
    expect(outcome.unassigned).toHaveLength(1)
    expect(outcome.summary).toMatchObject({ total: 2, unassigned: 1 })
  })
})
