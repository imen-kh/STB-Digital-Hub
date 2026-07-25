// angular import
import { Component } from '@angular/core';

// project import
import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';

@Component({
  selector: 'app-form-floating',
  imports: [...SHARED_IMPORTS],
  templateUrl: './form-floating.component.html',
  styleUrl: './form-floating.component.scss'
})
export class FormFloatingComponent {}
