// angular import
import { ChangeDetectorRef, Component, effect, inject, OnInit, signal } from '@angular/core';
import { RouterLink, RouterModule } from '@angular/router';
import { email, form, FormField, required } from '@angular/forms/signals';

// project import
import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';
import { BerryDefaultConfig } from 'src/app/app-config';
import { ConfigService } from 'src/app/theme/shared/service/config.service';
import { AuthenticationService } from 'src/app/theme/shared/service/authentication.service';
import { LogoComponent } from 'src/app/theme/shared/components/logo/logo.component';

@Component({
  selector: 'app-v3-fr-password',
  imports: [RouterModule, ...SHARED_IMPORTS, FormField, LogoComponent, RouterLink],
  templateUrl: './v3-fr-password.component.html',
  styleUrl: './v3-fr-password.component.scss'
})
export class V3FrPasswordComponent implements OnInit {
  private configService = inject(ConfigService);
  authenticationService = inject(AuthenticationService);
  private cd = inject(ChangeDetectorRef);

  // public props
  themeMode!: boolean;
  submitted = signal(false);
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

  forgotModel = signal<{ email: string }>({
    email: ''
  });

  forgotForm = form(this.forgotModel, (schemaPath) => {
    required(schemaPath.email, { message: 'Email is required' });
    email(schemaPath.email, { message: 'Enter a valid email address' });
  });

  onSubmit(event: Event) {
    this.submitted.set(true);
    this.error.set('');
    event.preventDefault();
    const credentials = this.forgotModel();
    console.log('forgot password user logged in with:', credentials);
    this.cd.detectChanges();
  }

  // private method
  private isDarkTheme(isDark: boolean) {
    this.themeMode = isDark;
  }
}
