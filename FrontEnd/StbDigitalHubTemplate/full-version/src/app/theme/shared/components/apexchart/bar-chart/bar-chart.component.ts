// angular import
import { ChangeDetectorRef, Component, effect, inject, ChangeDetectionStrategy } from '@angular/core';

// project import
import { SHARED_IMPORTS } from '../../../shared.module';
import { ConfigService } from '../../../service/config.service';

// third party
import { NgApexchartsModule, ApexOptions } from 'ng-apexcharts';

@Component({
  selector: 'app-bar-chart',
  imports: [NgApexchartsModule, ...SHARED_IMPORTS],
  templateUrl: './bar-chart.component.html',
  styleUrl: './bar-chart.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BarChartComponent {
  private configService = inject(ConfigService);
  private cdr = inject(ChangeDetectorRef);

  // public props
  chartOptions!: ApexOptions;

  // Constructor
  constructor() {
    this.chartOptions = {
      series: [
        {
          name: 'Investment',
          data: [35, 125, 35, 35, 35, 80, 35, 20, 35, 45, 15, 75]
        },
        {
          name: 'Loss',
          data: [35, 15, 15, 35, 65, 40, 80, 25, 15, 85, 25, 75]
        },
        {
          name: 'Profit',
          data: [35, 145, 35, 35, 20, 105, 100, 10, 65, 45, 30, 10]
        },
        {
          name: 'Maintenance',
          data: [0, 0, 75, 0, 0, 115, 0, 0, 0, 0, 150, 0]
        }
      ],
      dataLabels: {
        enabled: false
      },
      chart: {
        type: 'bar',
        height: 480,
        stacked: true,
        toolbar: {
          show: true
        },
        background: 'transparent'
      },
      colors: ['#e8f0f7', '#003d7a', '#1565c0', '#e3f2fd'],
      responsive: [
        {
          breakpoint: 480,
          options: {
            legend: {
              position: 'bottom',
              offsetX: -10,
              offsetY: 0
            }
          }
        }
      ],
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '50%'
        }
      },
      xaxis: {
        type: 'category',
        categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      },
      tooltip: {
        theme: 'light'
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
    let colors: string[] = ['#7ba3c9', '#002e5c', '#1565c0', '#e3f2fd'];
    switch (theme) {
      case 'preset-1':
        colors = ['#7ba3c9', '#002e5c', '#1565c0', '#e3f2fd'];
        break;
      case 'preset-2':
        colors = ['#b0bec5', '#587583', '#009688', '#e0f2f1'];
        break;
      case 'preset-3':
        colors = ['#b0b6c4', '#586580', '#ec407a', '#fde8ef'];
        break;
      case 'preset-4':
        colors = ['#8fbbbc', '#1b6f70', '#c77e23', '#f8f0e5'];
        break;
      case 'preset-5':
        colors = ['#8b9fa1', '#14383d', '#3fb0ac', '#e8f6f5'];
        break;
      case 'preset-6':
        colors = ['#8591a1', '#091f3c', '#2ca58d', '#e6f4f1'];
        break;
      case 'preset-7':
        colors = ['#9FA8DA', '#3949AB', '#3F51B5', '#E8EAF6'];
        break;
    }
    this.chartOptions = { ...this.chartOptions, colors };
  }

  private isDarkTheme(isDark: boolean) {
    const tooltip = { ...this.chartOptions.tooltip };
    const colors: string[] = isDark ? ['#7ba3c9', '#002e5c', '#90caf9', '#e3f2fd'] : ['#7ba3c9', '#002e5c', '#1565c0', '#e3f2fd'];
    tooltip.theme = isDark ? 'dark' : 'light';
    this.chartOptions = { ...this.chartOptions, tooltip, colors };
  }

  private rerenderChartOnContainerResize(isBoxLayout: boolean) {
    const chart = { ...this.chartOptions.chart };
    chart.redrawOnWindowResize = !isBoxLayout;
    this.chartOptions = { ...this.chartOptions, chart } as ApexOptions;
  }
}
