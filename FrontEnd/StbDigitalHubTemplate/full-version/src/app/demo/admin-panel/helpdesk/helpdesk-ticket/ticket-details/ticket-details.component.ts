// angular import
import { Component } from '@angular/core';

// project import
import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';

@Component({
  selector: 'app-ticket-details',
  imports: [...SHARED_IMPORTS],
  templateUrl: './ticket-details.component.html',
  styleUrl: './ticket-details.component.scss'
})
export class TicketDetailsComponent {
  // public method
  profiles = [
    {
      src: 'assets/images/user/avatar-5.jpg',
      uploadImage: false
    },
    {
      src: 'assets/images/user/avatar-4.jpg',
      uploadImage: true
    },
    {
      src: 'assets/images/user/avatar-3.jpg',
      uploadImage: false
    }
  ];

  img = [
    {
      image: 'assets/images/light-box/sl2.jpg'
    },
    {
      image: 'assets/images/light-box/sl5.jpg'
    },
    {
      image: 'assets/images/light-box/sl6.jpg'
    },
    {
      image: 'assets/images/light-box/sl1.jpg'
    }
  ];
}
