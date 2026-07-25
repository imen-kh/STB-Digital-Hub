// Angular import
import { Component, OnInit, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

// project import
import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';
import { ConfigService } from 'src/app/theme/shared/service/config.service';
import { AuthenticationService } from 'src/app/theme/shared/service/authentication.service';
import { BerryDefaultConfig } from 'src/app/app-config';

// rxjs library
import { first } from 'rxjs/operators';
import { Logo } from 'src/app/theme/shared/components/logo/logo.component';

interface Roles {
  name: string;
  email: string;
  password: string;
  role: string;
}

@Component({
  selector: 'app-v1-login',
  imports: [CommonModule, ...SHARED_IMPORTS, RouterModule, Logo],
  templateUrl: './v1-login.component.html',
  styleUrl: './v1-login.component.scss'
})
export class V1LoginComponent implements OnInit {
  private formBuilder = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  authenticationService = inject(AuthenticationService);
  private configService = inject(ConfigService);

  // public method
  showPassword: boolean = false;

  roles: Roles[] = [
    {
      name: 'Admin',
      email: 'admin@gmail.com',
      password: 'Admin@123',
      role: 'Admin'
    },
    {
      name: 'User',
      email: 'user@gmail.com',
      password: 'User@123',
      role: 'User'
    }
  ];

  // Default to the first role
  selectedRole = this.roles[0];

  onSelectRole(role: Roles) {
    this.selectedRole = role;
  }

  loginForm!: FormGroup;
  loading = false;
  submitted = false;
  error = '';
  returnUrl!: string;
  classList!: { toggle: (arg0: string) => void };
  themeMode!: boolean;

  constructor() {
    effect(() => {
      this.isDarkTheme(this.configService.isDarkMode());
    });
  }

  // life cycle hook
  ngOnInit() {
    this.themeMode = BerryDefaultConfig.isDarkMode;
    this.loginForm = this.formBuilder.group({
      email: ['', Validators.required],
      password: ['', Validators.required]
    });

    // get return url from route parameters or default to '/'
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'];
  }

  // private method
  private isDarkTheme(isDark: boolean) {
    this.themeMode = isDark;
  }

  // public method
  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
    const password = document.querySelector('#password');
    const type = password?.getAttribute('type') === 'password' ? 'text' : 'password';
    password?.setAttribute('type', type);
  }

  // convenience getter for easy access to form fields
  get formValues() {
    return this.loginForm.controls;
  }

  onSubmit() {
    this.submitted = true;

    // stop here if form is invalid
    if (this.loginForm.invalid) {
      return;
    }

    this.error = '';
    this.loading = true;
    this.authenticationService
      .login(this.formValues?.['email']?.value, this.formValues?.['password']?.value)
      .pipe(first())
      .subscribe({
        next: () => {
          this.router.navigate(['/samplePage']);
        },
        error: (error) => {
          this.error = error;
          this.loading = false;
        }
      });
  }
}
