// Angular import
import { Component } from '@angular/core';

// project import
import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';

// third party
import { NgxMaskDirective, provideNgxMask } from 'ngx-mask';

@Component({
  selector: 'app-input-mask',
  imports: [...SHARED_IMPORTS, NgxMaskDirective],
  templateUrl: './input-mask.component.html',
  styleUrl: './input-mask.component.scss',
  providers: [provideNgxMask()]
})
export class InputMaskComponent {}
