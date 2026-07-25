// angular import
import { Component, HostListener, inject, signal, computed } from '@angular/core';

// project import
import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';
import { InvoiceChartComponent } from './invoice-chart/invoice-chart.component';
import { TotalExpensesChartComponent } from './total-expenses-chart/total-expenses-chart.component';
import { ConfigService } from 'src/app/theme/shared/service/config.service';

export interface InvoiceCard {
  title: string;
  icon: string;
  background: string;
}

export interface User {
  avatar: string;
  name: string;
  value: string;
  time: string;
}

export interface Notification {
  title: string;
  link: boolean;
  linkValue?: string;
  date: string;
  icon?: string;
  background: string;
  text: boolean;
}

@Component({
  selector: 'app-invoice-dashboard',
  imports: [...SHARED_IMPORTS, InvoiceChartComponent, TotalExpensesChartComponent],
  templateUrl: './invoice-dashboard.component.html',
  styleUrl: './invoice-dashboard.component.scss'
})
export class InvoiceDashboardComponent {
  private configService = inject(ConfigService);
  windowWidth = signal(window.innerWidth);

  dropdownPlacement = computed(() => {
    const isRtl = this.configService.isRtl_layout();
    if (isRtl) {
      return 'bottom-start';
    }
    return this.windowWidth() >= 1025 ? 'left' : 'bottom-end';
  });

  @HostListener('window:resize')
  onResize(): void {
    this.windowWidth.set(window.innerWidth);
  }

  // public method
  invoiceCard: InvoiceCard[] = [
    {
      title: 'All Invoices',
      icon: 'file-text',
      background: 'bg-primary'
    },
    {
      title: 'Reports',
      icon: 'report',
      background: 'bg-info'
    },
    {
      title: 'Paid',
      icon: 'coin-filled',
      background: 'bg-success'
    },
    {
      title: 'Pending',
      icon: 'hourglass',
      background: 'bg-warning'
    },
    {
      title: 'Cancelled',
      icon: 'circle-letter-x',
      background: 'bg-danger'
    },
    {
      title: 'Draft',
      icon: 'shopping-bag',
      background: 'bg-primary'
    }
  ];

  UserList: User[] = [
    {
      avatar: 'assets/images/user/avatar-10.jpg',
      name: 'David Jones',
      value: '$329.20',
      time: '5 min ago'
    },
    {
      avatar: 'assets/images/user/avatar-8.jpg',
      name: 'Jenny Jones',
      value: '$182.89',
      time: '1 day ago'
    },
    {
      avatar: 'assets/images/user/avatar-6.jpg',
      name: 'Harry Ben',
      value: '3 week ago',
      time: '5 min ago'
    },
    {
      avatar: 'assets/images/user/avatar-5.jpg',
      name: 'Jenifer Vintage',
      value: '$182.89',
      time: '3 week ago'
    },
    {
      avatar: 'assets/images/user/avatar-3.jpg',
      name: 'Stebin Ben',
      value: '3 week ago',
      time: '1 month ago'
    }
  ];

  notificationList: Notification[] = [
    {
      title: 'Johnny sent you an invoice billed',
      link: true,
      linkValue: '$1,000',
      date: '2 August',
      icon: 'download',
      background: 'bg-light-success',
      text: false
    },
    {
      title: 'Sent an invoice to Aida Bugg amount of',
      link: true,
      linkValue: '$200',
      date: '7 hours ago',
      icon: 'file-text',
      background: 'bg-light-primary',
      text: false
    },
    {
      title: 'Cristina danny invited to you join Meetingp',
      link: false,
      date: '6 hours ago',
      background: 'bg-light-warning',
      text: true
    },
    {
      title: 'There was a failure to your setup',
      link: false,
      date: '5 hours ago',
      icon: 'settings',
      background: 'bg-light-danger',
      text: false
    },
    {
      title: 'Cristina danny invited to you join Meetingp',
      link: false,
      date: '5 hours ago',
      background: 'bg-light-primary',
      text: true
    }
  ];
}
