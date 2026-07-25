// Angular import
import { Component, signal, inject, ChangeDetectorRef, OnInit, effect } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Router, ActivatedRoute } from '@angular/router';
import { form, FormField } from '@angular/forms/signals';

// project import
import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';
import { ConfigService } from 'src/app/theme/shared/service/config.service';
import { AuthenticationService } from 'src/app/theme/shared/service/authentication.service';
import { BerryDefaultConfig, DASHBOARD_PATH } from 'src/app/app-config';
import { LogoComponent } from 'src/app/theme/shared/components/logo/logo.component';

interface Roles {
  name: string;
  email: string;
  password: string;
  role: string;
}

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
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  authenticationService = inject(AuthenticationService);
  private configService = inject(ConfigService);
  private cd = inject(ChangeDetectorRef);

  showPassword = true;
  submitted = false;
  error = '';
  loading = false;
  returnUrl!: string;
  themeMode!: boolean;

  // Signal holding the form data
  private readonly loginData = signal<LoginData>({
    email: '',
    password: ''
  });

  // Create the signal form based on loginData signal
  loginForm = form(this.loginData);

  // Roles and selection logic unchanged here...
  roles: Roles[] = [
    { name: 'Admin', email: 'admin@gmail.com', password: 'Admin@123', role: 'Admin' },
    { name: 'User', email: 'user@gmail.com', password: 'User@123', role: 'User' }
  ];

  selectedRole = this.roles[0];

  onSelectRole(role: (typeof this.roles)[0]) {
    this.selectedRole = role;
    // Update loginForm signal values when role changes
    this.loginData.set({ email: role.email, password: role.password });
  }

  constructor() {
    effect(() => {
      this.isDarkTheme(this.configService.isDarkMode());
    });
    // Redirect if already logged in
    if (window.location.pathname !== '/auth/auth1/login') {
      if (this.authenticationService.currentUserValue) {
        this.router.navigate([DASHBOARD_PATH]);
      }
    }
  }

  ngOnInit() {
    this.themeMode = BerryDefaultConfig.isDarkMode;
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
    this.loginData.set({ email: '', password: '' });
  }

  // private method
  private isDarkTheme(isDark: boolean) {
    this.themeMode = isDark;
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  // Helper to check form validity (both fields required)
  get isFormValid() {
    const val = this.loginForm().value();
    return val.email.trim() !== '' && val.password.trim() !== '';
  }

  onSubmit() {
    this.submitted = true;

    if (!this.isFormValid) {
      return;
    }

    this.loading = true;
    this.error = '';

    const { email, password } = this.loginForm().value();

    this.authenticationService.login(email, password).subscribe({
      next: () => {
        // Password OK — session is created only after OTP verification
        this.router.navigate(['/verify-otp']);
      },
      error: (error) => {
        this.error = typeof error === 'string' ? error : 'Connexion impossible. Veuillez réessayer.';
        this.loading = false;
        this.cd.detectChanges();
      }
    });
  }

  socialMedia = [
    { name: 'Google', logo: 'google.svg' },
    { name: 'Twitter', logo: 'twitter.svg' },
    { name: 'Facebook', logo: 'facebook.svg' }
  ];
}
