import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, map, Observable, tap } from 'rxjs';

import { environment } from 'src/environments/environment';
import { User } from '../_helpers/user';
import { Role } from '../_helpers/role';

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  telephone: string;
  password: string;
  confirmPassword: string;
  acceptedTerms: boolean;
}

export interface RegisterResponse {
  id: number;
  email: string;
  message: string;
  statut: string;
}

export interface LoginChallengeResponse {
  requiresOtp: boolean;
  challengeId: string;
  message: string;
  expiresInSeconds: number;
  emailSent?: boolean;
  devOtpCode?: string | null;
}

export interface MessageResponse {
  message: string;
}

interface AuthApiUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  name: string;
  role: string;
  statut?: string;
  emailConfirmed?: boolean;
  photoUrl?: string | null;
}

interface AuthSessionResponse {
  serviceToken: string;
  user: AuthApiUser;
}

@Injectable({ providedIn: 'root' })
export class AuthenticationService {
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);

  private readonly currentUserSignal = signal<User | null>(null);
  private readonly loadingSignal = signal(false);
  private readonly pendingChallengeSignal = signal<LoginChallengeResponse | null>(null);
  isLogin = false;

  readonly currentUserName = computed(() => this.currentUserSignal()?.user.name ?? 'Client STB');

  readonly currentUserAvatar = computed(() => {
    const photo = this.currentUserSignal()?.user.photoUrl;
    if (!photo) {
      return 'assets/images/user/avatar-2.jpg';
    }
    if (photo.startsWith('http://') || photo.startsWith('https://') || photo.startsWith('blob:')) {
      return photo;
    }
    return `${environment.apiUrl}${photo}`;
  });

  constructor() {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        if (userData.serviceToken) {
          this.fetchCurrentUser().subscribe({
            next: () => {
              this.isLogin = true;
            },
            error: () => {
              this.logout(false);
            }
          });
        }
      } catch {
        localStorage.removeItem('currentUser');
      }
    }

    const pending = sessionStorage.getItem('otpChallenge');
    if (pending) {
      try {
        this.pendingChallengeSignal.set(JSON.parse(pending));
      } catch {
        sessionStorage.removeItem('otpChallenge');
      }
    }
  }

  get pendingChallenge(): LoginChallengeResponse | null {
    return this.pendingChallengeSignal();
  }

  fetchCurrentUser(): Observable<User> {
    this.loadingSignal.set(true);
    return this.http.get<AuthSessionResponse>(`${environment.apiUrl}/api/auth/me`).pipe(
      map((data) => this.toUser(data.user, this.getToken() ?? '')),
      tap((user: User) => {
        this.currentUserSignal.set(user);
        this.loadingSignal.set(false);
      }),
      catchError((error) => {
        this.loadingSignal.set(false);
        this.logout(false);
        throw error;
      })
    );
  }

  get isLoading(): boolean {
    return this.loadingSignal();
  }

  public get currentUserValue(): User | null {
    return this.currentUserSignal();
  }

  /** Updates avatar/name in the shared session after profile changes. */
  syncProfile(partial: { firstName?: string; lastName?: string; photoUrl?: string | null }): void {
    const current = this.currentUserSignal();
    if (!current) {
      return;
    }

    const firstName = partial.firstName ?? current.user.firstName ?? '';
    const lastName = partial.lastName ?? current.user.lastName ?? '';
    const photoUrl =
      partial.photoUrl === undefined
        ? current.user.photoUrl
        : this.toRelativePhotoUrl(partial.photoUrl);

    current.user = {
      ...current.user,
      firstName,
      lastName,
      name: `${firstName} ${lastName}`.trim() || current.user.name,
      photoUrl
    };
    this.currentUserSignal.set({ ...current, user: { ...current.user } });
  }

  private toRelativePhotoUrl(photoUrl: string | null | undefined): string | null {
    if (!photoUrl) {
      return null;
    }
    if (photoUrl.startsWith(environment.apiUrl)) {
      return photoUrl.substring(environment.apiUrl.length);
    }
    return photoUrl;
  }

  login(email: string, password: string): Observable<LoginChallengeResponse> {
    return this.http.post<LoginChallengeResponse>(`${environment.apiUrl}/api/auth/login`, { email, password }).pipe(
      tap((challenge) => {
        this.pendingChallengeSignal.set(challenge);
        sessionStorage.setItem('otpChallenge', JSON.stringify(challenge));
      })
    );
  }

  verifyOtp(challengeId: string, code: string): Observable<User> {
    return this.http.post<AuthSessionResponse>(`${environment.apiUrl}/api/auth/verify-otp`, { challengeId, code }).pipe(
      map((data) => this.toUser(data.user, data.serviceToken)),
      tap((user) => {
        localStorage.setItem(
          'currentUser',
          JSON.stringify({
            id: user.user.id,
            email: user.user.email,
            serviceToken: user.serviceToken
          })
        );
        this.clearPendingChallenge();
        this.currentUserSignal.set(user);
        this.isLogin = true;
      })
    );
  }

  resendOtp(challengeId: string): Observable<LoginChallengeResponse> {
    return this.http.post<LoginChallengeResponse>(`${environment.apiUrl}/api/auth/resend-otp`, { challengeId }).pipe(
      tap((challenge) => {
        this.pendingChallengeSignal.set(challenge);
        sessionStorage.setItem('otpChallenge', JSON.stringify(challenge));
      })
    );
  }

  forgotPassword(email: string): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${environment.apiUrl}/api/auth/forgot-password`, { email });
  }

  resetPassword(token: string, password: string, confirmPassword: string): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${environment.apiUrl}/api/auth/reset-password`, {
      token,
      password,
      confirmPassword
    });
  }

  isLoggedIn(): boolean {
    return this.isLogin;
  }

  /**
   * @param redirectToHome when true (default), navigate to landing page after logout
   */
  logout(redirectToHome = true): void {
    localStorage.removeItem('currentUser');
    this.clearPendingChallenge();
    this.isLogin = false;
    this.currentUserSignal.set(null);
    this.loadingSignal.set(false);
    if (redirectToHome) {
      this.router.navigate(['/']);
    }
  }

  getToken(): string | null {
    const storedUser = localStorage.getItem('currentUser');
    if (!storedUser) {
      return null;
    }
    try {
      return JSON.parse(storedUser).serviceToken || null;
    } catch {
      return null;
    }
  }

  register(data: RegisterData): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${environment.apiUrl}/api/auth/register`, {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      telephone: data.telephone,
      password: data.password,
      confirmPassword: data.confirmPassword
    });
  }

  private clearPendingChallenge(): void {
    this.pendingChallengeSignal.set(null);
    sessionStorage.removeItem('otpChallenge');
  }

  private toUser(apiUser: AuthApiUser, serviceToken: string): User {
    const user = new User();
    user.serviceToken = serviceToken;
    user.user = {
      id: apiUser.id,
      email: apiUser.email,
      firstName: apiUser.firstName,
      lastName: apiUser.lastName,
      name: apiUser.name || `${apiUser.firstName ?? ''} ${apiUser.lastName ?? ''}`.trim(),
      role: (apiUser.role as Role) || Role.User,
      password: '',
      photoUrl: apiUser.photoUrl ?? null
    };
    return user;
  }
}
