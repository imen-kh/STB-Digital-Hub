import { Component, OnInit, effect, inject, signal } from '@angular/core';
import { RouterModule, Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { email, form, FormField, minLength, required } from '@angular/forms/signals';
import { first } from 'rxjs';

import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';
import { BerryDefaultConfig } from 'src/app/app-config';
import { ConfigService } from 'src/app/theme/shared/service/config.service';
import { AuthenticationService, RegisterData } from 'src/app/theme/shared/service/authentication.service';
import { LogoComponent } from 'src/app/theme/shared/components/logo/logo.component';

@Component({
  selector: 'app-v1-register',
  imports: [RouterModule, ...SHARED_IMPORTS, ReactiveFormsModule, FormField, LogoComponent, RouterLink],
  templateUrl: './v1-register.component.html',
  styleUrl: './v1-register.component.scss'
})
export class V1RegisterComponent implements OnInit {
  private readonly configService = inject(ConfigService);
  private readonly router = inject(Router);
  readonly authenticationService = inject(AuthenticationService);

  themeMode = false;
  showPassword = true;
  showConfirmPassword = true;
  loading = signal(false);
  submitted = signal(false);
  error = signal('');
  success = signal('');

  registerModel = signal<RegisterData>({
    firstName: '',
    lastName: '',
    email: '',
    telephone: '',
    password: '',
    confirmPassword: '',
    acceptedTerms: false
  });

  registerForm = form(this.registerModel, (schemaPath) => {
    required(schemaPath.firstName, { message: 'Le prénom est requis' });
    required(schemaPath.lastName, { message: 'Le nom est requis' });
    required(schemaPath.email, { message: "L'adresse e-mail est requise" });
    email(schemaPath.email, { message: 'Saisissez une adresse e-mail valide' });
    required(schemaPath.telephone, { message: 'Le téléphone est requis' });
    required(schemaPath.password, { message: 'Le mot de passe est requis' });
    minLength(schemaPath.password, 8, { message: 'Le mot de passe doit contenir au moins 8 caractères' });
    required(schemaPath.confirmPassword, { message: 'Confirmez le mot de passe' });
  });

  constructor() {
    effect(() => {
      this.themeMode = this.configService.isDarkMode();
    });
  }

  ngOnInit(): void {
    this.themeMode = BerryDefaultConfig.isDarkMode;
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  onTermsChange(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.registerModel.update((current) => ({ ...current, acceptedTerms: checked }));
  }

  get isTelephoneValid(): boolean {
    return /^\+?[0-9\s\-()]{8,20}$/.test(this.registerModel().telephone.trim());
  }

  get isPasswordValid(): boolean {
    const password = this.registerModel().password;
    return password.length >= 8 && /[A-Za-z]/.test(password) && /\d/.test(password);
  }

  get isConfirmPasswordValid(): boolean {
    const data = this.registerModel();
    return data.confirmPassword.length > 0 && data.password === data.confirmPassword;
  }

  onSubmit(): void {
    this.submitted.set(true);
    this.error.set('');
    this.success.set('');

    if (!this.registerForm().valid() || !this.isTelephoneValid || !this.isPasswordValid || !this.isConfirmPasswordValid) {
      return;
    }

    if (!this.registerModel().acceptedTerms) {
      this.error.set("Vous devez accepter les conditions d'utilisation.");
      return;
    }

    this.loading.set(true);
    this.authenticationService
      .register(this.registerModel())
      .pipe(first())
      .subscribe({
        next: (response) => {
          this.success.set(
            response.message ||
              "Compte créé. Connectez-vous pour recevoir un code de vérification par e-mail."
          );
          this.loading.set(false);
          setTimeout(() => this.router.navigate(['/login']), 2500);
        },
        error: (error) => {
          this.error.set(typeof error === 'string' ? error : "Inscription impossible. Veuillez réessayer.");
          this.loading.set(false);
        }
      });
  }
}
