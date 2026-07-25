import { ChangeDetectorRef, Component, effect, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';

// project import
import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';
import { ConfigService } from 'src/app/theme/shared/service/config.service';

// third party
import { NgApexchartsModule, ApexOptions } from 'ng-apexcharts';

@Component({
  selector: 'app-visitors-bar-chart',
  imports: [...SHARED_IMPORTS, NgApexchartsModule],
  templateUrl: './visitors-bar-chart.component.html',
  styleUrl: './visitors-bar-chart.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VisitorsBarChartComponent implements OnInit {
  private configService = inject(ConfigService);
  private cdr = inject(ChangeDetectorRef);

  // public props
  chartOptions!: ApexOptions;

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
        type: 'bar',
        height: 220,
        toolbar: {
          show: false
        }
      },
      colors: ['#00C853'],
      dataLabels: {
        enabled: false
      },
      grid: {
        strokeDashArray: 4
      },
      yaxis: {
        tickAmount: 3
      },
      states: {
        hover: {
          filter: {
            type: 'lighten'
          }
        }
      },
      plotOptions: {
        bar: {
          borderRadius: 2,
          columnWidth: '50%'
        }
      },
      labels: ['2018', '2019', '2020', '2021', '2022', '2023'],
      series: [
        {
          data: [20, 15, 22, 25, 32, 50]
        }
      ]
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
}
