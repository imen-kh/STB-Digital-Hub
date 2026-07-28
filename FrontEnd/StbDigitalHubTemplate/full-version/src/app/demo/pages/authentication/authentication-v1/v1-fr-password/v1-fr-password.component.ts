import { ChangeDetectorRef, Component, effect, inject, OnInit, signal } from '@angular/core';
import { RouterLink, RouterModule } from '@angular/router';
import { email, form, FormField, required } from '@angular/forms/signals';
import { first } from 'rxjs';

import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';
import { BerryDefaultConfig } from 'src/app/app-config';
import { ConfigService } from 'src/app/theme/shared/service/config.service';
import { AuthenticationService } from 'src/app/theme/shared/service/authentication.service';
import { LogoComponent } from 'src/app/theme/shared/components/logo/logo.component';

@Component({
  selector: 'app-v1-fr-password',
  imports: [...SHARED_IMPORTS, RouterModule, FormField, LogoComponent, RouterLink],
  templateUrl: './v1-fr-password.component.html',
  styleUrl: './v1-fr-password.component.scss'
})
export class V1FrPasswordComponent implements OnInit {
  private readonly configService = inject(ConfigService);
  readonly authenticationService = inject(AuthenticationService);
  private readonly cd = inject(ChangeDetectorRef);

  themeMode = false;
  submitted = signal(false);
  loading = signal(false);
  error = signal('');
  success = signal('');

  constructor() {
    effect(() => {
      this.themeMode = this.configService.isDarkMode();
    });
  }

  ngOnInit(): void {
    this.themeMode = BerryDefaultConfig.isDarkMode;
  }

  forgotModel = signal<{ email: string }>({ email: '' });

  forgotForm = form(this.forgotModel, (schemaPath) => {
    required(schemaPath.email, { message: "L'adresse e-mail est requise" });
    email(schemaPath.email, { message: 'Saisissez une adresse e-mail valide' });
  });

  onSubmit(event: Event): void {
    event.preventDefault();
    this.submitted.set(true);
    this.error.set('');
    this.success.set('');

    if (!this.forgotForm().valid()) {
      return;
    }

    this.loading.set(true);
    const emailValue = this.forgotModel().email.trim();

    this.authenticationService
      .forgotPassword(emailValue)
      .pipe(first())
      .subscribe({
        next: (response) => {
          this.success.set(response.message);
          this.loading.set(false);
          this.cd.detectChanges();
        },
        error: (error) => {
          this.error.set(typeof error === 'string' ? error : "Impossible d'envoyer le lien. Réessayez.");
          this.loading.set(false);
          this.cd.detectChanges();
        }
      });
  }
}
