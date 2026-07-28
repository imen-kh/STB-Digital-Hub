import { Component, OnInit, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { form, FormField, minLength, required } from '@angular/forms/signals';
import { first } from 'rxjs';

import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';
import { BerryDefaultConfig } from 'src/app/app-config';
import { ConfigService } from 'src/app/theme/shared/service/config.service';
import { AuthenticationService } from 'src/app/theme/shared/service/authentication.service';
import { LogoComponent } from 'src/app/theme/shared/components/logo/logo.component';

interface ResetData {
  password: string;
  confirmPassword: string;
}

@Component({
  selector: 'app-v1-reset-password',
  imports: [RouterModule, ...SHARED_IMPORTS, FormField, LogoComponent],
  templateUrl: './v1-reset-password.component.html',
  styleUrl: './v1-reset-password.component.scss'
})
export class V1ResetPasswordComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly configService = inject(ConfigService);
  private readonly authenticationService = inject(AuthenticationService);

  themeMode = false;
  showPassword = true;
  showConfirmPassword = true;
  token = '';
  submitted = signal(false);
  loading = signal(false);
  error = signal('');
  success = signal('');

  resetModel = signal<ResetData>({ password: '', confirmPassword: '' });

  resetForm = form(this.resetModel, (schemaPath) => {
    required(schemaPath.password, { message: 'Le mot de passe est requis' });
    minLength(schemaPath.password, 8, { message: 'Au moins 8 caractères' });
    required(schemaPath.confirmPassword, { message: 'Confirmez le mot de passe' });
  });

  constructor() {
    effect(() => {
      this.themeMode = this.configService.isDarkMode();
    });
  }

  ngOnInit(): void {
    this.themeMode = BerryDefaultConfig.isDarkMode;
    this.token = this.route.snapshot.queryParamMap.get('token') ?? '';
    if (!this.token) {
      this.error.set('Lien de réinitialisation invalide.');
    }
  }

  get isPasswordValid(): boolean {
    const password = this.resetModel().password;
    return password.length >= 8 && /[A-Za-z]/.test(password) && /\d/.test(password);
  }

  get isConfirmValid(): boolean {
    const data = this.resetModel();
    return data.confirmPassword.length > 0 && data.password === data.confirmPassword;
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  onSubmit(): void {
    this.submitted.set(true);
    this.error.set('');
    this.success.set('');

    if (!this.token) {
      this.error.set('Lien de réinitialisation invalide.');
      return;
    }

    if (!this.resetForm().valid() || !this.isPasswordValid || !this.isConfirmValid) {
      return;
    }

    this.loading.set(true);
    const { password, confirmPassword } = this.resetModel();

    this.authenticationService
      .resetPassword(this.token, password, confirmPassword)
      .pipe(first())
      .subscribe({
        next: (response) => {
          this.success.set(response.message);
          this.loading.set(false);
          setTimeout(() => this.router.navigate(['/login']), 2000);
        },
        error: (error) => {
          this.error.set(typeof error === 'string' ? error : 'Réinitialisation impossible.');
          this.loading.set(false);
        }
      });
  }
}
