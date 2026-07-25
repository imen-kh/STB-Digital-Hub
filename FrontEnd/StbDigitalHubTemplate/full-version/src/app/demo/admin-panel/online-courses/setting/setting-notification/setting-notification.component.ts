// angular import
import { Component } from '@angular/core';

// project import
import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';

interface NotificationSetting {
  checked: boolean;
  name: string;
}

interface NotificationGroup {
  title: string;
  description: string;
  type: NotificationSetting[];
}

@Component({
  selector: 'app-setting-notification',
  imports: [...SHARED_IMPORTS],
  templateUrl: './setting-notification.component.html',
  styleUrl: './setting-notification.component.scss'
})
export class SettingNotificationComponent {
  notifications: NotificationGroup[] = [
    {
      title: 'Enrollment Notifications',
      description: 'Get notified via email whenever a student enrolls in your school and/or courses.',
      type: [
        {
          checked: true,
          name: 'When a new student joins the school'
        },
        {
          checked: true,
          name: 'When a student enrolls in a paid course'
        },
        {
          checked: false,
          name: 'When a student enrolls in a free course'
        }
      ]
    },
    {
      title: 'Comment Notifications',
      description: 'Get alerted via email whenever someone engages in a commenting action.',
      type: [
        {
          checked: true,
          name: 'When a new comment is posted that requires moderation'
        },
        {
          checked: false,
          name: 'When a new comment is posted on one of your courses'
        },
        {
          checked: true,
          name: "When a new comment is posted in a thread you've commented on"
        }
      ]
    },
    {
      title: 'Subscription Notifications',
      description: 'Get email notifications for specific subscription events.',
      type: [
        {
          checked: true,
          name: 'When a subscription payment fails or a subscription is canceled due to non-payment'
        },
        {
          checked: true,
          name: 'When a student cancels their subscription to one of your courses'
        }
      ]
    }
  ];
}
