// Angular import
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';

// project import
import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';
import { MarketShareChartComponent } from 'src/app/theme/shared/components/apexchart/market-share-chart/market-share-chart.component';
import { ScrollbarComponent } from 'src/app/theme/shared/components/scrollbar/scrollbar.component';

export interface TableList {
  src: string;
  country: string;
  name: string;
  average: string;
}

export interface RevenueList {
  color: string;
  name: string;
  percentage: string;
}

export interface Tables {
  icon: string;
  value: string;
  ship: string;
}

export interface Cards {
  title: string;
  amount: string;
  text?: string;
  icon: string;
  color: string;
}

export interface Data {
  background: string;
  icons: string;
  value: string;
}

@Component({
  selector: 'app-analytics',
  imports: [CommonModule, ...SHARED_IMPORTS, MarketShareChartComponent, ScrollbarComponent],
  templateUrl: './analytics.component.html',
  styleUrl: './analytics.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AnalyticsComponent {
  // private Method
  tableList: TableList[] = [
    {
      src: 'assets/images/widget/GERMANY.jpg',
      country: 'Germany',
      name: 'Anjalina Jolly',
      average: '56.23%'
    },
    {
      src: 'assets/images/widget/USA.jpg',
      country: 'USA',
      name: 'John Deo',
      average: '25.23%'
    },
    {
      src: 'assets/images/widget/AUSTRALIA.jpg',
      country: 'Australia',
      name: 'Jenifer Vintage',
      average: '12.45%'
    },
    {
      src: 'assets/images/widget/UK.jpg',
      country: 'United Kingdom',
      name: 'Lori Moore',
      average: '8.65%'
    },
    {
      src: 'assets/images/widget/BRAZIL.jpg',
      country: 'Brazil',
      name: 'Allina D’croze',
      average: '3.56%'
    },
    {
      src: 'assets/images/widget/AUSTRALIA.jpg',
      country: 'Australia',
      name: 'Jenifer Vintage',
      average: '12.45%'
    },
    {
      src: 'assets/images/widget/USA.jpg',
      country: 'USA',
      name: 'John Deo',
      average: '25.23%'
    },
    {
      src: 'assets/images/widget/UK.jpg',
      country: 'United Kingdom',
      name: 'Lori Moore',
      average: '8.65%'
    }
  ];
  revenueList: RevenueList[] = [
    {
      color: 'text-success',
      name: 'Bitcoin',
      percentage: '+ $145.85'
    },
    {
      color: 'text-danger',
      name: 'Ethereum',
      percentage: '- $6.368'
    },
    {
      color: 'text-success',
      name: 'Ripple',
      percentage: '+ $458.63'
    },
    {
      color: 'text-danger',
      name: 'Neo',
      percentage: '- $5.631'
    },
    {
      color: 'text-danger',
      name: 'Bitcoin',
      percentage: '- $75.86'
    },
    {
      color: 'text-success',
      name: 'Ethereum',
      percentage: '+ $453.63'
    },
    {
      color: 'text-danger',
      name: 'Ripple',
      percentage: '+ $786.63'
    },
    {
      color: 'text-success',
      name: 'Neo',
      percentage: '+ $145.85'
    },
    {
      color: 'text-success',
      name: 'Bitcoin',
      percentage: '- $6.368'
    },
    {
      color: 'text-success',
      name: 'Ethereum',
      percentage: '+ $458.63'
    },
    {
      color: 'text-danger',
      name: 'Neo',
      percentage: '- $5.631'
    },
    {
      color: 'text-danger',
      name: 'Ripple',
      percentage: '+ $145.85'
    },
    {
      color: 'text-success',
      name: 'Bitcoin',
      percentage: '- $75.86'
    },
    {
      color: 'text-success',
      name: 'Bitcoin',
      percentage: '+ $453.63'
    },
    {
      color: 'text-danger',
      name: 'Ethereum',
      percentage: '+ $786.63'
    }
  ];
  rowTable: Tables[] = [
    {
      icon: 'filter_vintage',
      value: '3550',
      ship: 'Returns'
    },
    {
      icon: 'local_mall',
      value: '100%',
      ship: 'Order'
    }
  ];
  rowTable1: Tables[] = [
    {
      icon: 'share',
      value: '1000',
      ship: 'Shares'
    },
    {
      icon: 'router',
      value: '600',
      ship: 'Network'
    }
  ];
  cards: Cards[] = [
    {
      title: 'Revenue',
      amount: '$42,562',
      text: '$50,032 Last Month',
      icon: 'monetization_on',
      color: 'bg-secondary'
    },
    {
      title: 'Orders Received',
      amount: '486',
      text: '20% Increase',
      icon: 'account_circle',
      color: 'bg-primary'
    }
  ];
  dailyCard: Cards[] = [
    {
      title: 'Daily user',
      amount: '1,658',
      icon: 'account_circle',
      color: 'bg-secondary'
    },
    {
      title: 'Daily visitor',
      amount: '5,678',
      icon: 'description',
      color: 'bg-primary'
    }
  ];
  data: Data[] = [
    {
      background: 'bg-light-secondary',
      icons: 'ti ti-brand-facebook text-secondary',
      value: '+ 45.36%'
    },
    {
      background: 'bg-light-primary',
      icons: 'ti ti-brand-twitter text-primary',
      value: '- 50.69%'
    },
    {
      background: 'bg-light-danger',
      icons: 'ti ti-brand-youtube text-danger',
      value: '+ 16.85%'
    }
  ];
}
