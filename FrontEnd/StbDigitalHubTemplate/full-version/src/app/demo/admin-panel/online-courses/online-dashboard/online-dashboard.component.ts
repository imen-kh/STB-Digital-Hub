// angular import
import { Component, ViewEncapsulation, inject } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';

// bootstrap import
import { NgbCalendar, NgbDateAdapter } from '@ng-bootstrap/ng-bootstrap';

// project import
import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';
import { StatisticsChartComponent } from '../../../../theme/shared/components/apexchart/statistics-chart/statistics-chart.component';
import { InvitesGoalChartComponent } from './invites-goal-chart/invites-goal-chart.component';
import { CourseReportBarChartComponent } from './course-report-bar-chart/course-report-bar-chart.component';
import { TotalRevenueLineChartComponent } from './total-revenue-line-chart/total-revenue-line-chart.component';
import { StudentStatesChartComponent } from './student-states-chart/student-states-chart.component';
import { ActivityLineChartComponent } from './activity-line-chart/activity-line-chart.component';
import { VisitorsBarChartComponent } from './visitors-bar-chart/visitors-bar-chart.component';
import { EarningCoursesLineChartComponent } from './earning-courses-line-chart/earning-courses-line-chart.component';
import { CourseStateChart } from './course-state-chart/course-state-chart';

export interface DashboardSummary {
  icon: string;
  background: string;
  title: string;
  value: string;
  percentage: string;
  color: string;
}

export interface Course {
  title: string;
  image: string;
}

export interface Query {
  image: string;
  title: string;
}

export interface UserActivity {
  id: string;
  image: string;
  name: string;
  rating: string;
  qualification: string;
}

export interface Notification {
  id: string;
  image: string;
  title: string;
  time: string;
}

export interface CourseState {
  name: string;
  teacher: string;
  rating: string;
  earning: string;
  sale: number;
}

@Component({
  selector: 'app-online-dashboard',
  imports: [
    ...SHARED_IMPORTS,
    NgOptimizedImage,
    StatisticsChartComponent,
    InvitesGoalChartComponent,
    CourseReportBarChartComponent,
    TotalRevenueLineChartComponent,
    StudentStatesChartComponent,
    ActivityLineChartComponent,
    VisitorsBarChartComponent,
    EarningCoursesLineChartComponent,
    CourseStateChart
  ],
  templateUrl: './online-dashboard.component.html',
  styleUrl: './online-dashboard.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class OnlineDashboardComponent {
  private ngbCalendar = inject(NgbCalendar);
  private dateAdapter = inject<NgbDateAdapter<string>>(NgbDateAdapter);

  // calender
  model1!: string;

  // public props
  readonly dashboardSummary: DashboardSummary[] = [
    {
      icon: 'ti ti-users',
      background: 'bg-light-secondary',
      title: 'New Students',
      value: '400+',
      percentage: '30.6%',
      color: 'text-success'
    },
    {
      icon: 'ti ti-notebook',
      background: 'bg-light-warning',
      title: 'Total Course',
      value: '520+',
      percentage: '30.6%',
      color: 'text-warning'
    },
    {
      icon: 'ti ti-eye',
      background: 'bg-light-success',
      title: 'New Visitor',
      value: '800+',
      percentage: '30.6%',
      color: 'text-success'
    },
    {
      icon: 'ti ti-credit-card',
      background: 'bg-light-danger',
      title: 'Total sale',
      value: '1065',
      percentage: '30.6%',
      color: 'text-danger'
    }
  ];

  readonly courseList: Course[] = [
    {
      title: 'Bootstrap 5 Beginner Course',
      image: 'assets/images/admin/img-bootstrap.svg'
    },
    {
      title: 'PHP Training Course',
      image: 'assets/images/admin/img-php.svg'
    },
    {
      title: 'UI/UX Training Course',
      image: 'assets/images/admin/img-ux.svg'
    },
    {
      title: 'Web Designing Course',
      image: 'assets/images/admin/img-web.svg'
    }
  ];

  readonly queriesList: Query[] = [
    {
      image: 'assets/images/user/avatar-2.jpg',
      title: 'Python $ Data Manage'
    },
    {
      image: 'assets/images/user/avatar-1.jpg',
      title: 'Website Error'
    },
    {
      image: 'assets/images/user/avatar-3.jpg',
      title: 'How to Illustrate'
    },
    {
      image: 'assets/images/user/avatar-4.jpg',
      title: 'PHP Learning'
    }
  ];

  readonly userActivity: UserActivity[] = [
    {
      id: 'user-1',
      image: 'assets/images/user/avatar-4.jpg',
      name: 'Airi Satou',
      rating: '5.0',
      qualification: 'Developer'
    },
    {
      id: 'user-2',
      image: 'assets/images/user/avatar-1.jpg',
      name: 'Ashton Cox',
      rating: '4.5',
      qualification: 'Junior Technical'
    },
    {
      id: 'user-3',
      image: 'assets/images/user/avatar-2.jpg',
      name: 'Bradley Greer',
      rating: '4.3',
      qualification: 'Sales Assistant'
    },
    {
      id: 'user-4',
      image: 'assets/images/user/avatar-3.jpg',
      name: 'Brielle Williamson',
      rating: '4.9',
      qualification: 'JavaScript Developer'
    },
    {
      id: 'user-5',
      image: 'assets/images/user/avatar-5.jpg',
      name: 'Airi Satou',
      rating: '5.0',
      qualification: 'Developer'
    }
  ];

  readonly trendingCourse: Course[] = [
    {
      image: 'assets/images/admin/img-bootstrap.svg',
      title: 'Bootstrap 5 Beginner Course'
    },
    {
      image: 'assets/images/admin/img-php.svg',
      title: 'PHP Training Course'
    },
    {
      image: 'assets/images/admin/img-ux.svg',
      title: 'UI/UX Training Course'
    },
    {
      image: 'assets/images/admin/img-web.svg',
      title: 'Web Designing Course'
    },
    {
      image: 'assets/images/admin/img-c.svg',
      title: 'C Training Course'
    }
  ];

  readonly notificationList: Notification[] = [
    {
      id: 'notification-1',
      image: 'assets/images/user/avatar-1.jpg',
      title: 'Report Successfully',
      time: 'Today | 9:00 AM'
    },
    {
      id: 'notification-2',
      image: 'assets/images/user/avatar-5.jpg',
      title: 'Reminder: Test time',
      time: 'Yesterday | 6:30 PM'
    },
    {
      id: 'notification-3',
      image: 'assets/images/user/avatar-3.jpg',
      title: 'Send course pdf',
      time: '05 Feb | 3:45 PM'
    },
    {
      id: 'notification-4',
      image: 'assets/images/user/avatar-2.jpg',
      title: 'Report Successfully',
      time: '05 Feb | 4:00 PM'
    }
  ];

  readonly courseStates: CourseState[] = [
    {
      name: 'Web Designing Course',
      teacher: 'Airi Satou',
      rating: '4.8',
      earning: '$200',
      sale: 75
    },
    {
      name: 'UI/UX Training Course',
      teacher: 'Ashton Cox',
      rating: '5.0',
      earning: '$100',
      sale: 60
    },
    {
      name: 'PHP Training Course',
      teacher: '	Bradley Greer',
      rating: '4.9',
      earning: '$80',
      sale: 30
    },
    {
      name: 'Bootstrap 5 Course',
      teacher: 'Brielle Williamson',
      rating: '4.4',
      earning: '$150',
      sale: 90
    },
    {
      name: 'C Training Course',
      teacher: 'Cedric Kelly',
      rating: '4.3',
      earning: '$50',
      sale: 40
    }
  ];

  get today() {
    return this.dateAdapter.toModel(this.ngbCalendar.getToday())!;
  }
}
