import { Directive } from '@angular/core';
import { AbstractControl, FormControl, ValidatorFn, Validators } from '@angular/forms';
import dayjs, { Dayjs } from 'dayjs';

@Directive()
export abstract class DateComponent {
  ready: boolean = true;
  control: FormControl | undefined;

  // eslint-disable-next-line
  abstract config: any;
  date = dayjs();
  material: boolean = true;
  required: boolean = false;
  disabled: boolean = false;
  validationMinDate!: Dayjs;
  validationMaxDate!: Dayjs;
  validationMinTime!: Dayjs;
  validationMaxTime!: Dayjs;
  placeholder: string = 'Choose a date...';
  displayDate!: Dayjs | string;
  locale: string = dayjs.locale();

  displayDateChanged(displayDate: Dayjs | string): void {
    this.displayDate = displayDate;
  }

  displayDateChange(displayDate: Dayjs | string): void {
    this.displayDate = displayDate;
  }

  materialThemeChange(material: boolean): void {
    this.material = material;
  }

  disabledChange(disabled: boolean): void {
    this.disabled = disabled;
    if (disabled) {
      this.control?.disable();
    } else {
      this.control?.enable();
    }
  }

  requireValidationChange(required: boolean): void {
    this.required = required;
    this.control?.setValidators(this.getValidations());
    this.control?.updateValueAndValidity();
  }

  minValidationChange($event: Dayjs): void {
    this.validationMinDate = $event;
    this.control?.setValidators(this.getValidations());
    this.control?.updateValueAndValidity();
  }

  maxValidationChange($event: Dayjs): void {
    this.validationMaxDate = $event;
    this.control?.setValidators(this.getValidations());
    this.control?.updateValueAndValidity();
  }

  configChange($event: { format: dayjs.OptionType | undefined }): void {
    this.config = {
      ...this.config,
      ...$event
    };
  }

  protected buildForm(): FormControl {
    return new FormControl({ value: this.date, disabled: this.disabled }, this.getValidations());
  }

  private getValidations(): ValidatorFn[] {
    return [
      this.required
        ? Validators.required
        : (control: AbstractControl) => {
            return this.validationMinDate && this.config && dayjs(control.value, this.config.format).isBefore(this.validationMinDate)
              ? { minDate: 'minDate Invalid' }
              : null;
          },
      (control: AbstractControl) => {
        return this.validationMaxDate && this.config && dayjs(control.value, this.config.format).isAfter(this.validationMaxDate)
          ? { maxDate: 'maxDate Invalid' }
          : null;
      }
    ].filter(Boolean);
  }
}
