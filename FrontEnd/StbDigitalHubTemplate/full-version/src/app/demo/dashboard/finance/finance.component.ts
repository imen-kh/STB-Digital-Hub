// Angular import
import { Component, effect, inject } from '@angular/core';

// project import
import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';
import { TransactionsChartComponent } from './transactions-chart/transactions-chart.component';
import { CashFlowChartComponent } from './cash-flow-chart/cash-flow-chart.component';
import { ConfigService } from 'src/app/theme/shared/service/config.service';
import { CategoryChartComponent } from './category-chart/category-chart.component';

@Component({
  selector: 'app-finance',
  imports: [...SHARED_IMPORTS, TransactionsChartComponent, CashFlowChartComponent, CategoryChartComponent],
  templateUrl: './finance.component.html',
  styleUrl: './finance.component.scss'
})
export class FinanceComponent {
  private configService = inject(ConfigService);

  // public props
  backgroundColor!: string;

  // constructor
  constructor() {
    effect(() => {
      this.isDarkTheme(this.configService.isDarkMode());
    });
  }

  // private methods
  private isDarkTheme(isDark: boolean) {
    this.backgroundColor = isDark ? 'bg-gray-800' : 'bg-gray-200';
  }

  // public methods
  transactionsList = [
    {
      icon: 'AI',
      title: 'Apple Inc.',
      description: '#ABLE-PRO-T00232',
      amount: '$210,000',
      progress: 'ti ti-arrow-down-left',
      status_color: 'text-danger',
      percentage: 10.6
    },
    {
      icon: 'SM',
      title: 'Spotify Music',
      description: '#ABLE-PRO-T10232',
      amount: '- 10,000',
      progress: 'ti ti-arrow-up-right',
      status_color: 'text-success',
      percentage: 30.6
    },
    {
      icon: 'MD',
      background: 'bg-light-primary',
      title: 'Medium',
      description: '06:30 pm',
      amount: '- 26',
      progress: 'ti ti-arrows-left-right',
      status_color: 'text-warning',
      percentage: 5
    },
    {
      icon: 'U',
      title: 'Uber',
      description: '08:40 pm',
      amount: '+210,000',
      progress: 'ti ti-arrow-up-right',
      status_color: 'text-success',
      percentage: 10.6
    },
    {
      icon: 'OC',
      background: 'bg-light-warning',
      title: 'Ola Cabs',
      description: '07:40 pm',
      amount: '+210,000',
      progress: 'ti ti-arrow-up-right',
      status_color: 'text-success',
      percentage: 10.6
    }
  ];

  moneyGoList = [
    {
      image: 'assets/images/widget/img-food.png',
      title: 'Food & Drink',
      progress: 65,
      total: '$1000'
    },
    {
      image: 'assets/images/widget/img-travel.png',
      title: 'Travel',
      progress: 30,
      total: '$400'
    },
    {
      image: 'assets/images/widget/img-shopping.png',
      title: 'Shopping',
      progress: 52,
      total: '$900'
    },
    {
      image: 'assets/images/widget/img-health.png',
      title: 'Healthcare',
      progress: 26,
      total: '$250'
    }
  ];

  recentTransfer = [
    {
      amount: '-$750.00',
      color: 'text-danger',
      name: 'Starbucks Coffee',
      date: 'yesterday',
      image: 'assets/images/widget/img-acitivity-3.svg'
    },
    {
      amount: '-$26.00',
      color: 'text-danger',
      name: 'Liberty Trading',
      date: '10:40 AM',
      image: 'assets/images/widget/liberty.svg',
      imgdark: true
    },
    {
      amount: '-29.00',
      color: 'text-danger',
      name: 'Croma',
      date: '05:41 PM',
      image: 'assets/images/widget/croma.svg'
    }
  ];

  accountCardList = [
    {
      image: 'assets/images/widget/img-card-1.png',
      addNewCard: false
    },
    {
      image: 'assets/images/widget/img-card-2.png',
      addNewCard: false
    },
    {
      addNewCard: true
    }
  ];

  userList = [
    {
      newUserAdd: true
    },
    {
      newUserAdd: false,
      image: 'assets/images/user/avatar-1.jpg'
    },
    {
      newUserAdd: false,
      image: 'assets/images/user/avatar-2.jpg'
    },
    {
      newUserAdd: false,
      image: 'assets/images/user/avatar-3.jpg'
    },
    {
      newUserAdd: false,
      image: 'assets/images/user/avatar-4.jpg'
    }
  ];

  transactionsHistoryList = [
    {
      image: 'assets/images/user/avatar-1.jpg',
      name: 'John lu',
      category: 'Salary Payment',
      date: '2023/02/07',
      time: '09:05 PM',
      amount: '$950.54',
      status: 'completed'
    },
    {
      image: 'assets/images/user/avatar-2.jpg',
      name: 'Ashton Cox',
      category: 'Project Payment',
      date: '2023/02/01',
      time: '02:14 PM',
      amount: '$520.30',
      status: 'completed'
    },
    {
      image: 'assets/images/user/avatar-3.jpg',
      name: 'Bradley Greer',
      category: 'You Tube Subscribe',
      date: '2023/01/22',
      time: '10:32 AM',
      amount: '$100.00',
      status: 'pending'
    },
    {
      image: 'assets/images/user/avatar-4.jpg',
      name: 'Brielle Williamson',
      category: 'Slary Payment',
      date: '2023/02/07',
      time: '09:05 PM',
      amount: '$760.25',
      status: 'progress'
    },
    {
      image: 'assets/images/user/avatar-5.jpg',
      name: 'Airi Satou',
      category: 'Spotify Subscribe',
      date: '2023/02/07',
      time: '09:05 PM',
      amount: '$60.05',
      status: 'canceled'
    }
  ];
}
