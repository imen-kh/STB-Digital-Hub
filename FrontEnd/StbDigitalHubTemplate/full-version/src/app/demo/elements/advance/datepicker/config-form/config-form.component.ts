// Angular Import
import { Component, input, output, effect, computed, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// project Import
import { ECalendarValue } from '../common/type/calendar-value-enum';
import { IDatePickerConfig } from '../date-picker/date-picker-config.model';
import { CardComponent } from 'src/app/theme/shared/components/card/card.component';

// third party
import { DpDatePickerModule } from 'ng2-date-picker';
import dayjs, { Dayjs } from 'dayjs';

const GLOBAL_OPTION_KEYS = ['theme'];
const PICKER_OPTION_KEYS = ['appendTo', 'disabled', 'required'];
const DAY_PICKER_DIRECTIVE_OPTION_KEYS = ['closeOnSelectDelay', 'moveCalendarTo', ...PICKER_OPTION_KEYS];
const DAY_PICKER_OPTION_KEYS = [...DAY_PICKER_DIRECTIVE_OPTION_KEYS];
const DAY_TIME_PICKER_OPTION_KEYS = ['moveCalendarTo', ...PICKER_OPTION_KEYS];
const TIME_PICKER_OPTION_KEYS = [...PICKER_OPTION_KEYS];
const MONTH_CALENDAR_OPTION_KEYS = ['minValidation', 'maxValidation', 'required', 'max', 'min', 'moveCalendarTo', ...GLOBAL_OPTION_KEYS];
const DAY_CALENDAR_OPTION_KEYS = new Set([
  'firstDayOfWeek',
  'max',
  'maxValidation',
  'min',
  'minValidation',
  'monthFormat',
  'showNearMonthDays',
  'weekdayFormat',
  'moveCalendarTo',
  ...MONTH_CALENDAR_OPTION_KEYS
]);
const TIME_SELECT_SHARED_OPTION_KEYS = [...GLOBAL_OPTION_KEYS];
const TIME_SELECT_OPTION_KEYS = [...TIME_SELECT_SHARED_OPTION_KEYS];
const DAY_TIME_CALENDAR_OPTION_KEYS = [...DAY_TIME_PICKER_OPTION_KEYS, ...DAY_CALENDAR_OPTION_KEYS, ...TIME_SELECT_SHARED_OPTION_KEYS];

@Component({
  selector: 'app-config-form',
  templateUrl: './config-form.component.html',
  styleUrl: './config-form.component.scss',
  imports: [CardComponent, DpDatePickerModule, FormsModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConfigFormComponent {
  // Inputs as signal
  pickerMode = input.required<string>();
  config = input.required<IDatePickerConfig>();
  localeVal = input('en');

  // Outputs
  displayDateChange = output<Dayjs | string>();
  materialThemeChange = output<boolean>();
  disabledChange = output<boolean>();
  requireValidationChange = output<boolean>();
  minValidationChange = output<Dayjs>();
  maxValidationChange = output<Dayjs>();
  configChange = output<Partial<IDatePickerConfig>>();
  openCalendar = output<void>();
  closeCalendar = output<void>();
  moveCalendarTo = output<Dayjs>();

  // Signals replacing FormControls
  material = signal(true);
  disabled = signal(false);
  requireValidation = signal(false);

  minValidation = signal<Dayjs | null>(null);
  maxValidation = signal<Dayjs | null>(null);

  firstDayOfWeek = signal<IDatePickerConfig['firstDayOfWeek'] | null>(null);
  monthFormat = signal<string | null>(null);
  min = signal<string>('');
  max = signal<string>('');
  closeOnSelectDelay = signal<number | null>(null);
  showNearMonthDays = signal<boolean | null>(null);

  DAYS = ['su', 'mo', 'tu', 'we', 'th', 'fr', 'sa'];

  dateTypes = [
    { name: ECalendarValue[ECalendarValue.Dayjs], value: ECalendarValue.Dayjs },
    { name: ECalendarValue[ECalendarValue.DayjsArr], value: ECalendarValue.DayjsArr },
    { name: ECalendarValue[ECalendarValue.String], value: ECalendarValue.String },
    { name: ECalendarValue[ECalendarValue.StringArr], value: ECalendarValue.StringArr }
  ];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private normalizeDate(value: any): string {
    if (!value) return '';

    // If Dayjs instance
    if (dayjs.isDayjs(value)) {
      return value.format(this.localFormat());
    }

    // If JS Date
    if (value instanceof Date) {
      return dayjs(value).format(this.localFormat());
    }

    // If already string
    return value;
  }

  // Computed default-format
  localFormat = computed(() => ConfigFormComponent.getDefaultFormatByMode(this.pickerMode()));

  constructor() {
    // Initialize signals with input config values
    effect(() => {
      const cfg = this.config();

      this.firstDayOfWeek.set(cfg.firstDayOfWeek ?? null);
      this.monthFormat.set(cfg.monthFormat ?? null);
      this.min.set(this.normalizeDate(cfg.min));
      this.max.set(this.normalizeDate(cfg.max));
      this.closeOnSelectDelay.set(cfg.closeOnSelectDelay ?? null);
      this.showNearMonthDays.set(cfg.showNearMonthDays ?? null);
    });

    // Reactive effects replacing subscriptions
    effect(() => this.materialThemeChange.emit(this.material()));
    effect(() => this.disabledChange.emit(this.disabled()));
    effect(() => this.requireValidationChange.emit(this.requireValidation()));
    effect(() => this.minValidationChange.emit(this.minValidation()!));
    effect(() => this.maxValidationChange.emit(this.maxValidation()!));

    // Emits config updates
    this.createConfigEffect(this.firstDayOfWeek, 'firstDayOfWeek');
    this.createConfigEffect(this.monthFormat, 'monthFormat');
    this.createConfigEffect(this.min, 'min');
    this.createConfigEffect(this.max, 'max');
    this.createConfigEffect(this.closeOnSelectDelay, 'closeOnSelectDelay');
    this.createConfigEffect(this.showNearMonthDays, 'showNearMonthDays');
  }

  // helper to reduce duplicated code
  // eslint-disable-next-line
  private createConfigEffect(sig: any, key: keyof IDatePickerConfig) {
    effect(() => {
      const value = sig();
      if (value !== undefined) {
        this.configChange.emit({ [key]: value });
      }
    });
  }

  validConfig = computed(() => (key: string) => {
    switch (this.pickerMode()) {
      case 'dayInline':
        return [...DAY_CALENDAR_OPTION_KEYS].includes(key);
      case 'monthInline':
        return [...MONTH_CALENDAR_OPTION_KEYS].includes(key);
      case 'timeInline':
        return [...TIME_SELECT_OPTION_KEYS].includes(key);
      case 'daytimeInline':
        return [...DAY_TIME_CALENDAR_OPTION_KEYS].includes(key);
      case 'dayPicker':
        return [...DAY_PICKER_OPTION_KEYS, ...DAY_CALENDAR_OPTION_KEYS].includes(key);
      case 'dayDirective':
      case 'dayDirectiveReactiveMenu':
        return [...DAY_PICKER_DIRECTIVE_OPTION_KEYS, ...DAY_CALENDAR_OPTION_KEYS].includes(key);
      case 'monthPicker':
        return [...DAY_PICKER_OPTION_KEYS, ...MONTH_CALENDAR_OPTION_KEYS].includes(key);
      case 'monthDirective':
        return [...DAY_PICKER_DIRECTIVE_OPTION_KEYS, ...MONTH_CALENDAR_OPTION_KEYS].includes(key);
      case 'timePicker':
      case 'timeDirective':
        return [...TIME_PICKER_OPTION_KEYS, ...TIME_SELECT_OPTION_KEYS].includes(key);
      case 'daytime':
      case 'daytimePicker':
      case 'daytimeDirective':
        return [...DAY_TIME_CALENDAR_OPTION_KEYS].includes(key);
      default:
        return true;
    }
  });

  moveCalendar() {
    this.moveCalendarTo.emit(dayjs('14-01-1987', 'DD-MM-YYYY'));
  }

  private static getDefaultFormatByMode(mode: string): string {
    switch (mode) {
      case 'daytimePicker':
      case 'daytimeInline':
        return 'DD-MM-YYYY HH:mm:ss';
      case 'dayPicker':
      case 'dayInline':
      case 'dayDirective':
        return 'DD-MM-YYYY';
      case 'monthPicker':
      case 'monthInline':
      case 'monthDirective':
        return 'MMM, YYYY';
      case 'timePicker':
      case 'timeInline':
      case 'timeDirective':
        return 'HH:mm:ss';
      default:
        return 'DD-MM-YYYY HH:mm:ss';
    }
  }
}
