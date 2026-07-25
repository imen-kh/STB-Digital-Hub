// angular import
import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

// rxjs import
import { catchError, map, Observable, tap } from 'rxjs';

// project import
import { environment } from 'src/environments/environment';
import { User } from '../_helpers/user';
import { Role } from '../_helpers/role';

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
  /** Present only in Development when SMTP delivery failed. */
  devOtpCode?: string | null;
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
}

interface AuthSessionResponse {
  serviceToken: string;
  user: AuthApiUser;
}

@Injectable({ providedIn: 'root' })
export class AuthenticationService {
  private router = inject(Router);
  private http = inject(HttpClient);

  private currentUserSignal = signal<User | null>(null);
  private loadingSignal = signal<boolean>(false);
  isLogin: boolean = false;

  /** Pending OTP challenge after password login (no session yet). */
  private pendingChallengeSignal = signal<LoginChallengeResponse | null>(null);

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
              this.logout();
            }
          });
        }
      } catch (error) {
        console.error('Error parsing stored user data:', error);
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
        console.error('Error fetching current user:', error);
        this.loadingSignal.set(false);
        this.logout();
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

  public get currentUserName(): string | null {
    const currentUser = this.currentUserValue;
    return currentUser ? currentUser.user.name : 'John Doe';
  }

  /**
   * Step 1: validate email/password, then require OTP.
   * Does NOT create a session.
   */
  login(email: string, password: string): Observable<LoginChallengeResponse> {
    return this.http
      .post<LoginChallengeResponse>(`${environment.apiUrl}/api/auth/login`, { email, password })
      .pipe(
        tap((challenge) => {
          this.pendingChallengeSignal.set(challenge);
          sessionStorage.setItem('otpChallenge', JSON.stringify(challenge));
        })
      );
  }

  /**
   * Step 2: verify OTP, activate account on first login, then create session.
   */
  verifyOtp(challengeId: string, code: string): Observable<User> {
    return this.http
      .post<AuthSessionResponse>(`${environment.apiUrl}/api/auth/verify-otp`, { challengeId, code })
      .pipe(
        map((data) => this.toUser(data.user, data.serviceToken)),
        tap((user) => {
          const userDetails = {
            id: user.user.id,
            email: user.user.email,
            serviceToken: user.serviceToken
          };
          localStorage.setItem('currentUser', JSON.stringify(userDetails));
          this.clearPendingChallenge();
          this.currentUserSignal.set(user);
          this.isLogin = true;
        })
      );
  }

  resendOtp(challengeId: string): Observable<LoginChallengeResponse> {
    return this.http
      .post<LoginChallengeResponse>(`${environment.apiUrl}/api/auth/resend-otp`, { challengeId })
      .pipe(
        tap((challenge) => {
          this.pendingChallengeSignal.set(challenge);
          sessionStorage.setItem('otpChallenge', JSON.stringify(challenge));
        })
      );
  }

  isLoggedIn() {
    return this.isLogin;
  }

  logout() {
    localStorage.removeItem('currentUser');
    this.clearPendingChallenge();
    this.isLogin = false;
    this.currentUserSignal.set(null);
    this.loadingSignal.set(false);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        return userData.serviceToken || null;
      } catch {
        return null;
      }
    }
    return null;
  }

  /**
   * Creates a pending account. Does NOT open a session.
   */
  register(email: string, password: string, firstName?: string, lastName?: string): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${environment.apiUrl}/api/auth/register`, {
      email,
      password,
      firstName,
      lastName
    });
  }

  private clearPendingChallenge() {
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
      password: ''
    };
    return user;
  }
}
