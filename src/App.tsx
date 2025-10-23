import { useMemo, useState } from 'react'
import { Stepper } from './components/Stepper'
import { UploadSection } from './components/UploadSection'
import { PreviewSection } from './components/PreviewSection'
import { ResultsSection } from './components/ResultsSection'
import { parseFamilyFile, parseTeacherFile } from './services/csv'
import { scheduleMeetings } from './services/scheduler'
import { downloadAssignmentsCsv, downloadUnassignedCsv } from './services/export'
import type { AssignmentOutcome, GuardianRequest, ParsedData, TeacherSlot, ValidationMessage } from './types'

const STEPS = ['CSVアップロード', '内容確認', '割当結果']

interface FileMeta {
  filename: string
  count: number
  hasErrors: boolean
}

const createEmptyFamilyState = (): ParsedData<GuardianRequest[]> => ({
  data: [],
  messages: [],
  hasErrors: true,
})

const createEmptySlotState = (): ParsedData<TeacherSlot[]> => ({
  data: [],
  messages: [],
  hasErrors: true,
})

function App() {
  const [activeStep, setActiveStep] = useState(0)
  const [meetingMinutes, setMeetingMinutes] = useState(15)

  const [familyParse, setFamilyParse] = useState<ParsedData<GuardianRequest[]>>(createEmptyFamilyState())
  const [slotParse, setSlotParse] = useState<ParsedData<TeacherSlot[]>>(createEmptySlotState())

  const [familyMeta, setFamilyMeta] = useState<FileMeta | undefined>()
  const [slotMeta, setSlotMeta] = useState<FileMeta | undefined>()

  const [familyLoading, setFamilyLoading] = useState(false)
  const [slotLoading, setSlotLoading] = useState(false)

  const [assignmentOutcome, setAssignmentOutcome] = useState<AssignmentOutcome | null>(null)

  const combinedMessages: ValidationMessage[] = useMemo(
    () => [...familyParse.messages, ...slotParse.messages],
    [familyParse.messages, slotParse.messages],
  )

  const canProceed =
    familyParse.data.length > 0 &&
    slotParse.data.length > 0 &&
    !familyParse.hasErrors &&
    !slotParse.hasErrors

  const handleUploadFamilies = async (file: File) => {
    setFamilyLoading(true)
    try {
      const result = await parseFamilyFile(file)
      setFamilyParse(result)
      setFamilyMeta({
        filename: file.name,
        count: result.data.length,
        hasErrors: result.hasErrors,
      })
      setAssignmentOutcome(null)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'ファイルの読み込みに失敗しました'
      const failedResult: ParsedData<GuardianRequest[]> = {
        data: [],
        messages: [
          {
            level: 'error',
            message,
          },
        ],
        hasErrors: true,
      }
      setFamilyParse(failedResult)
      setFamilyMeta({ filename: file.name, count: 0, hasErrors: true })
    } finally {
      setFamilyLoading(false)
      setActiveStep(0)
    }
  }

  const handleUploadSlots = async (file: File) => {
    setSlotLoading(true)
    try {
      const result = await parseTeacherFile(file)
      setSlotParse(result)
      setSlotMeta({
        filename: file.name,
        count: result.data.length,
        hasErrors: result.hasErrors,
      })
      setAssignmentOutcome(null)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'ファイルの読み込みに失敗しました'
      const failedResult: ParsedData<TeacherSlot[]> = {
        data: [],
        messages: [
          {
            level: 'error',
            message,
          },
        ],
        hasErrors: true,
      }
      setSlotParse(failedResult)
      setSlotMeta({ filename: file.name, count: 0, hasErrors: true })
    } finally {
      setSlotLoading(false)
      setActiveStep(0)
    }
  }

  const handleRunAssignment = () => {
    const outcome = scheduleMeetings(familyParse.data, slotParse.data)
    setAssignmentOutcome(outcome)
    setActiveStep(2)
  }

  const handleReset = () => {
    setActiveStep(0)
    setFamilyParse(createEmptyFamilyState())
    setSlotParse(createEmptySlotState())
    setFamilyMeta(undefined)
    setSlotMeta(undefined)
    setAssignmentOutcome(null)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6">
          <h1 className="text-2xl font-bold text-slate-900">面談スケジュール自動割当</h1>
          <p className="text-sm text-slate-500">
            保護者の希望CSVと教師の空き枠CSVをアップロードすると、希望優先で面談順を自動で組みます。
          </p>
          <Stepper steps={STEPS} currentStep={activeStep} />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10">
        {activeStep === 0 && (
          <UploadSection
            onUploadFamilies={handleUploadFamilies}
            onUploadSlots={handleUploadSlots}
            familyMeta={familyMeta}
            slotMeta={slotMeta}
            familyLoading={familyLoading}
            slotLoading={slotLoading}
            onNext={() => setActiveStep(1)}
            canProceed={canProceed}
          />
        )}

        {activeStep === 1 && (
          <PreviewSection
            requests={familyParse.data}
            slots={slotParse.data}
            messages={combinedMessages}
            meetingMinutes={meetingMinutes}
            onChangeMeetingMinutes={setMeetingMinutes}
            onBack={() => setActiveStep(0)}
            onRunAssignment={handleRunAssignment}
            disableRun={!canProceed}
          />
        )}

        {activeStep === 2 && (
          <ResultsSection
            outcome={assignmentOutcome}
            onReset={handleReset}
            onDownloadAssignments={() => {
              if (assignmentOutcome) {
                downloadAssignmentsCsv(assignmentOutcome.assignments)
              }
            }}
            onDownloadUnassigned={() => {
              if (assignmentOutcome) {
                downloadUnassignedCsv(assignmentOutcome.unassigned)
              }
            }}
          />
        )}
      </main>
    </div>
  )
}

export default App
