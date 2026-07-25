// angular import
import { ChangeDetectorRef, Component, OnInit, effect, inject, ChangeDetectionStrategy } from '@angular/core';

// project import
import { SHARED_IMPORTS } from '../../../shared.module';
import { ConfigService } from '../../../service/config.service';

// third party
import { NgApexchartsModule, ApexOptions } from 'ng-apexcharts';

@Component({
  selector: 'app-chart-data-month',
  imports: [...SHARED_IMPORTS, NgApexchartsModule],
  templateUrl: './chart-data-month.component.html',
  styleUrl: './chart-data-month.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChartDataMonthComponent implements OnInit {
  private configService = inject(ConfigService);
  private cdr = inject(ChangeDetectorRef);

  // public props
  chartOptions!: ApexOptions;
  amount: number = 961;
  btnActive!: string;

  // constructor
  constructor() {
    effect(() => {
      this.rerenderChartOnContainerResize(this.configService.isBox_container());
      this.isDarkTheme(this.configService.isDarkMode());
      this.cdr.detectChanges();
    });
  }

  // life cycle event
  ngOnInit() {
    this.btnActive = 'year';
    this.chartOptions = {
      chart: {
        type: 'line',
        height: 90,
        sparkline: {
          enabled: true
        }
      },
      dataLabels: {
        enabled: false
      },
      colors: ['#FFF'],
      stroke: {
        curve: 'smooth',
        width: 3
      },
      series: [
        {
          name: 'series1',
          data: [35, 44, 9, 54, 45, 66, 41, 69]
        }
      ],
      yaxis: {
        min: 5,
        max: 95
      },
      tooltip: {
        theme: 'light',
        fixed: {
          enabled: false
        },
        x: {
          show: false
        },
        marker: {
          show: false
        }
      }
    };
  }

  // public method
  toggleActive(value: string) {
    this.btnActive = value;
    this.chartOptions.series = [
      {
        name: 'series1',
        data: value === 'month' ? [45, 66, 41, 89, 25, 44, 9, 54] : [35, 44, 9, 54, 45, 66, 41, 69]
      }
    ];
    this.amount = value === 'month' ? 108 : 961;
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
