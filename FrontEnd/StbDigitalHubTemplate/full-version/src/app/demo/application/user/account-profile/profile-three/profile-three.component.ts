// Angular import
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

// project import
import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';

@Component({
  selector: 'app-profile-three',
  imports: [CommonModule, ...SHARED_IMPORTS],
  templateUrl: './profile-three.component.html',
  styleUrl: './profile-three.component.scss'
})
export class ProfileThreeComponent {
  private fb = inject(FormBuilder);

  passwordForm!: FormGroup;

  // private Method

  constructor() {
    this.passwordForm = this.fb.group(
      {
        password: ['', Validators.required],
        confirmPassword: ['', Validators.required]
      },
      { validator: this.passwordsMatchValidator }
    );
  }
  passwordsMatchValidator(group: FormGroup) {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;

    return password === confirmPassword ? null : { passwordsNotMatch: true };
  }

  billing = [
    {
      title: 'Bill Due',
      subtitle: '$150.00',
      color: 'link-danger',
      bgColor: 'bg-orange-100',
      des: 'Pay Now',
      border: 'border-danger'
    },
    {
      title: 'Total Credits',
      subtitle: '1570 GB',
      color: 'link-warning',
      bgColor: 'bg-yellow-100',
      des: 'Full Report',
      border: 'border-warning'
    },
    {
      title: 'Plan',
      subtitle: 'Basic',
      color: 'link-success',
      bgColor: 'bg-green-100',
      des: 'Upgrade?',
      border: 'border-success'
    }
  ];

  cardList = [
    {
      src: 'assets/images/profile/card-visa.png',
      company: 'Visa card',
      number: 'Ending in 5269 07XX XXXX 8110',
      type: 'Default',
      design: 'badge btn-light-primary rounded-pill text-base',
      space: 'pt-0'
    },
    {
      src: 'assets/images/profile/card-discover.png',
      company: 'Discover',
      number: 'Ending in 6109 07XX XXXX 8020',
      type: 'Make Default',
      design: 'link-secondary'
    },
    {
      src: 'assets/images/profile/card-master.png',
      company: 'Mastercard',
      number: 'Ending in 7278 07XX XXXX 4290',
      type: 'Make Default',
      design: 'link-secondary',
      space: 'pb-0'
    }
  ];

  tableList = [
    {
      orderNo: '12877227695',
      time: '26 Feb 2021 9:16 am',
      price: '$56.32',
      status: 'Awaiting',
      color: 'bg-light-warning'
    },
    {
      orderNo: '12901477937',
      time: '30 Jan 2021 2:54 pm',
      price: '$75.56',
      status: 'Paid',
      color: 'bg-light-success'
    },
    {
      orderNo: '12767886919',
      time: '22 Jan 2021 12:01 pm',
      price: '$34.32',
      status: 'Paid',
      color: 'bg-light-success'
    }
  ];

  details = [
    {
      title: 'Company',
      value: 'Materially Inc.'
    },
    {
      title: 'Country',
      value: 'USA'
    },
    {
      title: 'Phone number',
      value: '4578-420-410'
    },
    {
      title: 'Birthday',
      value: '31/01/2001'
    }
  ];

  information = [
    {
      title: 'Name',
      value: 'John Doe'
    },
    {
      title: 'Email address',
      value: 'name@example.com'
    }
  ];

  notifications = [
    {
      title: 'Product Announcements and Updates',
      completed: true,
      space: 'mb-3'
    },
    {
      title: 'Events and Meetups',
      completed: true,
      space: 'mb-3'
    },
    {
      title: 'User Research Surveys',
      completed: true,
      space: 'mb-3'
    },
    {
      title: 'Hatch Startup Program',
      completed: false
    }
  ];
}
