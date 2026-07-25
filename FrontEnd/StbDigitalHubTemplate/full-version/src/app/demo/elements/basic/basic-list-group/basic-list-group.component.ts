// Angular import
import { Component } from '@angular/core';

import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';

@Component({
  selector: 'app-basic-list-group',
  imports: [...SHARED_IMPORTS],
  templateUrl: './basic-list-group.component.html',
  styleUrl: './basic-list-group.component.scss'
})
export class BasicListGroupComponent {
  // private Method
  item = [
    {
      text: 'Cras justo odio'
    },
    {
      text: 'Dapibus ac facilisis in'
    },
    {
      text: 'Morbi leo risus'
    },
    {
      text: 'Porta ac consectetur ac'
    },
    {
      text: 'Vestibulum at eros'
    }
  ];
}
