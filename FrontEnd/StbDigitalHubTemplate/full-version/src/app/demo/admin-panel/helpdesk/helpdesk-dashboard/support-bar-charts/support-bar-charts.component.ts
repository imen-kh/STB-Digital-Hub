// angular import
import { ChangeDetectorRef, Component, OnInit, effect, inject, ChangeDetectionStrategy } from '@angular/core';

// project import
import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';
import { ConfigService } from 'src/app/theme/shared/service/config.service';

// third party
import { NgApexchartsModule, ApexOptions } from 'ng-apexcharts';

@Component({
  selector: 'app-support-bar-charts',
  imports: [...SHARED_IMPORTS, NgApexchartsModule],
  templateUrl: './support-bar-charts.component.html',
  styleUrl: './support-bar-charts.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SupportBarChartsComponent implements OnInit {
  private configService = inject(ConfigService);
  private cdr = inject(ChangeDetectorRef);

  // public props
  chartOptions!: ApexOptions;
  themeRTL!: boolean;

  // constructor
  constructor() {
    effect(() => {
      this.isDarkTheme(this.configService.isDarkMode());
      this.themeDirection(this.configService.isRtl_layout());
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
        height: 100,
        sparkline: {
          enabled: true
        }
      },
      dataLabels: {
        enabled: false
      },
      colors: ['#003d7a'],
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

  private updateThemeColor(theme: string) {
    let colors: string[];
    switch (theme) {
      case 'preset-1':
      default:
        colors = ['#003d7a'];
        break;
      case 'preset-2':
        colors = ['#607d8b'];
        break;
      case 'preset-3':
        colors = ['#203461'];
        break;
      case 'preset-4':
        colors = ['#16595a'];
        break;
      case 'preset-5':
        colors = ['#173e43'];
        break;
      case 'preset-6':
        colors = ['#0a2342'];
        break;
      case 'preset-7':
        colors = ['#3f51b5'];
        break;
    }
    this.chartOptions = { ...this.chartOptions, colors };
  }
}
