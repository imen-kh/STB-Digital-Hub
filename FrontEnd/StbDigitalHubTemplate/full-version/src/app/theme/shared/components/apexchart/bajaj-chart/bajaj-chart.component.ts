// angular import
import { ChangeDetectorRef, Component, effect, inject, ChangeDetectionStrategy } from '@angular/core';

// project import
import { SHARED_IMPORTS } from '../../../shared.module';
import { ConfigService } from '../../../service/config.service';

// third party
import { NgApexchartsModule, ApexOptions } from 'ng-apexcharts';

@Component({
  selector: 'app-bajaj-chart',
  imports: [...SHARED_IMPORTS, NgApexchartsModule],
  templateUrl: './bajaj-chart.component.html',
  styleUrl: './bajaj-chart.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BajajChartComponent {
  private configService = inject(ConfigService);
  private cdr = inject(ChangeDetectorRef);

  // public props
  chartOptions!: ApexOptions;

  // constructor
  constructor() {
    this.chartOptions = {
      chart: {
        type: 'area',
        height: 95,
        stacked: true,
        sparkline: {
          enabled: true
        },
        background: 'transparent'
      },
      stroke: {
        curve: 'smooth',
        width: 1
      },
      series: [
        {
          data: [0, 15, 10, 50, 30, 40, 25]
        }
      ],
      tooltip: {
        theme: 'light',
        fixed: {
          enabled: false
        },
        x: {
          show: false
        },
        y: {
          title: {
            formatter: () => 'Ticket '
          }
        },
        marker: {
          show: false
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
    let colors: string[];
    switch (theme) {
      case 'preset-1':
      default:
        colors = ['#1565c0'];
        break;
      case 'preset-2':
        colors = ['#009688'];
        break;
      case 'preset-3':
        colors = ['#ec407a'];
        break;
      case 'preset-4':
        colors = ['#c77e23'];
        break;
      case 'preset-5':
        colors = ['#3fb0ac'];
        break;
      case 'preset-6':
        colors = ['#2ca58d'];
        break;
      case 'preset-7':
        colors = ['#3F51B5'];
        break;
    }
    this.chartOptions = { ...this.chartOptions, colors };
  }

  private isDarkTheme(isDark: boolean) {
    const tooltip = { ...this.chartOptions.tooltip };
    tooltip.theme = isDark === true ? 'dark' : 'light';
    this.chartOptions = { ...this.chartOptions, tooltip };
  }

  private rerenderChartOnContainerResize(isBox: boolean) {
    const chart = { ...this.chartOptions.chart };
    chart.redrawOnWindowResize = !isBox;
    this.chartOptions = { ...this.chartOptions, chart } as ApexOptions;
  }
}
