// angular import
import { ChangeDetectorRef, Component, OnInit, effect, input, inject, ChangeDetectionStrategy } from '@angular/core';

// project import
import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';
import { ConfigService } from 'src/app/theme/shared/service/config.service';

// third party
import { NgApexchartsModule, ApexOptions } from 'ng-apexcharts';

@Component({
  selector: 'app-support-bar-chart',
  imports: [...SHARED_IMPORTS, NgApexchartsModule],
  templateUrl: './support-bar-chart.component.html',
  styleUrl: './support-bar-chart.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SupportBarChartComponent implements OnInit {
  private configService = inject(ConfigService);
  private cdr = inject(ChangeDetectorRef);

  // public props
  chartOptions!: ApexOptions;
  themeRTL!: boolean;

  value = input.required<number>();
  typeRequest = input.required<string>();
  inputColor = input.required<string>();
  backgroundColor = input.required<string>();
  openValue = input.required<number>();
  runningValue = input.required<number>();
  solvedValue = input.required<number>();
  chartColor = input.required<string[]>();

  // constructor
  constructor() {
    effect(() => {
      this.isDarkTheme(this.configService.isDarkMode());
      this.themeDirection(this.configService.isRtl_layout());
      this.rerenderChartOnContainerResize(this.configService.isBox_container());
      this.cdr.detectChanges();
    });
  }

  // life cycle hook
  ngOnInit() {
    this.chartOptions = {
      chart: {
        type: 'area',
        height: 100,
        sparkline: {
          enabled: true
        }
      },
      dataLabels: {
        enabled: false
      },
      colors: this.chartColor(),
      stroke: {
        curve: 'smooth',
        width: 2
      },
      series: [
        {
          name: 'series1',
          data: [0, 20, 10, 45, 30, 55, 20, 30, 0]
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

        marker: {
          show: false
        }
      }
    };
  }

  // private methods
  private isDarkTheme(isDark: boolean) {
    const tooltipTheme = isDark === true ? 'dark' : 'light';
    const tooltip = { theme: tooltipTheme };
    this.chartOptions = { ...this.chartOptions, tooltip };
  }

  private themeDirection(isRtl: boolean) {
    this.themeRTL = isRtl;
  }

  private rerenderChartOnContainerResize(isBox: boolean) {
    const chart = { ...this.chartOptions.chart };
    chart.redrawOnWindowResize = !isBox;
    this.chartOptions = { ...this.chartOptions, chart } as ApexOptions;
  }
}
