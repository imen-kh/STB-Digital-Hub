// angular import
import { Component } from '@angular/core';

// project import
import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';

@Component({
  selector: 'app-input-group',
  imports: [...SHARED_IMPORTS],
  templateUrl: './input-group.component.html',
  styleUrl: './input-group.component.scss'
})
export class InputGroupComponent {}
