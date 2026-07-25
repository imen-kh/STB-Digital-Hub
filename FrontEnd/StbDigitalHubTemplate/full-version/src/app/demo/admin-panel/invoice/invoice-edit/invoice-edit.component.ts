// angular import
import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';

// project import
import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';
import { AddressEditModalComponent } from './address-modal/address-modal.component';

// bootstrap import
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-invoice-edit',
  imports: [...SHARED_IMPORTS, RouterModule],
  templateUrl: './invoice-edit.component.html',
  styleUrl: './invoice-edit.component.scss'
})
export class InvoiceEditComponent {
  // public props
  modalService = inject(NgbModal);
  isCollapsed = false;
  multiCollapsed = true;

  // public methods
  openAddressBook() {
    this.modalService.open(AddressEditModalComponent, { size: 'lg', scrollable: true });
  }

  productList = [
    {
      id: 1,
      name: 'Apple Series 4 GPS A38 MM Space',
      description: 'Apple Watch SE Smartwatch',
      qty: 3,
      price: 275
    },
    {
      id: 1,
      name: 'Boat On-Ear Wireless',
      description: 'Mic Bluetooth 4.2, Rockerz 450R',
      qty: 45,
      price: 82
    },
    {
      id: 1,
      name: 'Fitbit MX30 Smart Watch',
      description: '(MX30- waterproof) watch',
      qty: 70,
      price: 85
    }
  ];
}
