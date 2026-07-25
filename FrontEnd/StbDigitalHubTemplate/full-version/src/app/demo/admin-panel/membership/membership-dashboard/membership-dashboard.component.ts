// Angular import
import { Component } from '@angular/core';

// project import
import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';
import { StatisticsChartComponent } from 'src/app/theme/shared/components/apexchart/statistics-chart/statistics-chart.component';
import { StateChartComponent } from './state-chart/state-chart.component';
import { ActivityChartComponent } from './activity-chart/activity-chart.component';

@Component({
  selector: 'app-membership-dashboard',
  imports: [...SHARED_IMPORTS, StatisticsChartComponent, StateChartComponent, ActivityChartComponent],
  templateUrl: './membership-dashboard.component.html',
  styleUrl: './membership-dashboard.component.scss'
})
export class MembershipDashboardComponent {
  // public method
  membership = [
    {
      title: 'Registrations',
      value: '980+',
      date: 'May 23 - June 01 (2018)',
      icon: 'ph-book-bookmark',
      background: 'bg-light-primary'
    },
    {
      title: 'Renewals',
      value: '1,563',
      date: 'May 23 - June 01 (2018)',
      icon: 'ph-rocket',
      background: 'bg-light-success'
    },
    {
      title: 'Revenue',
      value: '42.6%',
      date: 'May 23 - June 01 (2018)',
      icon: 'ph-credit-card',
      background: 'bg-light-warning'
    },
    {
      title: 'Cancellations',
      value: '30.7%',
      date: 'May 23 - June 01 (2018)',
      icon: 'ph-user-minus',
      background: 'bg-light-danger'
    }
  ];

  tasks = [
    {
      title: 'Realize offers!',
      time: '16:00',
      border_color: 'border-success'
    },
    {
      title: 'Add new members.',
      time: '14:00',
      border_color: 'border-warning'
    },
    {
      title: 'Add new benefit list.',
      time: '13:00',
      border_color: 'border-primary'
    },
    {
      title: 'Second offer is end!',
      time: '09:00',
      border_color: 'border-danger'
    }
  ];

  activityList = [
    {
      image: 'assets/images/user/avatar-4.jpg',
      name: 'Airi Satou',
      email: 'satou123@gmail.com',
      date: '2023/09/12'
    },
    {
      image: 'assets/images/user/avatar-3.jpg',
      name: 'Ashton Cox',
      email: 'ashton@gmail.com',
      date: '2023/09/12'
    },
    {
      image: 'assets/images/user/avatar-2.jpg',
      name: 'Bradley Greer',
      email: 'greer05@gmail.com',
      date: '2022/09/19'
    },
    {
      image: 'assets/images/user/avatar-5.jpg',
      name: 'Brielle Williamson',
      email: 'bw23@gmail.com',
      date: '2022/08/22'
    },
    {
      image: 'assets/images/user/avatar-1.jpg',
      name: 'Colleen Hurst',
      email: 'hurst006@gmail.com',
      date: '2022/06/26'
    }
  ];

  notifications = [
    {
      image: 'assets/images/user/avatar-1.jpg',
      title: 'Brieley join casual membership..',
      date: 'Today | 9:00 AM'
    },
    {
      image: 'assets/images/user/avatar-5.jpg',
      title: 'Ashton end membership planing',
      date: 'Yesterday | 6:30 PM'
    },
    {
      image: 'assets/images/user/avatar-2.jpg',
      title: 'Airi canceled in 2 months membership',
      date: '05 Feb | 1:45 PM'
    },
    {
      image: 'assets/images/user/avatar-3.jpg',
      title: 'Colleen join Addicted membership',
      date: '05 Feb | 2:45 PM'
    },
    {
      image: 'assets/images/user/avatar-4.jpg',
      title: 'Airi canceled in 2 months membership',
      date: '05 Feb | 3:45 PM'
    },
    {
      image: 'assets/images/user/avatar-6.jpg',
      title: 'Airi canceled in 2 months membership',
      date: '05 Feb | 4:00 PM'
    }
  ];
}
