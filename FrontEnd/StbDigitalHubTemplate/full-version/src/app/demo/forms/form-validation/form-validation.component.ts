// Angular import
import { Component, OnInit } from '@angular/core';

// project import
import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';

// custom validators
import {
  EqualToValidatorDirective,
  UrlValidatorDirective,
  PhoneValidatorDirective
} from 'src/app/theme/shared/components/validators/custom-validators';

export class FormInput {
  email!: string;
  password!: string;
  confirmPassword!: string;
  requiredInput!: string;
  url!: string;
  phone!: string;
  cmbGear!: string;
  address!: string;
  file!: string;
  switcher!: string;
}

@Component({
  selector: 'app-form-validation',
  imports: [...SHARED_IMPORTS, EqualToValidatorDirective, UrlValidatorDirective, PhoneValidatorDirective],
  templateUrl: './form-validation.component.html',
  styleUrl: './form-validation.component.scss'
})
export class FormValidationComponent implements OnInit {
  // private props
  formInput!: FormInput;
  form!: string;
  isSubmit: boolean;

  // Constructor
  constructor() {
    this.isSubmit = false;
  }

  // Life cycle events
  ngOnInit() {
    this.formInput = {
      email: '',
      password: '',
      confirmPassword: '',
      requiredInput: '',
      url: '',
      phone: '',
      cmbGear: '',
      address: '',
      file: '',
      switcher: ''
    };
  }

  // private method
  save(form: { valid: undefined }) {
    if (!form.valid) {
      this.isSubmit = true;
      return;
    }
  }
}
