// angular import
import { Component, OnInit, effect, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';

// project import
import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';
import { ConfigService } from 'src/app/theme/shared/service/config.service';

// third party
import { NgApexchartsModule, ApexOptions, ApexAxisChartSeries } from 'ng-apexcharts';

@Component({
  selector: 'app-cash-flow-chart',
  imports: [...SHARED_IMPORTS, NgApexchartsModule],
  templateUrl: './cash-flow-chart.component.html',
  styleUrl: './cash-flow-chart.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CashFlowChartComponent implements OnInit {
  private configService = inject(ConfigService);
  private cdr = inject(ChangeDetectorRef);

  // public props
  chartOptions!: ApexOptions;
  selectType = 'month';

  // constructor
  constructor() {
    effect(() => {
      this.updateThemeColor(this.configService.theme_color());
      this.isDarkTheme(this.configService.isDarkMode());
      this.rerenderChartOnContainerResize(this.configService.isBox_container());
      this.cdr.detectChanges();
    });
  }

  // life cycle hook
  ngOnInit() {
    this.chartOptions = {
      chart: {
        type: 'bar',
        height: 225,
        toolbar: {
          show: false
        }
      },
      plotOptions: {
        bar: {
          columnWidth: '70%',
          borderRadius: 2
        }
      },
      stroke: {
        show: true,
        width: 3,
        colors: ['transparent']
      },
      dataLabels: {
        enabled: false
      },
      legend: {
        position: 'top',
        horizontalAlign: 'right',
        show: true,
        fontFamily: `'Public Sans', sans-serif`,
        offsetX: 10,
        offsetY: 10,
        labels: {
          useSeriesColors: false
        },
        markers: {
          offsetX: 2,
          offsetY: 2
        },
        itemMargin: {
          horizontal: 15,
          vertical: 5
        }
      },
      colors: ['#1565c0', '#90caf9'],
      series: [
        {
          name: 'Income',
          data: [180, 90, 135, 114, 120, 145, 180, 90]
        },
        {
          name: 'Expends',
          data: [120, 45, 78, 150, 168, 99, 120, 45]
        }
      ],
      grid: {
        show: true,
        borderColor: '#f0f0f0'
      },
      yaxis: {
        show: true
      },
      xaxis: {
        categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug']
      },
      tooltip: {
        theme: 'light',
        y: {
          formatter: function (val) {
            return '$ ' + val;
          }
        }
      }
    };
  }

  // private methods
  private updateThemeColor(theme: string) {
    let colors: string[];
    switch (theme) {
      case 'preset-1':
      default:
        colors = ['#1565c0', '#90caf9'];
        break;
      case 'preset-2':
        colors = ['#009688', '#009688'];
        break;
      case 'preset-3':
        colors = ['#ec407a', '#ec407a'];
        break;
      case 'preset-4':
        colors = ['#c77e23', '#c77e23'];
        break;
      case 'preset-5':
        colors = ['#3fb0ac', '#3fb0ac'];
        break;
      case 'preset-6':
        colors = ['#2ca58d', '#2ca58d'];
        break;
      case 'preset-7':
        colors = ['#3f51b5', '#3f51b5'];
        break;
    }
    this.chartOptions = { ...this.chartOptions, colors };
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

  // public methods
  onOptionSelected() {
    let series: ApexAxisChartSeries = [];
    switch (this.selectType) {
      case 'today':
        series = [
          {
            name: 'Income',
            data: [90, 135, 114, 120, 145, 180, 180, 90, 145, 180, 90, 135]
          },
          {
            name: 'Expends',
            data: [150, 168, 99, 120, 45, 78, 150, 168, 78, 150, 168, 99]
          }
        ];
        break;
      case 'week':
        series = [
          {
            name: 'Income',
            data: [145, 180, 90, 114, 120, 145, 114, 120, 145, 114, 120, 145]
          },
          {
            name: 'Expends',
            data: [150, 168, 99, 150, 120, 45, 78, 45, 78, 150, 168, 99]
          }
        ];
        break;
      case 'month':
        series = [
          {
            name: 'Income',
            data: [180, 90, 135, 114, 120, 145, 180, 90, 135, 114, 120, 145]
          },
          {
            name: 'Expends',
            data: [120, 45, 78, 150, 168, 99, 120, 45, 78, 150, 168, 99]
          }
        ];
        break;
    }
    this.chartOptions = { ...this.chartOptions, series };
    this.cdr.markForCheck();
  }
}
