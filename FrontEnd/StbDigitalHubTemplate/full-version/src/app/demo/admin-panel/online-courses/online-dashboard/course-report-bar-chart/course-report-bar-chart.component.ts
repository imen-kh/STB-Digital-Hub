import { ChangeDetectorRef, Component, OnInit, effect, inject, ChangeDetectionStrategy } from '@angular/core';

// project import
import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';
import { ConfigService } from 'src/app/theme/shared/service/config.service';

// third party
import { NgApexchartsModule, ApexOptions } from 'ng-apexcharts';

@Component({
  selector: 'app-course-report-bar-chart',
  imports: [...SHARED_IMPORTS, NgApexchartsModule],
  templateUrl: './course-report-bar-chart.component.html',
  styleUrl: './course-report-bar-chart.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CourseReportBarChartComponent implements OnInit {
  private configService = inject(ConfigService);
  private cdr = inject(ChangeDetectorRef);

  // public props
  chartOptions!: ApexOptions;
  themeColors = ['#003d7a', '#1565c0'];

  // constructor
  constructor() {
    effect(() => {
      this.isDarkTheme(this.configService.isDarkMode());
      this.updateThemeColor(this.configService.theme_color());
      this.rerenderChartOnContainerResize(this.configService.isBox_container());
      this.cdr.detectChanges();
    });
  }

  // lifecycle hooks
  ngOnInit(): void {
    this.chartOptions = {
      chart: {
        type: 'bar',
        height: 190,
        toolbar: {
          show: false
        }
      },
      plotOptions: {
        bar: {
          columnWidth: '50%',
          borderRadius: 3
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
      colors: this.themeColors,
      series: [
        {
          name: 'Net Profit',
          data: [180, 90, 135, 114, 120, 145, 180, 90]
        },
        {
          name: 'Revenue',
          data: [120, 45, 78, 150, 168, 99, 120, 45]
        }
      ],
      grid: {
        borderColor: '#00000010'
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
  private isDarkTheme(isDark: boolean) {
    const tooltip = { ...this.chartOptions.tooltip };
    tooltip.theme = isDark === true ? 'dark' : 'light';
    this.chartOptions = { ...this.chartOptions, tooltip };
  }

  private updateThemeColor(theme: string) {
    let themeColors: string[];
    switch (theme) {
      case 'preset-1':
      default:
        themeColors = ['#003d7a', '#1565c0'];
        break;
      case 'preset-2':
        themeColors = ['#607d8b', '#009688'];
        break;
      case 'preset-3':
        themeColors = ['#203461', '#ec407a'];
        break;
      case 'preset-4':
        themeColors = ['#16595a', '#c77e23'];
        break;
      case 'preset-5':
        themeColors = ['#173e43', '#3fb0ac'];
        break;
      case 'preset-6':
        themeColors = ['#0a2342', '#2ca58d'];
        break;
      case 'preset-7':
        themeColors = ['#3f51b5', '#3f51b5'];
        break;
    }
    this.chartOptions = { ...this.chartOptions, colors: themeColors };
  }

  private rerenderChartOnContainerResize(isBox: boolean) {
    const chart = { ...this.chartOptions.chart };
    chart.redrawOnWindowResize = !isBox;
    this.chartOptions = { ...this.chartOptions, chart } as ApexOptions;
  }
}
