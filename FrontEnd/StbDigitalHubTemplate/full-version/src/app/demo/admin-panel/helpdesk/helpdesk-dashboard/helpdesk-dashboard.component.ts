// angular import
import { Component } from '@angular/core';

// project import
import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';
import { SupportBarChartComponent } from './support-bar-chart/support-bar-chart.component';
import { SatisfactionChartComponent } from './satisfaction-chart/satisfaction-chart.component';
import { SupportBarChartsComponent } from './support-bar-charts/support-bar-charts.component';

@Component({
  selector: 'app-helpdesk-dashboard',
  imports: [...SHARED_IMPORTS, SupportBarChartComponent, SatisfactionChartComponent, SupportBarChartsComponent],
  templateUrl: './helpdesk-dashboard.component.html',
  styleUrl: './helpdesk-dashboard.component.scss'
})
export class HelpdeskDashboardComponent {
  // public method
  socialMedia = [
    {
      name: 'Facebook Source',
      color: 'primary',
      sourceList: [
        {
          title: 'Page Profile',
          value: 25
        },
        {
          title: 'Favorite',
          value: 85
        },
        {
          title: 'Like Story',
          value: 65
        }
      ]
    },
    {
      name: 'Twitter Source',
      color: 'danger',
      sourceList: [
        {
          title: 'Wall Profile',
          value: 85
        },
        {
          title: 'Favorite',
          value: 25
        },
        {
          title: 'Like Tweets',
          value: 65
        }
      ]
    }
  ];

  activityList = [
    {
      color: 'bg-light-primary text-primary',
      icon: 'icon-bell',
      title: 'You have 3 pending tasks.'
    },
    {
      color: 'bg-light-danger text-danger',
      icon: 'icon-shopping-cart',
      title: 'New order received'
    },
    {
      color: 'bg-light-success text-success',
      icon: 'icon-file-text',
      title: 'You have 3 pending tasks.'
    },
    {
      color: 'bg-light-warning text-warning',
      icon: 'icon-shopping-cart',
      title: 'New order received'
    },
    {
      color: 'bg-light-primary text-primary',
      icon: 'icon-bell',
      title: 'You have 3 pending tasks.'
    },
    {
      color: 'bg-light-danger text-danger',
      icon: 'icon-shopping-cart',
      title: 'New order received'
    }
  ];
}
