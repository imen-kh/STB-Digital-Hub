import { ChangeDetectorRef, Component, effect, inject, ChangeDetectionStrategy } from '@angular/core';

// project import
import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';
import { ConfigService } from 'src/app/theme/shared/service/config.service';

// third party
import { NgApexchartsModule, ApexOptions } from 'ng-apexcharts';

@Component({
  selector: 'app-category-chart',
  imports: [...SHARED_IMPORTS, NgApexchartsModule],
  templateUrl: './category-chart.component.html',
  styleUrl: './category-chart.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CategoryChartComponent {
  private configService = inject(ConfigService);
  private cdr = inject(ChangeDetectorRef);

  // public props
  chartOptions!: ApexOptions;

  // constructor
  constructor() {
    this.chartOptions = {
      chart: {
        height: 300,
        type: 'donut'
      },
      dataLabels: {
        enabled: false
      },
      legend: {
        show: true,
        position: 'bottom'
      },
      plotOptions: {
        pie: {
          donut: {
            size: '65%'
          }
        }
      },
      labels: ['Saving', 'Spend', 'Income'],
      series: [25, 50, 25],
      colors: ['#1565c0', '#003d7a', '#52c41a']
    };

    effect(() => {
      this.rerenderChartOnContainerResize(this.configService.isBox_container());
      this.cdr.detectChanges();
    });
  }

  // private methods
  private rerenderChartOnContainerResize(isBox: boolean) {
    const chart = { ...this.chartOptions.chart };
    chart.redrawOnWindowResize = !isBox;
    this.chartOptions = { ...this.chartOptions, chart } as ApexOptions;
  }
}
