import { SingleCalendarValue } from '../common/type/single-calendar-value';

export interface IDpDayPickerApi {
  open: () => void;
  close: () => void;
  moveCalendarTo: (date: SingleCalendarValue) => void;
}
