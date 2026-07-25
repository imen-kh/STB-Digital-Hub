// Angular import
import { Component, input, inject } from '@angular/core';

// third party
import { QuillModule } from 'ngx-quill';

// project import
import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';
import { EmailService } from '../email.service';
import { ScrollbarComponent } from 'src/app/theme/shared/components/scrollbar/scrollbar.component';

@Component({
  selector: 'app-email-details',
  imports: [QuillModule, ...SHARED_IMPORTS, ScrollbarComponent],
  templateUrl: './email-details.component.html',
  styleUrl: './email-details.component.scss'
})
export class EmailDetailsComponent {
  private emailService = inject(EmailService);

  // private Props
  Check = input(false);
  unCheck = input(true);
  important = input(false);
  unimportant = input(true);
  common = input(true);
  promotion = input(false);
  Forums = input(false);
  paperClip = input(true);

  isCollapsed: boolean = true;
  show: boolean = false;
  fadein = true;

  // private Method
  onClick() {
    this.show = !this.show;
    this.fadein = !this.fadein;
    this.emailService.toggleFadeIn();
  }

  MailList = [
    {
      name: 'Barney Thea',
      img: 'assets/images/user/avatar-1.jpg',
      date: '12 Jul 22 08:23 AM',
      des: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry standard dummy text ever since the 1500s.been the industry standard dummy text ever since the 1500s.'
    },
    {
      name: 'Zachary Chambers ',
      prom: 'promotion',
      from: 'Forums',
      icon: 'ti ti-paperclip',
      date: '13 Jul 22 08:23 AM',
      img: 'assets/images/user/avatar-2.jpg',
      des: 'of the printing and typesetting industry. Lorem Ipsum has been Lorem Ipsum is simply dummy text the industrys standard dummy text ever since the 1500s.'
    },
    {
      name: 'Mattie Reid ',
      date: '14 Jul 22 08:23 AM',
      img: 'assets/images/user/avatar-3.jpg',
      des: 'simply dummy text the industrys standard dummy text ever since the 1500s.'
    },
    {
      name: 'Nathaniel Vasquez',
      date: '15 Jul 22 08:23 AM',
      from: 'Forums',
      icon: 'ti ti-paperclip',
      img: 'assets/images/user/avatar-4.jpg',
      des: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry standard dummy text ever since the 1500s.been the industry standard dummy text ever since the 1500s.'
    },
    {
      name: 'Zachary Chambers',
      date: '16 Jul 22 08:23 AM',
      prom: 'promotion',
      icon: 'ti ti-paperclip',
      img: 'assets/images/user/avatar-5.jpg',
      des: 'of the printing and typesetting industry. Lorem Ipsum has been Lorem Ipsum is simply dummy text the industrys standard dummy text ever since the 1500s.'
    },
    {
      name: 'Barney Thea',
      img: 'assets/images/user/avatar-1.jpg',
      date: '12 Jul 22 08:23 AM',
      des: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry standard dummy text ever since the 1500s.been the industry standard dummy text ever since the 1500s.'
    },
    {
      name: 'Zachary Chambers ',
      prom: 'promotion',
      from: 'Forums',
      icon: 'ti ti-paperclip',
      date: '13 Jul 22 08:23 AM',
      img: 'assets/images/user/avatar-2.jpg',
      des: 'of the printing and typesetting industry. Lorem Ipsum has been Lorem Ipsum is simply dummy text the industrys standard dummy text ever since the 1500s.'
    },
    {
      name: 'Mattie Reid ',
      date: '14 Jul 22 08:23 AM',
      img: 'assets/images/user/avatar-3.jpg',
      des: 'simply dummy text the industrys standard dummy text ever since the 1500s.'
    },
    {
      name: 'Nathaniel Vasquez',
      date: '15 Jul 22 08:23 AM',
      from: 'Forums',
      icon: 'ti ti-paperclip',
      img: 'assets/images/user/avatar-4.jpg',
      des: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry standard dummy text ever since the 1500s.been the industry standard dummy text ever since the 1500s.'
    },
    {
      name: 'Zachary Chambers',
      date: '16 Jul 22 08:23 AM',
      prom: 'promotion',
      icon: 'ti ti-paperclip',
      img: 'assets/images/user/avatar-5.jpg',
      des: 'of the printing and typesetting industry. Lorem Ipsum has been Lorem Ipsum is simply dummy text the industrys standard dummy text ever since the 1500s.'
    },
    {
      name: 'Barney Thea',
      img: 'assets/images/user/avatar-1.jpg',
      date: '12 Jul 22 08:23 AM',
      des: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry standard dummy text ever since the 1500s.been the industry standard dummy text ever since the 1500s.'
    },
    {
      name: 'Zachary Chambers ',
      prom: 'promotion',
      from: 'Forums',
      icon: 'ti ti-paperclip',
      date: '13 Jul 22 08:23 AM',
      img: 'assets/images/user/avatar-2.jpg',
      des: 'of the printing and typesetting industry. Lorem Ipsum has been Lorem Ipsum is simply dummy text the industrys standard dummy text ever since the 1500s.'
    },
    {
      name: 'Mattie Reid ',
      date: '14 Jul 22 08:23 AM',
      img: 'assets/images/user/avatar-3.jpg',
      des: 'simply dummy text the industrys standard dummy text ever since the 1500s.'
    },
    {
      name: 'Nathaniel Vasquez',
      date: '15 Jul 22 08:23 AM',
      from: 'Forums',
      icon: 'ti ti-paperclip',
      img: 'assets/images/user/avatar-4.jpg',
      des: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry standard dummy text ever since the 1500s.been the industry standard dummy text ever since the 1500s.'
    },
    {
      name: 'Zachary Chambers',
      date: '16 Jul 22 08:23 AM',
      prom: 'promotion',
      icon: 'ti ti-paperclip',
      img: 'assets/images/user/avatar-5.jpg',
      des: 'of the printing and typesetting industry. Lorem Ipsum has been Lorem Ipsum is simply dummy text the industrys standard dummy text ever since the 1500s.'
    }
  ];

  icons = [
    {
      color: 'btn-link-primary',
      icons: 'ti ti-archive',
      title: 'archive'
    },
    {
      color: 'btn-link-danger',
      icons: 'ti ti-mail',
      title: 'mail'
    },
    {
      color: 'btn-link-secondary',
      icons: 'ti ti-trash',
      title: 'trash'
    },
    {
      color: 'btn-link-warning',
      icons: 'ti ti-eye-off',
      title: 'eye-off'
    }
  ];
}
