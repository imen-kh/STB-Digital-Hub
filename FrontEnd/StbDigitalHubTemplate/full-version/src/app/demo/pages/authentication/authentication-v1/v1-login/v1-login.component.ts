import { Component, signal, inject, ChangeDetectorRef, OnInit, effect } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Router, ActivatedRoute } from '@angular/router';
import { email, form, FormField, required } from '@angular/forms/signals';

import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';
import { ConfigService } from 'src/app/theme/shared/service/config.service';
import { AuthenticationService } from 'src/app/theme/shared/service/authentication.service';
import { BerryDefaultConfig, DASHBOARD_PATH } from 'src/app/app-config';
import { LogoComponent } from 'src/app/theme/shared/components/logo/logo.component';

interface LoginData {
  email: string;
  password: string;
}

@Component({
  selector: 'app-v1-login',
  imports: [RouterModule, ...SHARED_IMPORTS, FormField, LogoComponent],
  templateUrl: './v1-login.component.html',
  styleUrl: './v1-login.component.scss'
})
export class V1LoginComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly authenticationService = inject(AuthenticationService);
  private readonly configService = inject(ConfigService);
  private readonly cd = inject(ChangeDetectorRef);

  showPassword = true;
  submitted = false;
  error = '';
  loading = false;
  returnUrl = DASHBOARD_PATH;
  themeMode = false;

  private readonly loginData = signal<LoginData>({
    email: '',
    password: ''
  });

  loginForm = form(this.loginData, (schemaPath) => {
    required(schemaPath.email, { message: "L'adresse e-mail est requise" });
    email(schemaPath.email, { message: 'Saisissez une adresse e-mail valide' });
    required(schemaPath.password, { message: 'Le mot de passe est requis' });
  });

  constructor() {
    effect(() => {
      this.themeMode = this.configService.isDarkMode();
    });

    if (window.location.pathname !== '/auth/auth1/login') {
      if (this.authenticationService.currentUserValue) {
        this.router.navigate([DASHBOARD_PATH]);
      }
    }
  }

  ngOnInit(): void {
    this.themeMode = BerryDefaultConfig.isDarkMode;
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || DASHBOARD_PATH;
    this.loginData.set({ email: '', password: '' });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  get isEmailValid(): boolean {
    const value = this.loginForm().value().email.trim();
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  get isPasswordValid(): boolean {
    return this.loginForm().value().password.trim().length > 0;
  }

  get isFormValid(): boolean {
    return this.isEmailValid && this.isPasswordValid;
  }

  onSubmit(): void {
    this.submitted = true;
    if (!this.isFormValid) {
      return;
    }

    this.loading = true;
    this.error = '';
    const { email, password } = this.loginForm().value();

    this.authenticationService.login(email.trim(), password).subscribe({
      next: () => this.router.navigate(['/verify-otp']),
      error: (error) => {
        this.error = typeof error === 'string' ? error : 'Connexion impossible. Veuillez réessayer.';
        this.loading = false;
        this.cd.detectChanges();
      }
    });
  }
}
