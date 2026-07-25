// angular import
import { Component, OnInit, effect, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';

// project import
import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';
import { ConfigService } from 'src/app/theme/shared/service/config.service';

// apexChart
import { NgApexchartsModule, ApexOptions } from 'ng-apexcharts';

@Component({
  selector: 'app-state-chart',
  imports: [NgApexchartsModule, ...SHARED_IMPORTS],
  templateUrl: './state-chart.component.html',
  styleUrl: './state-chart.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StateChartComponent implements OnInit {
  private configService = inject(ConfigService);
  private cdr = inject(ChangeDetectorRef);

  // public props
  chartOptions!: ApexOptions;
  selectType: string = 'today';

  // constructor
  constructor() {
    effect(() => {
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
            background: '#003d7a25',
            strokeWidth: '97%',
            margin: 10
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
      },
      labels: ['Average Results']
    };
  }

  onOptionSelected() {
    switch (this.selectType) {
      case 'today':
        this.chartOptions.series = [76];
        break;
      case 'week':
        this.chartOptions.series = [50];
        break;
      case 'month':
        this.chartOptions.series = [30];
        break;
    }
    this.cdr.markForCheck();
  }

  // private methods
  private rerenderChartOnContainerResize(isBox: boolean) {
    const chart = { ...this.chartOptions.chart };
    chart.redrawOnWindowResize = !isBox;
    this.chartOptions = { ...this.chartOptions, chart } as ApexOptions;
  }
}
