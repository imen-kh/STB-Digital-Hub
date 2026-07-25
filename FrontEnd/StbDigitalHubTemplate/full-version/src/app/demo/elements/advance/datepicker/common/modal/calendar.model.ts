import { Dayjs } from 'dayjs';
import { SingleCalendarValue } from '../type/single-calendar-value';

export interface ICalendar {
  min?: SingleCalendarValue;
  max?: Dayjs | string;
}

export interface ICalendarInternal {
  min?: Dayjs;
  max?: Dayjs;
}
