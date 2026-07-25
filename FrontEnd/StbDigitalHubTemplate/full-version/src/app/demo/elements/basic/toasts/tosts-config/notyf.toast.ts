import { Component, inject } from '@angular/core';
import { ToastComponent } from './toastr/toast.component';
import { ToastrService } from './toastr/toastr.service';
import { ToastPackage } from './toastr/toastr-config';

@Component({
  selector: 'app-notyf-toast-component',
  styles: [],
  template: `
    <div class="notyf__toast notyf__toast--success notyf__toast">
      <div class="notyf__wrapper">
        <div class="notyf__icon">
          <i class="notyf__icon--success" style="color: rgb(61, 199, 99);"></i>
        </div>
        <div class="notyf__message">{{ title }} {{ message }}</div>
      </div>
      <div class="notyf__ripple" style="background-color: rgb(61, 199, 99);"></div>
    </div>
  `
})
export class NotyfToastComponent extends ToastComponent {
  protected override toastrService: ToastrService;
  override toastPackage: ToastPackage;

  // constructor is only necessary when not using AoT
  constructor() {
    const toastrService = inject(ToastrService);
    const toastPackage = inject(ToastPackage);

    super();

    this.toastrService = toastrService;
    this.toastPackage = toastPackage;
  }
}
