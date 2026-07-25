// angular import
import { Component, OnInit, effect, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';

// project import
import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';
import { ConfigService } from 'src/app/theme/shared/service/config.service';

// apexChart
import { NgApexchartsModule, ApexOptions, ApexAxisChartSeries } from 'ng-apexcharts';

@Component({
  selector: 'app-activity-chart',
  imports: [...SHARED_IMPORTS, NgApexchartsModule],
  templateUrl: './activity-chart.component.html',
  styleUrl: './activity-chart.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ActivityChartComponent implements OnInit {
  private configService = inject(ConfigService);
  private cdr = inject(ChangeDetectorRef);

  // public props
  chartOptions!: ApexOptions;
  selectType: string = 'today';

  // constructor
  constructor() {
    effect(() => {
      this.isDarkTheme(this.configService.isDarkMode());
      this.rerenderChartOnContainerResize(this.configService.isBox_container());
      this.cdr.detectChanges();
    });
  }

  // life cycle hook
  ngOnInit(): void {
    this.chartOptions = {
      chart: {
        type: 'line',
        height: 150,
        toolbar: {
          show: false
        }
      },
      colors: ['#00c853', '#B2EECB'],
      dataLabels: {
        enabled: false
      },
      legend: {
        show: true,
        position: 'top'
      },
      markers: {
        size: 1,
        colors: ['#fff', '#fff'],
        strokeColors: ['#00c853', '#B2EECB'],
        strokeWidth: 1,
        shape: 'circle',
        hover: {
          size: 4
        }
      },
      stroke: {
        width: 3,
        curve: 'smooth'
      },
      grid: {
        show: false
      },
      series: [
        {
          name: 'Active',
          data: [20, 90, 65, 85, 20, 80, 30]
        },
        {
          name: 'Inactive',
          data: [70, 30, 40, 15, 60, 40, 95]
        }
      ],
      xaxis: {
        labels: {
          hideOverlappingLabels: true
        },
        axisBorder: {
          show: false
        },
        axisTicks: {
          show: false
        }
      },
      tooltip: {
        theme: 'light'
      }
    };
  }

  // private methods
  private isDarkTheme(isDark: boolean) {
    const tooltipTheme = isDark === true ? 'dark' : 'light';
    const tooltip = { theme: tooltipTheme };
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
            name: 'Active',
            data: [20, 90, 65, 85, 20, 80, 30]
          },
          {
            name: 'Inactive',
            data: [70, 30, 40, 15, 60, 40, 95]
          }
        ];
        break;
      case 'month':
        series = [
          {
            name: 'Active',
            data: [70, 30, 40, 15, 60, 40, 95]
          },
          {
            name: 'Inactive',
            data: [20, 90, 65, 85, 20, 80, 30]
          }
        ];
        break;
      case 'week':
        series = [
          {
            name: 'Active',
            data: [20, 90, 15, 60, 40, 80, 30]
          },
          {
            name: 'Inactive',
            data: [70, 20, 90, 65, 60, 40, 95]
          }
        ];
        break;
    }
    this.chartOptions = { ...this.chartOptions, series };
    this.cdr.markForCheck();
  }
}
