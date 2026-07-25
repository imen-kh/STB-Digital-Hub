// angular project
import { Component, OnInit, effect, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';

// project import
import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';
import { ConfigService } from 'src/app/theme/shared/service/config.service';

// third party
import { NgApexchartsModule, ApexOptions, ApexAxisChartSeries } from 'ng-apexcharts';

@Component({
  selector: 'app-earning-courses-line-chart',
  imports: [...SHARED_IMPORTS, NgApexchartsModule],
  templateUrl: './earning-courses-line-chart.component.html',
  styleUrl: './earning-courses-line-chart.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EarningCoursesLineChartComponent implements OnInit {
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
  ngOnInit() {
    this.chartOptions = {
      chart: {
        type: 'line',
        height: 230,
        toolbar: {
          show: false
        }
      },
      colors: ['#FFC107', '#4680ff'],
      dataLabels: {
        enabled: false
      },
      markers: {
        size: 1,
        colors: ['#fff', '#fff', '#fff'],
        strokeColors: ['#FFC107', '#4680ff'],
        strokeWidth: 1,
        shape: 'circle',
        hover: {
          size: 4
        }
      },
      stroke: {
        width: 3
      },
      grid: {
        strokeDashArray: 4
      },
      series: [
        {
          name: 'Today',
          data: [200, 320, 275, 400, 300, 440]
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
      }
    };
  }

  // private methods
  private isDarkTheme(isDark: boolean) {
    const tooltipTheme = isDark === true ? 'dark' : 'light';
    const tooltip = { theme: tooltipTheme };
    const grid = { ...this.chartOptions.grid };
    grid.borderColor = isDark === true ? '#fafafa0d' : '#f5f5f5';
    this.chartOptions = { ...this.chartOptions, tooltip, grid };
  }

  private rerenderChartOnContainerResize(isBox: boolean) {
    const chart = { ...this.chartOptions.chart };
    chart.redrawOnWindowResize = !isBox;
    this.chartOptions = { ...this.chartOptions, chart } as ApexOptions;
  }

  onOptionSelected() {
    let series: ApexAxisChartSeries = [];
    switch (this.selectType) {
      case 'today':
        series = [
          {
            name: 'Today',
            data: [200, 320, 275, 400, 300, 440]
          }
        ];
        break;
      case 'week':
        series = [
          {
            name: 'Week',
            data: [750, 550, 650, 450, 500, 350]
          }
        ];
        break;
      case 'month':
        series = [
          {
            name: 'Month',
            data: [500, 700, 300, 600, 200, 400]
          }
        ];
        break;
    }
    this.chartOptions = { ...this.chartOptions, series };
    this.cdr.markForCheck();
  }
}
