import dayjsLib from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

dayjsLib.extend(utc)
dayjsLib.extend(timezone)

dayjsLib.tz.setDefault('Asia/Tokyo')

export const dayjs = dayjsLib
