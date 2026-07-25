// angular import
import { ChangeDetectorRef, Component, OnInit, effect, inject, ChangeDetectionStrategy } from '@angular/core';

// project import
import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';
import { ConfigService } from 'src/app/theme/shared/service/config.service';

// apexChart
import { NgApexchartsModule, ApexOptions } from 'ng-apexcharts';

@Component({
  selector: 'app-invites-goal-chart',
  imports: [...SHARED_IMPORTS, NgApexchartsModule],
  templateUrl: './invites-goal-chart.component.html',
  styleUrl: './invites-goal-chart.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InvitesGoalChartComponent implements OnInit {
  private configService = inject(ConfigService);
  private cdr = inject(ChangeDetectorRef);

  // public props
  chartOptions!: ApexOptions;

  // constructor
  constructor() {
    effect(() => {
      this.updateThemeColor(this.configService.theme_color());
      this.rerenderChartOnContainerResize(this.configService.isBox_container());
      this.cdr.detectChanges();
    });
  }

  // life cycle hook
  ngOnInit(): void {
    this.chartOptions = {
      series: [76],
      chart: {
        type: 'radialBar',
        height: '300px',
        offsetY: -20,
        sparkline: {
          enabled: true
        }
      },
      colors: ['#003d7a'],
      plotOptions: {
        radialBar: {
          startAngle: -95,
          endAngle: 95,
          hollow: {
            margin: 15,
            size: '50%'
          },
          track: {
            background: '#eaeaea',
            strokeWidth: '97%',
            margin: 20
          },
          dataLabels: {
            name: {
              show: false
            },
            value: {
              offsetY: 0,
              fontSize: '20px'
            }
          }
        }
      },
      grid: {
        padding: {
          top: 10
        }
      },
      stroke: {
        lineCap: 'round'
      }
    };
  }

  // private methods
  private updateThemeColor(theme: string) {
    let colors: string[];
    switch (theme) {
      case 'preset-1':
      default:
        colors = ['#1565c0'];
        break;
      case 'preset-2':
        colors = ['#009688'];
        break;
      case 'preset-3':
        colors = ['#ec407a'];
        break;
      case 'preset-4':
        colors = ['#c77e23'];
        break;
      case 'preset-5':
        colors = ['#3fb0ac'];
        break;
      case 'preset-6':
        colors = ['#2ca58d'];
        break;
      case 'preset-7':
        colors = ['#3f51b5'];
        break;
    }
    this.chartOptions = { ...this.chartOptions, colors };
  }

  private rerenderChartOnContainerResize(isBox: boolean) {
    const chart = { ...this.chartOptions.chart };
    chart.redrawOnWindowResize = !isBox;
    this.chartOptions = { ...this.chartOptions, chart } as ApexOptions;
  }
}
