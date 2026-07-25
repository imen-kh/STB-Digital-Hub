import { Directive, input } from '@angular/core';
import { AbstractControl, NG_VALIDATORS, ValidationErrors, Validator } from '@angular/forms';

/**
 * Custom validator directive for template-driven forms.
 * Checks that the value matches the value of another control (e.g., confirm password).
 * Usage: <input [equalTo]="passwordControl" />
 */
@Directive({
  selector: '[appEqualTo]',
  providers: [{ provide: NG_VALIDATORS, useExisting: EqualToValidatorDirective, multi: true }]
})
export class EqualToValidatorDirective implements Validator {
  appEqualTo = input.required<AbstractControl>();

  validate(control: AbstractControl): ValidationErrors | null {
    const equalToControl = this.appEqualTo();
    if (!equalToControl || !control.value) {
      return null;
    }
    return control.value === equalToControl.value ? null : { equalTo: true };
  }
}

/**
 * Custom URL validator directive for template-driven forms.
 * Usage: <input url />
 */
@Directive({
  selector: '[appUrl]',
  providers: [{ provide: NG_VALIDATORS, useExisting: UrlValidatorDirective, multi: true }]
})
export class UrlValidatorDirective implements Validator {
  private urlPattern = /^https?:\/\/.+/;

  validate(control: AbstractControl): ValidationErrors | null {
    if (!control.value) {
      return null;
    }
    return this.urlPattern.test(control.value) ? null : { url: true };
  }
}

/**
 * Custom phone validator directive for template-driven forms.
 * Usage: <input phone="IN" />
 */
@Directive({
  selector: '[appPhone]',
  providers: [{ provide: NG_VALIDATORS, useExisting: PhoneValidatorDirective, multi: true }]
})
export class PhoneValidatorDirective implements Validator {
  appPhone = input<string>('');

  validate(control: AbstractControl): ValidationErrors | null {
    if (!control.value) {
      return null;
    }
    const phonePattern = /^[\d\s\-()+]+$/;
    return phonePattern.test(control.value) ? null : { phone: true };
  }
}
