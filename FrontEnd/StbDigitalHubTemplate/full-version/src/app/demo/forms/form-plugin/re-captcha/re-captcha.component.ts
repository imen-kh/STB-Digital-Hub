// Angular import
import { Component } from '@angular/core';

// project import
import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';

// third party
import { RecaptchaModule, RecaptchaFormsModule } from 'ng-recaptcha';

export interface FormModel {
  captcha?: string;
}

@Component({
  selector: 'app-re-captcha',
  imports: [...SHARED_IMPORTS, RecaptchaModule, RecaptchaFormsModule],
  templateUrl: './re-captcha.component.html',
  styleUrl: './re-captcha.component.scss'
})
export class ReCaptchaComponent {
  // private props
  captcha?: string;
  formModel: FormModel = {};
}
