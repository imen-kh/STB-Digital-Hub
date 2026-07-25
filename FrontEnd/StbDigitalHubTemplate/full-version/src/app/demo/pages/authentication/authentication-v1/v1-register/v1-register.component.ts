// Angular import
import { Component, OnInit, effect, inject, signal } from '@angular/core';
import { RouterModule, Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { email, form, FormField, minLength, required } from '@angular/forms/signals';

// project import
import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';
import { BerryDefaultConfig } from 'src/app/app-config';
import { ConfigService } from 'src/app/theme/shared/service/config.service';
import { AuthenticationService } from 'src/app/theme/shared/service/authentication.service';

// rxjs import
import { first } from 'rxjs';
import { LogoComponent } from 'src/app/theme/shared/components/logo/logo.component';

interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

@Component({
  selector: 'app-v1-register',
  imports: [RouterModule, ...SHARED_IMPORTS, ReactiveFormsModule, FormField, LogoComponent, RouterLink],
  templateUrl: './v1-register.component.html',
  styleUrl: './v1-register.component.scss'
})
export class V1RegisterComponent implements OnInit {
  private configService = inject(ConfigService);
  private router = inject(Router);
  authenticationService = inject(AuthenticationService);

  themeMode!: boolean;
  showPassword = true;
  loading = signal(false);
  submitted = signal(false);
  error = signal('');
  success = signal('');

  // Signal-based form model
  registerModel = signal<RegisterData>({
    firstName: '',
    lastName: '',
    email: '',
    password: ''
  });

  // Create form field tree from model
  registerForm = form(this.registerModel, (schemaPath) => {
    required(schemaPath.firstName, { message: 'First name is required' });
    required(schemaPath.lastName, { message: 'Last name is required' });
    required(schemaPath.email, { message: 'Email is required' });
    email(schemaPath.email, { message: 'Please enter a valid email address' });
    required(schemaPath.password, { message: 'Password is required' });
    minLength(schemaPath.password, 8, { message: 'Password must be at least 8 characters' });
  });

  //  constructor
  constructor() {
    effect(() => {
      this.isDarkTheme(this.configService.isDarkMode());
    });
  }

  ngOnInit() {
    this.themeMode = BerryDefaultConfig.isDarkMode;
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  onSubmit() {
    this.submitted.set(true);

    // stop here if form is invalid
    if (!this.registerForm().valid()) {
      return;
    }

    this.error.set('');
    this.success.set('');
    this.loading.set(true);

    const formData = this.registerModel();

    this.authenticationService
      .register(formData.email, formData.password, formData.firstName, formData.lastName)
      .pipe(first())
      .subscribe({
        next: (response) => {
          // Account created as pending — no session opened
          this.success.set(
            response.message ||
              'Compte créé. Il est en attente d’activation. Connectez-vous pour recevoir un code de vérification par e-mail.'
          );
          this.loading.set(false);
          setTimeout(() => this.router.navigate(['/login']), 2500);
        },
        error: (error) => {
          this.error.set(typeof error === 'string' ? error : 'Inscription impossible. Veuillez réessayer.');
          this.loading.set(false);
        }
      });
  }

  // private method
  private isDarkTheme(isDark: boolean) {
    this.themeMode = isDark;
  }
}
