// Angular import
import { Component } from '@angular/core';

import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';

@Component({
  selector: 'app-basic-cards',
  imports: [...SHARED_IMPORTS],
  templateUrl: './basic-cards.component.html',
  styleUrl: './basic-cards.component.scss'
})
export class BasicCardsComponent {}
