// Angular import
import { Component } from '@angular/core';

import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';

@Component({
  selector: 'app-basic-tabs-pills',
  imports: [...SHARED_IMPORTS],
  templateUrl: './basic-tabs-pills.component.html',
  styleUrl: './basic-tabs-pills.component.scss'
})
export class BasicTabsPillsComponent {}
