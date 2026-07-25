// angular import
import { Component, OnInit, effect, input, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';

// project import
import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';
import { ConfigService } from 'src/app/theme/shared/service/config.service';

// apexChart
import { NgApexchartsModule, ApexOptions } from 'ng-apexcharts';

@Component({
  selector: 'app-statistics-chart',
  imports: [...SHARED_IMPORTS, NgApexchartsModule],
  templateUrl: './statistics-chart.component.html',
  styleUrl: './statistics-chart.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StatisticsChartComponent implements OnInit {
  private configService = inject(ConfigService);
  private cdr = inject(ChangeDetectorRef);

  // public props
  chartOptions!: ApexOptions;
  selectType: string = 'today';
  height = input.required<number>();

  // constructor
  constructor() {
    effect(() => {
      this.isDarkTheme(this.configService.isDarkMode());
      this.updateThemeColor(this.configService.theme_color());
      this.rerenderChartOnContainerResize(this.configService.isBox_container());
      this.cdr.detectChanges();
    });
  }

  // life cycle hook
  ngOnInit() {
    this.chartOptions = {
      chart: {
        type: 'area',
        height: this.height(),
        toolbar: {
          show: false
        }
      },
      colors: ['#FFC107', '#003d7a'],
      dataLabels: {
        enabled: false
      },
      legend: {
        show: true,
        position: 'top'
      },
      markers: {
        size: 1,
        colors: ['#fff', '#fff', '#fff'],
        strokeColors: ['#003d7a', '#1565c0'],
        strokeWidth: 1,
        shape: 'circle',
        hover: {
          size: 4
        }
      },
      stroke: {
        width: 2,
        curve: 'smooth'
      },
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          type: 'vertical',
          inverseColors: false,
          opacityFrom: 0.5,
          opacityTo: 0
        }
      },
      grid: {
        strokeDashArray: 4,
        borderColor: '#f5f5f5'
      },
      series: [
        {
          name: 'Revenue',
          data: [200, 320, 320, 275, 275, 400, 400, 300, 440, 320, 320, 275, 275, 400, 300, 440]
        },
        {
          name: 'Sales',
          data: [200, 250, 240, 300, 340, 320, 320, 400, 350, 250, 240, 300, 340, 320, 400, 350]
        }
      ],
      xaxis: {
        tooltip: {
          enabled: false
        },
        labels: {
          hideOverlappingLabels: true
        },
        axisBorder: {
          show: false
        },
        axisTicks: {
          show: false
        }
      }
    };
  }

  // private methods
  private isDarkTheme(isDark: boolean) {
    const tooltipTheme = isDark === true ? 'dark' : 'light';
    const tooltip = { theme: tooltipTheme };
    const grid = { ...this.chartOptions.grid };
    grid.borderColor = isDark === true ? '#fafafa0d' : '#eef2f6';
    this.chartOptions = { ...this.chartOptions, tooltip, grid };
  }

  private rerenderChartOnContainerResize(isBox: boolean) {
    const chart = { ...this.chartOptions.chart };
    chart.redrawOnWindowResize = !isBox;
    this.chartOptions = { ...this.chartOptions, chart } as ApexOptions;
  }

  private updateThemeColor(theme: string) {
    switch (theme) {
      case 'preset-1':
      default:
        this.chartOptions.colors = ['#003d7a', '#1565c0'];
        this.chartOptions.markers!.strokeColors = ['#003d7a', '#1565c0'];
        break;
      case 'preset-2':
        this.chartOptions.colors = ['#607d8b', '#009688'];
        this.chartOptions.markers!.strokeColors = ['#607d8b', '#009688'];
        break;
      case 'preset-3':
        this.chartOptions.colors = ['#203461', '#ec407a'];
        this.chartOptions.markers!.strokeColors = ['#203461', '#ec407a'];
        break;
      case 'preset-4':
        this.chartOptions.colors = ['#16595a', '#c77e23'];
        this.chartOptions.markers!.strokeColors = ['#16595a', '#c77e23'];
        break;
      case 'preset-5':
        this.chartOptions.colors = ['#173e43', '#3fb0ac'];
        this.chartOptions.markers!.strokeColors = ['#173e43', '#3fb0ac'];
        break;
      case 'preset-6':
        this.chartOptions.colors = ['#0a2342', '#2ca58d'];
        this.chartOptions.markers!.strokeColors = ['#0a2342', '#2ca58d'];
        break;
      case 'preset-7':
        this.chartOptions.colors = ['#3f51b5', '#3f51b5'];
        this.chartOptions.markers!.strokeColors = ['#3f51b5', '#3f51b5'];
        break;
    }
  }

  // public methods
  onOptionSelected() {
    switch (this.selectType) {
      case 'today':
        this.chartOptions.series = [
          {
            name: 'Revenue',
            data: [200, 320, 320, 275, 275, 400, 400, 300, 440, 320, 320, 275, 275, 400, 300, 440]
          },
          {
            name: 'Sales',
            data: [200, 250, 240, 300, 340, 320, 320, 400, 350, 250, 240, 300, 340, 320, 400, 350]
          }
        ];
        break;
      case 'week':
        this.chartOptions.series = [
          {
            name: 'Revenue',
            data: [350, 400, 320, 340, 300, 240, 250, 350, 400, 320, 320, 340, 300, 240, 200, 440]
          },
          {
            name: 'Sales',
            data: [440, 300, 400, 275, 275, 320, 320, 440, 300, 400, 275, 275, 320, 320, 200, 300]
          }
        ];
        break;
      case 'month':
        this.chartOptions.series = [
          {
            name: 'Revenue',
            data: [200, 320, 320, 275, 275, 400, 400, 300, 440, 320, 320, 275, 275, 400, 300, 440]
          },
          {
            name: 'Sales',
            data: [200, 250, 240, 300, 340, 320, 320, 400, 350, 250, 240, 300, 340, 320, 400, 350]
          }
        ];
        break;
    }
    this.cdr.markForCheck();
  }
}
