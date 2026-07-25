// angular import
import { Component } from '@angular/core';

// project import
import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';

export interface MemberPlan {
  title: string;
  value: string;
  more: string;
}

@Component({
  selector: 'app-membership-setting',
  imports: [...SHARED_IMPORTS],
  templateUrl: './membership-setting.component.html',
  styleUrl: './membership-setting.component.scss'
})
export class MembershipSettingComponent {
  showNewPassword: boolean = false;
  showCurrentPassword: boolean = false;
  newPassword: string = '123456';
  currentPassword: string = '123456';

  toggleNewPassword() {
    this.showNewPassword = !this.showNewPassword;
  }

  toggleCurrentPassword() {
    this.showCurrentPassword = !this.showCurrentPassword;
  }

  // public method
  memberPlan: MemberPlan[] = [
    {
      title: 'Membership Plan',
      value: 'Addicted $150',
      more: 'See more Plan'
    },
    {
      title: 'Manage',
      value: 'Membership',
      more: 'Update, Cancel and more'
    },
    {
      title: 'Renewal Date',
      value: '120 November, 2024',
      more: 'View payment method'
    }
  ];
}
