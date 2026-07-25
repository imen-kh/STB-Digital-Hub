import { Component, NgZone, OnDestroy, ChangeDetectionStrategy, WritableSignal, signal, inject } from '@angular/core';

import { Subscription } from 'rxjs';
import { IndividualConfig, ToastPackage } from './toastr-config';
import { ToastrService } from './toastr.service';

@Component({
  selector: 'app-toast-component',
  template: `
    @if (options.closeButton) {
      <button (click)="remove()" type="button" class="toast-close-button" aria-label="Close">
        <span aria-hidden="true">&times;</span>
      </button>
    }
    @if (title) {
      <div [class]="options.titleClass" [attr.aria-label]="title">
        {{ title }}
        @if (duplicatesCount) {
          [{{ duplicatesCount + 1 }}]
        }
      </div>
    }
    @if (message && options.enableHtml) {
      <div role="alert" [class]="options.messageClass" [innerHTML]="message"></div>
    }
    @if (message && !options.enableHtml) {
      <div role="alert" [class]="options.messageClass" [attr.aria-label]="message">
        {{ message }}
      </div>
    }
    @if (options.progressBar) {
      <div class="toast-progress" [style.width]="width() + '%'"></div>
    }
  `,
  preserveWhitespaces: false,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'toastClasses',
    '[@flyInOut]': '_state()',
    '[style.display]': 'displayStyle',
    '(click)': 'tapToast()',
    '(mouseenter)': 'stickAround()',
    '(mouseleave)': 'delayedHideToast()'
  }
})
export class ToastComponent implements OnDestroy {
  protected toastrService = inject(ToastrService);
  toastPackage = inject(ToastPackage);
  protected ngZone? = inject(NgZone);

  message?: string | null;
  title?: string;
  options: IndividualConfig;
  duplicatesCount!: number;
  originalTimeout: number;
  /** width of progress bar */
  width = signal(-1);
  /** a combination of toast type and options.toastClass */
  toastClasses = '';

  state: WritableSignal<{
    value: 'inactive' | 'active' | 'removed';
    params: { easeTime: number | string; easing: string };
  }>;

  /** controls animation */
  _state() {
    return this.state();
  }

  /** hides component when waiting to be displayed */
  get displayStyle(): string | undefined {
    if (this.state().value === 'inactive') {
      return 'none';
    }

    return;
  }

  // eslint-disable-next-line
  private timeout: any;
  // eslint-disable-next-line
  private intervalId: any;
  private hideTime!: number;
  private sub: Subscription;
  private sub1: Subscription;
  private sub2: Subscription;
  private sub3: Subscription;

  constructor() {
    const toastPackage = this.toastPackage;

    this.message = toastPackage.message;
    this.title = toastPackage.title;
    this.options = toastPackage.config;
    this.originalTimeout = toastPackage.config.timeOut;
    this.toastClasses = `${toastPackage.toastType} ${toastPackage.config.toastClass}`;
    this.sub = toastPackage.toastRef.afterActivate().subscribe(() => {
      this.activateToast();
    });
    this.sub1 = toastPackage.toastRef.manualClosed().subscribe(() => {
      this.remove();
    });
    this.sub2 = toastPackage.toastRef.timeoutReset().subscribe(() => {
      this.resetTimeout();
    });
    this.sub3 = toastPackage.toastRef.countDuplicate().subscribe((count) => {
      this.duplicatesCount = count;
    });
    this.state = signal({
      value: 'inactive',
      params: {
        easeTime: this.toastPackage.config.easeTime,
        easing: 'ease-in'
      }
    });
  }
  ngOnDestroy() {
    this.sub.unsubscribe();
    this.sub1.unsubscribe();
    this.sub2.unsubscribe();
    this.sub3.unsubscribe();
    clearInterval(this.intervalId);
    clearTimeout(this.timeout);
  }
  /**
   * activates toast and sets timeout
   */
  activateToast() {
    this.state.update((state) => ({ ...state, value: 'active' }));
    if (!(this.options.disableTimeOut === true || this.options.disableTimeOut === 'timeOut') && this.options.timeOut) {
      this.outsideTimeout(() => this.remove(), this.options.timeOut);
      this.hideTime = new Date().getTime() + this.options.timeOut;
      if (this.options.progressBar) {
        this.outsideInterval(() => this.updateProgress(), 10);
      }
    }
  }
  /**
   * updates progress bar width
   */
  updateProgress() {
    if (this.width() === 0 || this.width() === 100 || !this.options.timeOut) {
      return;
    }
    const now = new Date().getTime();
    const remaining = this.hideTime - now;
    this.width.set((remaining / this.options.timeOut) * 100);
    if (this.options.progressAnimation === 'increasing') {
      this.width.update((width) => 100 - width);
    }
    if (this.width() <= 0) {
      this.width.set(0);
    }
    if (this.width() >= 100) {
      this.width.set(100);
    }
  }

  resetTimeout() {
    clearTimeout(this.timeout);
    clearInterval(this.intervalId);
    this.state.update((state) => ({ ...state, value: 'active' }));

    this.outsideTimeout(() => this.remove(), this.originalTimeout);
    this.options.timeOut = this.originalTimeout;
    this.hideTime = new Date().getTime() + (this.options.timeOut || 0);
    this.width.set(-1);
    if (this.options.progressBar) {
      this.outsideInterval(() => this.updateProgress(), 10);
    }
  }

  /**
   * tells toastrService to remove this toast after animation time
   */
  remove() {
    if (this.state().value === 'removed') {
      return;
    }
    clearTimeout(this.timeout);
    this.state.update((state) => ({ ...state, value: 'removed' }));
    this.outsideTimeout(() => this.toastrService.remove(this.toastPackage.toastId), +this.toastPackage.config.easeTime);
  }
  tapToast() {
    if (this.state().value === 'removed') {
      return;
    }
    this.toastPackage.triggerTap();
    if (this.options.tapToDismiss) {
      this.remove();
    }
  }
  stickAround() {
    if (this.state().value === 'removed') {
      return;
    }

    if (this.options.disableTimeOut !== 'extendedTimeOut') {
      clearTimeout(this.timeout);
      this.options.timeOut = 0;
      this.hideTime = 0;

      // disable progressBar
      clearInterval(this.intervalId);
      this.width.set(0);
    }
  }
  delayedHideToast() {
    if (
      this.options.disableTimeOut === true ||
      this.options.disableTimeOut === 'extendedTimeOut' ||
      this.options.extendedTimeOut === 0 ||
      this.state().value === 'removed'
    ) {
      return;
    }
    this.outsideTimeout(() => this.remove(), this.options.extendedTimeOut);
    this.options.timeOut = this.options.extendedTimeOut;
    this.hideTime = new Date().getTime() + (this.options.timeOut || 0);
    this.width.set(-1);
    if (this.options.progressBar) {
      this.outsideInterval(() => this.updateProgress(), 10);
    }
  }

  // eslint-disable-next-line
  outsideTimeout(func: () => any, timeout: number) {
    if (this.ngZone) {
      this.ngZone.runOutsideAngular(() => (this.timeout = setTimeout(() => this.runInsideAngular(func), timeout)));
    } else {
      this.timeout = setTimeout(() => func(), timeout);
    }
  }

  // eslint-disable-next-line
  outsideInterval(func: () => any, timeout: number) {
    if (this.ngZone) {
      this.ngZone.runOutsideAngular(() => (this.intervalId = setInterval(() => this.runInsideAngular(func), timeout)));
    } else {
      this.intervalId = setInterval(() => func(), timeout);
    }
  }

  // eslint-disable-next-line
  private runInsideAngular(func: () => any) {
    if (this.ngZone) {
      this.ngZone.run(() => func());
    } else {
      func();
    }
  }
}
