// angular import
import { Component } from '@angular/core';

// project import
import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';
import { PaymentDetailsComponent } from './payment-details/payment-details.component';
import { CartDetailsComponent } from './cart-details/cart-details.component';
import { BillingComponent } from './billing/billing.component';

@Component({
  selector: 'app-checkout',
  imports: [...SHARED_IMPORTS, PaymentDetailsComponent, CartDetailsComponent, BillingComponent],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.scss'
})
export class CheckoutComponent {}
