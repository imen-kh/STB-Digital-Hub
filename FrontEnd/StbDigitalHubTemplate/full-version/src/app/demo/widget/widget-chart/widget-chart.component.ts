import { ChangeDetectorRef, Component, effect, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

// project import
import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';
import { ChartDB } from 'src/fake-data/chartData';
import { ConfigService } from 'src/app/theme/shared/service/config.service';
import { MarketShareChartComponent } from 'src/app/theme/shared/components/apexchart/market-share-chart/market-share-chart.component';
import { TotalValueChartComponent } from 'src/app/theme/shared/components/apexchart/total-value-chart/total-value-chart.component';
import { SparkChartComponent } from 'src/app/theme/shared/components/apexchart/spark-chart/spark-chart.component';
import { SaleChartComponent } from 'src/app/theme/shared/components/apexchart/sale-chart/sale-chart.component';

// third party
import { NgApexchartsModule, ApexOptions } from 'ng-apexcharts';

@Component({
  selector: 'app-widget-chart',
  imports: [
    CommonModule,
    ...SHARED_IMPORTS,
    NgApexchartsModule,
    MarketShareChartComponent,
    TotalValueChartComponent,
    SparkChartComponent,
    SaleChartComponent
  ],
  templateUrl: './widget-chart.component.html',
  styleUrl: './widget-chart.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WidgetChartComponent {
  private configService = inject(ConfigService);
  private cdr = inject(ChangeDetectorRef);

  // public props
  revenueChart: ApexOptions;
  conversionsChart: ApexOptions;
  seoChart: ApexOptions;
  ChartOptions_10: ApexOptions;
  ChartOptions_11: ApexOptions;
  ChartOptions_12: ApexOptions;
  ChartOptions_13: ApexOptions;
  // eslint-disable-next-line
  chartDB: any;

  accountChartColor = ['#1565c0', '#003d7a', '#f44336'];
  conversionColor = ['#1565c0'];
  seoColor = ['#003d7a'];

  // Constructor
  constructor() {
    this.chartDB = ChartDB;
    const { seoChart, conversionsChart, revenueChart, ChartOptions_10, ChartOptions_11, ChartOptions_12, ChartOptions_13 } = this.chartDB;
    this.seoChart = seoChart;
    this.conversionsChart = conversionsChart;
    this.revenueChart = revenueChart;
    this.ChartOptions_10 = ChartOptions_10;
    this.ChartOptions_11 = ChartOptions_11;
    this.ChartOptions_12 = ChartOptions_12;
    this.ChartOptions_13 = ChartOptions_13;
    effect(() => {
      this.updateThemeColor(this.configService.theme_color());
      this.isDarkTheme(this.configService.isDarkMode());
      this.rerenderChartOnContainerResize(this.configService.isBox_container());
      this.cdr.detectChanges();
    });
  }

  // private methods
  private updateThemeColor(theme: string) {
    switch (theme) {
      case 'preset-1':
        this.accountChartColor = ['#1565c0', '#f44336', '#003d7a'];
        this.conversionColor = ['#1565c0'];
        this.seoColor = ['#003d7a'];
        break;
      case 'preset-2':
        this.accountChartColor = ['#009688', '#d9534f', '#546e7a'];
        this.conversionColor = ['#009688'];
        this.seoColor = ['#607d8b'];
        break;
      case 'preset-3':
        this.accountChartColor = ['#ec407a', '#d9534f', '#1c2f59'];
        this.conversionColor = ['#ec407a'];
        this.seoColor = ['#203461'];
        break;
      case 'preset-4':
        this.accountChartColor = ['#c77e23', '#f44336', '#135152'];
        this.conversionColor = ['#c77e23'];
        this.seoColor = ['#16595a'];
        break;
      case 'preset-5':
        this.accountChartColor = ['#3fb0ac', '#f44336', '#14383d'];
        this.conversionColor = ['#3fb0ac'];
        this.seoColor = ['#173e43'];
        break;
      case 'preset-6':
        this.accountChartColor = ['#2ca58d', '#f44336', '#091f3c'];
        this.conversionColor = ['#2ca58d'];
        this.seoColor = ['#0a2342'];
        break;
      case 'preset-7':
        this.accountChartColor = ['#3f51b5', '#f44336', '#3949ab'];
        this.conversionColor = ['#3f51b5'];
        this.seoColor = ['#3f51b5'];
        break;
    }
  }

  private isDarkTheme(isDark: boolean) {
    const tooltipTheme = isDark === true ? 'dark' : 'light';
    const tooltip = { theme: tooltipTheme };
    this.conversionsChart = { ...this.conversionsChart, tooltip };
    this.seoChart = { ...this.seoChart, tooltip };
    this.ChartOptions_10 = { ...this.ChartOptions_10, tooltip };
    this.seoChart = { ...this.seoChart, tooltip };
    this.ChartOptions_11 = { ...this.ChartOptions_11, tooltip };
    this.ChartOptions_12 = { ...this.ChartOptions_12, tooltip };
  }

  private rerenderChartOnContainerResize(isBox: boolean) {
    const charts = [
      this.revenueChart,
      this.ChartOptions_13,
      this.seoChart,
      this.ChartOptions_10,
      this.ChartOptions_11,
      this.ChartOptions_12,
      this.conversionsChart
    ];
    charts.forEach((chart, index) => {
      const chartClone = { ...chart.chart };
      chartClone.redrawOnWindowResize = !isBox;
      charts[index] = { ...chart, chart: chartClone } as ApexOptions;
    });
    [
      this.revenueChart,
      this.ChartOptions_13,
      this.seoChart,
      this.ChartOptions_10,
      this.ChartOptions_11,
      this.ChartOptions_12,
      this.conversionsChart
    ] = charts;
  }

  // public method
  data = [
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

  social_media = [
    {
      title: 'Youtube',
      value: '+ 16.85%',
      color: 'text-secondary'
    },
    {
      title: 'Facebook',
      value: '+ 45.36%',
      color: 'text-danger'
    },
    {
      title: 'Twitter',
      value: '- 50.69%',
      color: 'text-primary'
    }
  ];

  data_device = [
    {
      icon: 'icon-monitor text-primary',
      value: '66.6%',
      increase_type: 'text-success',
      increase_icon: 'icon-arrow-up',
      change_value: '2%'
    },
    {
      icon: 'icon-tablet text-success',
      value: '29.7%',
      increase_type: 'text-danger',
      increase_icon: 'icon-arrow-down',
      change_value: '3%'
    },
    {
      icon: 'icon-smartphone text-danger',
      value: '32.8%',
      increase_type: 'text-success',
      increase_icon: 'icon-arrow-up',
      change_value: '8%'
    }
  ];
}
