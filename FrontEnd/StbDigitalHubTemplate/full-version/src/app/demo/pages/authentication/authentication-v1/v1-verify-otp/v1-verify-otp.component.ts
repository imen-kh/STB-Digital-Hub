import { Component, OnInit, effect, inject, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { form, FormField, required, minLength, maxLength } from '@angular/forms/signals';

import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';
import { ConfigService } from 'src/app/theme/shared/service/config.service';
import { AuthenticationService } from 'src/app/theme/shared/service/authentication.service';
import { BerryDefaultConfig, DASHBOARD_PATH } from 'src/app/app-config';
import { LogoComponent } from 'src/app/theme/shared/components/logo/logo.component';

interface OtpData {
  code: string;
}

@Component({
  selector: 'app-v1-verify-otp',
  imports: [RouterModule, ...SHARED_IMPORTS, FormField, LogoComponent],
  templateUrl: './v1-verify-otp.component.html',
  styleUrl: './v1-verify-otp.component.scss'
})
export class V1VerifyOtpComponent implements OnInit {
  private router = inject(Router);
  authenticationService = inject(AuthenticationService);
  private configService = inject(ConfigService);

  themeMode = false;
  loading = signal(false);
  resending = signal(false);
  submitted = signal(false);
  error = signal('');
  success = signal('');
  challengeId = signal<string | null>(null);
  message = signal('Saisissez le code reçu par e-mail pour finaliser votre connexion.');
  devOtpCode = signal<string | null>(null);

  private readonly otpData = signal<OtpData>({ code: '' });
  otpForm = form(this.otpData, (schemaPath) => {
    required(schemaPath.code, { message: 'Le code est requis' });
    minLength(schemaPath.code, 6, { message: 'Le code doit contenir 6 chiffres' });
    maxLength(schemaPath.code, 6, { message: 'Le code doit contenir 6 chiffres' });
  });

  constructor() {
    effect(() => {
      this.themeMode = this.configService.isDarkMode();
    });
  }

  ngOnInit() {
    this.themeMode = BerryDefaultConfig.isDarkMode;

    if (this.authenticationService.currentUserValue) {
      this.router.navigate([DASHBOARD_PATH]);
      return;
    }

    const challenge = this.authenticationService.pendingChallenge;
    if (!challenge?.challengeId) {
      this.router.navigate(['/login']);
      return;
    }

    this.challengeId.set(challenge.challengeId);
    if (challenge.message) {
      this.message.set(challenge.message);
    }
    if (challenge.devOtpCode) {
      this.devOtpCode.set(challenge.devOtpCode);
    }
  }

  get isFormValid() {
    const code = this.otpForm().value().code.trim();
    return /^\d{6}$/.test(code);
  }

  onSubmit() {
    this.submitted.set(true);
    this.error.set('');
    this.success.set('');

    if (!this.isFormValid || !this.challengeId()) {
      return;
    }

    this.loading.set(true);
    const code = this.otpForm().value().code.trim();

    this.authenticationService.verifyOtp(this.challengeId()!, code).subscribe({
      next: () => {
        this.router.navigate([DASHBOARD_PATH]);
      },
      error: (error) => {
        this.error.set(typeof error === 'string' ? error : 'Code invalide. Veuillez réessayer.');
        this.loading.set(false);
      }
    });
  }

  onResend() {
    if (!this.challengeId() || this.resending()) {
      return;
    }

    this.resending.set(true);
    this.error.set('');
    this.success.set('');

    this.authenticationService.resendOtp(this.challengeId()!).subscribe({
      next: (challenge) => {
        this.challengeId.set(challenge.challengeId);
        this.devOtpCode.set(challenge.devOtpCode ?? null);
        this.success.set(
          challenge.devOtpCode
            ? `E-mail non envoyé. Code DEV : ${challenge.devOtpCode}`
            : 'Un nouveau code a été envoyé à votre adresse e-mail.'
        );
        this.resending.set(false);
      },
      error: (error) => {
        this.error.set(typeof error === 'string' ? error : 'Impossible de renvoyer le code.');
        this.resending.set(false);
      }
    });
  }
}
