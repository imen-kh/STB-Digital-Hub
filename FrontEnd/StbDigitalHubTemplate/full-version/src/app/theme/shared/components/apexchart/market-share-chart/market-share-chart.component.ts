// angular import
import { ChangeDetectorRef, Component, effect, inject, ChangeDetectionStrategy } from '@angular/core';

// project import
import { SHARED_IMPORTS } from '../../../shared.module';
import { ConfigService } from '../../../service/config.service';

// third party
import { NgApexchartsModule, ApexOptions } from 'ng-apexcharts';

@Component({
  selector: 'app-market-share-chart',
  imports: [...SHARED_IMPORTS, NgApexchartsModule],
  templateUrl: './market-share-chart.component.html',
  styleUrl: './market-share-chart.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MarketShareChartComponent {
  private configService = inject(ConfigService);
  private cdr = inject(ChangeDetectorRef);

  // public props
  chartOptions!: ApexOptions;
  ChartOptionsColor = ['#1565c0', '#003d7a', '#f44336'];

  // Constructor
  constructor() {
    this.chartOptions = {
      chart: {
        type: 'area',
        height: 215,
        sparkline: {
          enabled: true
        },
        background: 'transparent'
      },
      stroke: {
        curve: 'smooth',
        width: 2
      },
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.5,
          opacityTo: 0
        }
      },
      series: [
        {
          name: 'Facebook',
          data: [10, 90, 65, 85, 40, 80, 30]
        },
        {
          name: 'Youtube',
          data: [50, 30, 25, 15, 60, 10, 25]
        },
        {
          name: 'Twitter',
          data: [5, 50, 40, 55, 20, 40, 20]
        }
      ],
      tooltip: {
        theme: 'light',
        fixed: {
          enabled: false
        },
        x: {
          show: true
        },
        marker: {
          show: true
        }
      }
    };

    effect(() => {
      this.updateThemeColor(this.configService.theme_color());
      this.rerenderChartOnContainerResize(this.configService.isBox_container());
      this.isDarkTheme(this.configService.isDarkMode());
      this.cdr.detectChanges();
    });
  }

  // private methods
  private updateThemeColor(theme: string) {
    let ChartOptionsColor: string[];
    switch (theme) {
      case 'preset-1':
      default:
        ChartOptionsColor = ['#1565c0', '#f44336', '#003d7a'];
        break;
      case 'preset-2':
        ChartOptionsColor = ['#009688', '#d9534f', '#546e7a'];
        break;
      case 'preset-3':
        ChartOptionsColor = ['#ec407a', '#d9534f', '#1c2f59'];
        break;
      case 'preset-4':
        ChartOptionsColor = ['#c77e23', '#f44336', '#135152'];
        break;
      case 'preset-5':
        ChartOptionsColor = ['#3fb0ac', '#f44336', '#14383d'];
        break;
      case 'preset-6':
        ChartOptionsColor = ['#2ca58d', '#f44336', '#091f3c'];
        break;
      case 'preset-7':
        ChartOptionsColor = ['#3f51b5', '#f44336', '#3949ab'];
        break;
    }
    this.chartOptions = { ...this.chartOptions, colors: ChartOptionsColor };
  }

  private isDarkTheme(isDark: boolean) {
    const tooltip = { ...this.chartOptions.tooltip };
    tooltip.theme = isDark ? 'dark' : 'light';
    this.chartOptions = { ...this.chartOptions, tooltip };
  }

  private rerenderChartOnContainerResize(isBox: boolean) {
    const chart = { ...this.chartOptions.chart };
    chart.redrawOnWindowResize = !isBox;
    this.chartOptions = { ...this.chartOptions, chart } as ApexOptions;
  }
}
