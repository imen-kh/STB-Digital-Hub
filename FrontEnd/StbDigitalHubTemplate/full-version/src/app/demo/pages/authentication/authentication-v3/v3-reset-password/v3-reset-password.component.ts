// angular import
import { RouterLink } from '@angular/router';
import { Component, signal, ChangeDetectionStrategy, inject, OnInit, effect } from '@angular/core';
import { form, required, minLength } from '@angular/forms/signals';

// project import
import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';
import { ConfigService } from 'src/app/theme/shared/service/config.service';
import { BerryDefaultConfig } from 'src/app/app-config';
import { LogoComponent } from 'src/app/theme/shared/components/logo/logo.component';

@Component({
  selector: 'app-v3-reset-password',
  imports: [RouterLink, ...SHARED_IMPORTS, LogoComponent],
  templateUrl: './v3-reset-password.component.html',
  styleUrl: './v3-reset-password.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class V3ResetPasswordComponent implements OnInit {
  private configService = inject(ConfigService);

  // model holds both password fields
  themeMode!: boolean;
  resetModel = signal({ password: '', confirmPassword: '' });
  submitted = signal(false);
  loading = signal(false);
  error = signal('');

  //  constructor
  constructor() {
    effect(() => {
      this.isDarkTheme(this.configService.isDarkMode());
    });
  }

  // life cycle event
  ngOnInit() {
    this.themeMode = BerryDefaultConfig.isDarkMode;
  }

  // create Signal Form with basic validators
  resetForm = form(this.resetModel, (schema) => {
    required(schema.password, { message: 'Password is required' });
    minLength(schema.password, 8, { message: 'Password must be at least 8 characters' });
    required(schema.confirmPassword, { message: 'Please confirm your password' });
  });

  // helpers used by the template
  passwordErrors() {
    return this.resetForm.password().errors();
  }

  confirmErrors() {
    return this.resetForm.confirmPassword().errors();
  }

  setPassword(value: string) {
    this.resetModel.update((m) => ({ ...m, password: value }));
  }

  setConfirmPassword(value: string) {
    this.resetModel.update((m) => ({ ...m, confirmPassword: value }));
  }

  onSubmit() {
    this.submitted.set(true);

    // stop if any field has validation errors
    const passErrs = this.passwordErrors();
    const confErrs = this.confirmErrors();
    if (passErrs.length > 0 || confErrs.length > 0) {
      return;
    }

    const m = this.resetModel();
    // check password match
    if (m.password !== m.confirmPassword) {
      this.error.set('Passwords do not match');
      return;
    }

    this.error.set('');
    this.loading.set(true);

    // TODO: call API to actually reset password. Simulate a short delay here.
    setTimeout(() => {
      this.loading.set(false);
      // success handling can be added here (navigate, show toast, etc.)
    }, 800);
  }

  // private method
  private isDarkTheme(isDark: boolean) {
    this.themeMode = isDark;
  }
}
