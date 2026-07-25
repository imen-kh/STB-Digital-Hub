// angular import
import { Component, ElementRef, inject } from '@angular/core';

// bootstrap import
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

// project import
import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';

@Component({
  selector: 'app-cart-details',
  imports: [...SHARED_IMPORTS],
  templateUrl: './cart-details.component.html',
  styleUrl: './cart-details.component.scss'
})
export class CartDetailsComponent {
  private modalService = inject(NgbModal);

  // public method
  inputNumber = 0;

  plus() {
    this.inputNumber = this.inputNumber + 1;
  }
  minus() {
    if (this.inputNumber != 0) {
      this.inputNumber = this.inputNumber - 1;
    }
  }

  couponCode(content: ElementRef) {
    this.modalService.open(content, { size: 'lg' });
  }

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

  coupons = [
    {
      color: 'border-secondary',
      offer: 'Up to 50% Off',
      code: 'BERRY50',
      colorCode: 'btn-light-secondary',
      border: 'border-secondary'
    },
    {
      color: 'border-danger',
      offer: 'Festival Fires',
      code: 'FLAT05',
      colorCode: 'btn-light-danger',
      border: 'border-danger'
    }
  ];

  couponsCode = [
    {
      offer: 'Get $150 off on your subscription',
      color: 'bg-primary',
      icon: 'ti ti-gift',
      description: 'When you subscribe to the unlimited consultation plan on berry.',
      code: 'SUB150',
      codeColor: 'btn-light-primary',
      border: 'border-primary'
    },
    {
      offer: 'Save up to $200',
      color: 'bg-warning',
      icon: 'ti ti-gift',
      description: 'Make 4 play store recharge code purchases & save up to $200',
      code: 'UPTO200',
      codeColor: 'btn-light-warning',
      border: 'border-warning'
    }
  ];
}
