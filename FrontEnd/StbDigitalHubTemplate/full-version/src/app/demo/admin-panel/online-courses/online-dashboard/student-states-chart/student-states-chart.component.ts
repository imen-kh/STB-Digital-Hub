import { ChangeDetectorRef, Component, OnInit, effect, inject, ChangeDetectionStrategy } from '@angular/core';

// project import
import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';
import { ConfigService } from 'src/app/theme/shared/service/config.service';

// third party
import { NgApexchartsModule, ApexOptions } from 'ng-apexcharts';

@Component({
  selector: 'app-student-states-chart',
  imports: [...SHARED_IMPORTS, NgApexchartsModule],
  templateUrl: './student-states-chart.component.html',
  styleUrl: './student-states-chart.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StudentStatesChartComponent implements OnInit {
  private configService = inject(ConfigService);
  private cdr = inject(ChangeDetectorRef);

  // public props
  chartOptions!: ApexOptions;

  //constructor
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
        height: 275,
        type: 'donut'
      },
      dataLabels: {
        enabled: false
      },
      plotOptions: {
        pie: {
          donut: {
            size: '65%'
          }
        }
      },
      labels: ['Total Signups', 'Active Student'],
      series: [76.7, 30],
      legend: {
        show: true,
        position: 'bottom'
      },
      colors: ['#003d7a', '#FFC107']
    };
  }

  // private methods
  private updateThemeColor(theme: string) {
    let colors: string[];
    switch (theme) {
      case 'preset-1':
      default:
        colors = ['#003d7a', '#1565c0'];
        break;
      case 'preset-2':
        colors = ['#607d8b', '#009688'];
        break;
      case 'preset-3':
        colors = ['#203461', '#ec407a'];
        break;
      case 'preset-4':
        colors = ['#16595a', '#c77e23'];
        break;
      case 'preset-5':
        colors = ['#173e43', '#3fb0ac'];
        break;
      case 'preset-6':
        colors = ['#0a2342', '#2ca58d'];
        break;
      case 'preset-7':
        colors = ['#3f51b5', '#3f51b5'];
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
