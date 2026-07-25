// angular import
import { Component } from '@angular/core';

// project import
import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';
import { InvoiceListChartComponent } from './invoice-list-chart/invoice-list-chart.component';
import { InvoiceListTableComponent } from './invoice-list-table/invoice-list-table.component';

export interface WidgetCard {
  title: string;
  isLoss: boolean;
  value: string;
  percentage: number;
  color: string;
  invoice: string;
  data: number[];
  colors: string[];
}

@Component({
  selector: 'app-invoice-list',
  imports: [...SHARED_IMPORTS, InvoiceListChartComponent, InvoiceListTableComponent],
  templateUrl: './invoice-list.component.html',
  styleUrl: './invoice-list.component.scss'
})
export class InvoiceListComponent {
  // public method
  widgetCards: WidgetCard[] = [
    {
      title: 'Paid',
      isLoss: false,
      value: '$7,825',
      percentage: 70.5,
      color: 'text-success',
      invoice: '9',
      data: [0, 20, 10, 45, 30, 55, 20, 30],
      colors: ['#52c41a']
    },
    {
      title: 'Unpaid',
      isLoss: true,
      value: '$1,880',
      percentage: 27.4,
      color: 'text-warning',
      invoice: '6',
      data: [30, 20, 55, 30, 45, 10, 20, 0],
      colors: ['#faad14']
    },
    {
      title: 'Overdue',
      isLoss: true,
      value: '$3,507',
      percentage: 27.4,
      color: 'text-danger',
      invoice: '4',
      data: [0, 20, 10, 45, 30, 55, 20, 30],
      colors: ['#ff4d4f']
    }
  ];
}
