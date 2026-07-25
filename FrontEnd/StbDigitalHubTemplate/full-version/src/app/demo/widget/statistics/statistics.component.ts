// Angular import
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

// project import
import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';

@Component({
  selector: 'app-statistics',
  imports: [CommonModule, ...SHARED_IMPORTS],
  templateUrl: './statistics.component.html',
  styleUrl: './statistics.component.scss'
})
export class StatisticsComponent {
  // public method
  TaskList = [
    {
      earning: '$30200',
      name: 'All Earnings',
      icon: 'insert_chart',
      color: 'text-secondary'
    },
    {
      earning: '145',
      name: 'Task',
      icon: 'calendar_today',
      color: 'text-danger'
    },
    {
      earning: '290+',
      name: 'Page Views',
      icon: 'description',
      color: 'text-success'
    },
    {
      earning: '500',
      name: 'Downloads',
      icon: 'thumb_down',
      color: 'text-primary'
    }
  ];

  cardList = [
    {
      name: 'Revenue',
      total: '$42,562',
      expensive: '$50,032 Last Month',
      icon: 'monetization_on',
      color: 'bg-secondary'
    },
    {
      name: 'Orders Received',
      total: '486',
      expensive: '20% Increase',
      icon: 'account_circle',
      color: 'bg-primary'
    },
    {
      name: 'Total Sales',
      total: '1641',
      expensive: '$1,055 Revenue Generated',
      icon: 'local_mall',
      color: 'bg-danger'
    }
  ];

  cardList1 = [
    {
      name: 'Visitors',
      icon: 'account_circle',
      visitor: '6035',
      color: 'text-primary'
    },
    {
      name: 'Invoices',
      icon: 'description',
      visitor: '19',
      color: 'text-danger'
    },
    {
      name: 'Issues',
      icon: 'bug_report',
      visitor: '6035',
      color: 'text-warning'
    },
    {
      name: 'Projects',
      icon: 'folder_open',
      visitor: '95%',
      color: 'text-success'
    }
  ];

  userList = [
    {
      name: 'Last week',
      icon: 'account_circle',
      user: '2,672',
      text: "user's",
      bgcolor: 'bg-secondary',
      color: 'text-secondary'
    },
    {
      name: 'Total',
      icon: 'account_balance_wallet',
      user: '$6391',
      text: 'earning',
      bgcolor: 'bg-primary',
      color: 'text-primary'
    },
    {
      name: 'Today',
      icon: 'insert_emoticon',
      user: '9,276',
      text: 'visitors',
      bgcolor: 'bg-success',
      color: 'text-success'
    },
    {
      name: 'New',
      icon: 'shopping_cart',
      user: '3,619',
      text: 'order',
      bgcolor: 'bg-danger',
      color: 'text-danger'
    }
  ];

  subCardList = [
    {
      name: 'Total Subscription',
      icon: 'icon-arrow-down',
      color: 'text-danger',
      total: '7652',
      text: '48% From Last 24 Hours'
    },
    {
      name: 'Order Status',
      icon: 'icon-arrow-up',
      color: 'text-success',
      total: '6325',
      text: '36% From Last 6 Months'
    },
    {
      name: 'Unique Visitors',
      icon: 'icon-arrow-down',
      color: 'text-danger',
      total: '652',
      text: '436% From Last 6 Months'
    },
    {
      name: 'Monthly Earnings',
      icon: 'icon-arrow-up',
      color: 'text-success',
      total: '5963',
      text: '36% From Last 6 Months'
    }
  ];

  socialUser = [
    {
      name: 'Facebook Users',
      total: '1165 +',
      icon: 'fab fa-facebook',
      color: 'bg-secondary'
    },
    {
      name: 'Twitter Users',
      total: '780 +',
      icon: 'fab fa-twitter',
      color: 'bg-primary'
    },
    {
      name: 'Linked In Users',
      total: '998 +',
      icon: 'fab fa-linkedin-in',
      color: 'bg-dark'
    },
    {
      name: 'Youtube Videos',
      total: '650 +',
      icon: 'fab fa-youtube',
      color: 'bg-danger'
    }
  ];

  rangerSlider = [
    {
      name: 'Impressions',
      time: 'May 23 - June 01 (2018)',
      total: '1,563',
      icon: 'fas fa-eye bg-light-primary text-primary'
    },
    {
      name: 'Goal',
      time: 'May 28 - June 01 (2018)',
      total: '30,564',
      icon: 'fas fa-bullseye bg-light-success text-success'
    },
    {
      name: 'Impact',
      time: 'May 30 - June 01 (2018)',
      total: '42.6%',
      icon: 'fas fa-hand-paper bg-light-warning text-warning'
    }
  ];

  progressList = [
    {
      title: 'Published Project',
      value: '532',
      type: 'danger',
      progress: '25'
    },
    {
      title: 'Completed Task',
      value: '4,569',
      type: 'primary',
      progress: '65'
    },
    {
      title: 'Successfully Task',
      value: '89%',
      type: 'success',
      progress: '85'
    },
    {
      title: 'Ongoing Project',
      value: '365',
      type: 'warning',
      progress: '45'
    }
  ];

  subMenuList = [
    {
      name: 'Daily user',
      total: '1,658',
      icon: 'account_circle',
      bgcolor: 'bg-secondary'
    },
    {
      name: 'Daily Visitor',
      total: '5,678',
      icon: 'description',
      bgcolor: 'bg-primary'
    },
    {
      name: 'Last month visitor',
      total: '5,678',
      icon: 'emoji_events',
      bgcolor: 'bg-success'
    }
  ];

  subCartMenu = [
    {
      name: 'Shares',
      icon: 'share',
      total: '1000'
    },
    {
      name: 'Network',
      icon: 'router',
      total: '600'
    }
  ];

  subCartMenu2 = [
    {
      name: 'Returns',
      icon: 'filter_vintage',
      total: '3550'
    },
    {
      name: 'Order',
      icon: 'local_mall',
      total: '100%'
    }
  ];
}
