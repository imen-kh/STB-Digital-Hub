// angular import
import { Component, ElementRef, inject } from '@angular/core';

// bootstrap import
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-billing',
  imports: [],
  templateUrl: './billing.component.html',
  styleUrl: './billing.component.scss'
})
export class BillingComponent {
  private modalService = inject(NgbModal);

  // public method
  addAddress(content: ElementRef) {
    this.modalService.open(content, { centered: true });
  }

  addresses = [
    {
      use: 'Default',
      type: 'Billing Address',
      place: '(Home)',
      location: '654 Tihak Grv, 1381 Wanu Way, Godhekeh, New Mexico, Italy - RG3J 8DF',
      number: '(709) 996-1533'
    },
    {
      type: 'Chester Gomez',
      place: '(Office)',
      location: '1718 Neabo Loop, 555 Azaaw Avenue, Vaoleeb, South Carolina, Liberia - TQ5 4JM',
      number: '(859) 767-9467'
    }
  ];

  getTotal = [
    {
      title: 'Sub Total',
      price: '$300.00'
    },
    {
      title: 'Coupon Discount',
      price: '-'
    },
    {
      title: 'Shipping Charges',
      price: '-'
    }
  ];

  delian = [
    {
      title: 'Email',
      text: 'deliaturewpo@company.com'
    },
    {
      title: 'Contact',
      text: '(980) 473-2942'
    },
    {
      title: 'No. of order',
      text: '19'
    }
  ];

  radios = [
    {
      type: 'Home'
    },
    {
      type: 'Office'
    }
  ];

  editAddress = [
    {
      title: 'City',
      text: 'Enter City'
    },
    {
      title: 'State',
      text: 'Enter State'
    },
    {
      title: 'Country',
      text: 'Enter Country'
    },
    {
      title: 'Area Code',
      text: 'Enter Area Code'
    }
  ];
}
