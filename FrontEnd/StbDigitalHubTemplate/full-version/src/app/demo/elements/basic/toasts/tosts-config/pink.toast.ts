import { Component, inject } from '@angular/core';

import { ToastComponent } from './toastr/toast.component';
import { ToastrService } from './toastr/toastr.service';
import { ToastPackage } from './toastr/toastr-config';

@Component({
  selector: 'app-pink-toast-component',
  styles: [
    `
      :host {
        background-color: #ff69b4;
        position: relative;
        overflow: hidden;
        margin: 0 0 6px;
        padding: 10px 10px 10px 10px;
        width: 300px;
        border-radius: 3px 3px 3px 3px;
        color: #ffffff;
        pointer-events: all;
        cursor: pointer;
      }
      .btn-pink {
        -webkit-backface-visibility: hidden;
        -webkit-transform: translateZ(0);
      }
    `
  ],
  template: `
    <div class="row" [style.display]="state().value === 'inactive' ? 'none' : ''">
      <div class="col-9">
        @if (title) {
          <div [class]="options.titleClass" [attr.aria-label]="title">
            {{ title }}
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
      </div>
      <div class="col-3 text-right">
        @if (!options.closeButton) {
          <a class="btn btn-pink btn-sm" (click)="action($event)">
            {{ undoString }}
          </a>
        }
        @if (options.closeButton) {
          <a (click)="remove()" class="btn btn-pink btn-sm">close</a>
        }
      </div>
    </div>
    @if (options.progressBar) {
      <div>
        <div class="toast-progress" [style.width]="width + '%'"></div>
      </div>
    }
  `,
  preserveWhitespaces: false
})
export class PinkToastComponent extends ToastComponent {
  protected override toastrService: ToastrService;
  override toastPackage: ToastPackage;

  // used for demo purposes
  undoString = 'undo';

  // constructor is only necessary when not using AoT
  constructor() {
    const toastrService = inject(ToastrService);
    const toastPackage = inject(ToastPackage);

    super();

    this.toastrService = toastrService;
    this.toastPackage = toastPackage;
  }

  action(event: Event) {
    event.stopPropagation();
    this.undoString = 'undid';
    this.toastPackage.triggerAction();
    return false;
  }
}
