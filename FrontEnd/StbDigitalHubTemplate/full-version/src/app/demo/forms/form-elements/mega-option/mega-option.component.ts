import { Component } from '@angular/core';
import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';

@Component({
  selector: 'app-mega-option',
  imports: [...SHARED_IMPORTS],
  templateUrl: './mega-option.component.html',
  styleUrl: './mega-option.component.scss'
})
export class MegaOptionComponent {}
