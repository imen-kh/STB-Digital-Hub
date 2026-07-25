// angular import
import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';

// project import
import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';
import { AddressModalComponent } from './address-modal/address-modal.component';

// bootstrap import
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-invoice-create',
  imports: [...SHARED_IMPORTS, RouterModule],
  templateUrl: './invoice-create.component.html',
  styleUrl: './invoice-create.component.scss'
})
export class InvoiceCreateComponent {
  // public props
  modalService = inject(NgbModal);
  isCollapsed = false;
  multiCollapsed = true;

  // public methods
  openAddressBook() {
    this.modalService.open(AddressModalComponent, { size: 'lg', scrollable: true });
  }
}
