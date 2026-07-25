// Angular import
import { Component } from '@angular/core';

// project import
import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';

@Component({
  selector: 'app-list-style-v2',
  imports: [...SHARED_IMPORTS],
  templateUrl: './list-style-v2.component.html',
  styleUrl: './list-style-v2.component.scss'
})
export class ListStyleV2Component {
  // private Method
  listPerson = [
    {
      src: 'assets/images/user/avatar-5.jpg',
      name: 'Elnora',
      icon: 'fas fa-check-circle',
      position: 'Lead Marketing Facilitator',
      text: ' We need to generate the virtual CSS hard drive!',
      email: 'Reid_OConnell4@yahoo.com',
      phone: '506-654-1653'
    },
    {
      src: 'assets/images/user/avatar-3.jpg',
      name: 'Elnora',
      icon: 'fas fa-check-circle',
      position: 'Lead Marketing Facilitator',
      text: 'If we synthesize the protocol, we can get to the RSS circuit through.',
      email: 'Reid_OConnell4@yahoo.com',
      phone: '506-654-1653'
    },
    {
      src: 'assets/images/user/avatar-1.jpg',
      name: 'Elnora',
      position: 'Lead Marketing Facilitator',
      text: ' We need to generate the virtual CSS hard drive!',
      email: 'Reid_OConnell4@yahoo.com',
      phone: '506-654-1653'
    }
  ];
}
