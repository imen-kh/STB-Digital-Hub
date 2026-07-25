// Angular import
import { Component, inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';

import { MatStepperModule } from '@angular/material/stepper';
import { MatNativeDateModule } from '@angular/material/core';

// project import
import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';

@Component({
  selector: 'app-profile-two',
  imports: [...SHARED_IMPORTS, MatStepperModule, MatNativeDateModule],
  templateUrl: './profile-two.component.html',
  styleUrl: './profile-two.component.scss'
})
export class ProfileTwoComponent {
  private _formBuilder = inject(FormBuilder);

  // private Props
  firstFormGroup = this._formBuilder.group({
    firstCtrl: ['', Validators.required]
  });

  secondFormGroup = this._formBuilder.group({
    secondCtrl: ['', Validators.required]
  });

  isLinear = false;

  //private Method
  inputData = [
    {
      title: 'First Name',
      value: 'Schorl'
    },
    {
      title: 'Last Name',
      value: 'Delaney'
    },
    {
      title: 'Email Address',
      value: 'demo@company.com'
    },
    {
      title: 'Phone Number',
      value: '000-00-00000'
    },
    {
      title: 'Company Name',
      value: 'company.ltd'
    },
    {
      title: 'Site Information',
      value: 'www.company.com'
    }
  ];

  billData = [
    {
      title: 'Block No#',
      value: '16657'
    },
    {
      title: 'Apartment Name',
      value: 'Dardan Ranch'
    },
    {
      title: 'Street Line 1',
      value: 'Nathaniel Ports'
    },
    {
      title: 'Street Line 2',
      value: 'nr. Oran Walks'
    }
  ];

  payments = [
    {
      title: 'Name on Card',
      value: 'Selena Litten'
    },
    {
      title: 'Card Number',
      value: '4012 8888 8888 1881'
    },
    {
      title: 'Expiry Date',
      value: '10/22'
    },
    {
      title: 'CCV Code',
      value: '123'
    }
  ];

  passwords = [
    {
      title: 'New Password',
      value: 'Enter New Password'
    },
    {
      title: 'Confirm Password',
      value: 'Enter Confirm password'
    }
  ];
}
