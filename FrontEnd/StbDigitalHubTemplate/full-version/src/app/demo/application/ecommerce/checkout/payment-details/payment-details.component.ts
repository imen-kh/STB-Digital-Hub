// angular import
import { Component, ElementRef, inject } from '@angular/core';

// bootstrap import
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

// third party
import { SweetAlert2Module, SweetAlert2LoaderService } from '@sweetalert2/ngx-sweetalert2';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-payment-details',
  imports: [SweetAlert2Module],
  templateUrl: './payment-details.component.html',
  styleUrl: './payment-details.component.scss',
  providers: [SweetAlert2LoaderService]
})
export class PaymentDetailsComponent {
  private modalService = inject(NgbModal);

  // public method
  orderComplete(content: ElementRef) {
    this.modalService.open(content, { centered: true });
  }

  customs() {
    Swal.fire({
      title: 'Thank you for order!',
      html: '<p class="text-muted d-block">We will send a process notification, before it delivered.<p><p>Your order id:<span class="text-primary">2e2c9449-7cfd-58d2-b953-f0011c256c39<span></p>',
      imageUrl: 'assets/images/application/order_completed.png',
      imageWidth: 500,
      imageHeight: 279,
      showConfirmButton: false,
      imageAlt: 'Custom image',
      showCloseButton: true,
      showCancelButton: true
    });
  }

  Delivery = [
    {
      type: 'Standard Delivery (Free)',
      date: 'Delivered on Monday 8 Jun'
    },
    {
      type: 'Fast Delivery ($5.00)',
      date: 'Delivered on Friday 5 Jun'
    }
  ];

  payments = [
    {
      mode: 'Credit / Debit Card',
      text: 'We support Mastercard, Visa, Discover and Stripe.',
      src: 'assets/images/application/card.png'
    },
    {
      mode: 'Cash on Delivery',
      text: 'Pay with cash when your order is delivered.',
      src: 'assets/images/application/cod.png'
    }
  ];

  cardAdd = [
    {
      color: 'bg-primary',
      src: 'assets/images/application/mastercard.png'
    },
    {
      color: 'bg-secondary',
      src: 'assets/images/application/visa.png'
    }
  ];

  cardDetails = [
    {
      number: '****'
    },
    {
      number: '****'
    },
    {
      number: '****'
    },
    {
      number: '2599'
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

  cards = [
    {
      title: 'Expiry Date',
      details: 'Enter Expiry Date'
    },
    {
      title: 'CVV',
      details: 'Enter CVV'
    }
  ];

  OptionsList = [
    {
      options: 'Credit Card'
    },
    {
      options: 'Debit Card'
    },
    {
      options: 'Net Banking'
    }
  ];
}
