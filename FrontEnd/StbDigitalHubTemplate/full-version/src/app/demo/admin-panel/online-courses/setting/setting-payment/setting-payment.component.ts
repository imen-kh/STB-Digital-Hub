// angular import
import { Component } from '@angular/core';
import { CdkStepperModule } from '@angular/cdk/stepper';

// project import
import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';
import { PaymentDetailsComponent } from './payment-details/payment-details.component';

@Component({
  selector: 'app-setting-payment',
  imports: [...SHARED_IMPORTS, PaymentDetailsComponent, CdkStepperModule],
  templateUrl: './setting-payment.component.html',
  styleUrl: './setting-payment.component.scss'
})
export class SettingPaymentComponent {}
