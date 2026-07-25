// angular import
import { ChangeDetectorRef, Component, OnInit, effect, inject, ChangeDetectionStrategy } from '@angular/core';

// project import
import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';
import { ConfigService } from 'src/app/theme/shared/service/config.service';

// third party
import { NgApexchartsModule, ApexOptions } from 'ng-apexcharts';

// rxjs
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-satisfaction-chart',
  imports: [...SHARED_IMPORTS, NgApexchartsModule],
  templateUrl: './satisfaction-chart.component.html',
  styleUrl: './satisfaction-chart.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SatisfactionChartComponent implements OnInit {
  private configService = inject(ConfigService);
  private cdr = inject(ChangeDetectorRef);

  // public props
  chartOptions!: ApexOptions;
  themeSub = new Subscription();
  themeRTL!: boolean;

  // constructor
  constructor() {
    effect(() => {
      this.updateThemeColor(this.configService.theme_color());
      this.rerenderChartOnContainerResize(this.configService.isBox_container());
      this.cdr.detectChanges();
    });
  }

  // life cycle hook
  ngOnInit() {
    this.chartOptions = {
      chart: {
        height: 260,
        type: 'pie'
      },
      series: [66, 50, 40, 30],
      labels: ['Very Poor', 'Satisfied', 'Very Satisfied', 'Poor'],
      legend: {
        show: true,
        offsetY: 50
      },
      theme: {
        monochrome: {
          enabled: true,
          color: '#003d7a'
        }
      },
      responsive: [
        {
          breakpoint: 768,
          options: {
            chart: {
              height: 320
            },
            legend: {
              position: 'bottom',
              offsetY: 0
            }
          }
        }
      ]
    };
  }

  // private methods
  private updateThemeColor(theme: string) {
    const monochrome = { ...this.chartOptions.theme?.monochrome };
    switch (theme) {
      case 'preset-1':
      default:
        monochrome.color = '#003d7a';
        break;
      case 'preset-2':
        monochrome.color = '#607d8b';
        break;
      case 'preset-3':
        monochrome.color = '#203461';
        break;
      case 'preset-4':
        monochrome.color = '#16595a';
        break;
      case 'preset-5':
        monochrome.color = '#173e43';
        break;
      case 'preset-6':
        monochrome.color = '#0a2342';
        break;
      case 'preset-7':
        monochrome.color = '#3f51b5';
        break;
    }
    this.chartOptions.theme = { monochrome };
  }

  private rerenderChartOnContainerResize(isBox: boolean) {
    const chart = { ...this.chartOptions.chart };
    chart.redrawOnWindowResize = !isBox;
    this.chartOptions = { ...this.chartOptions, chart } as ApexOptions;
  }
}
