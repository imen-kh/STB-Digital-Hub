import { ChangeDetectorRef, Component, OnInit, input, ChangeDetectionStrategy, inject } from '@angular/core';

// project import
import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';

// third party
import { NgApexchartsModule, ApexOptions, ApexTheme } from 'ng-apexcharts';

@Component({
  selector: 'app-course-state-chart',
  imports: [...SHARED_IMPORTS, NgApexchartsModule],
  templateUrl: './course-state-chart.html',
  styleUrl: './course-state-chart.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CourseStateChart implements OnInit {
  private cdr = inject(ChangeDetectorRef);
  // eslint-disable-next-line
  series = input.required<any>();

  // public props
  chartOptions!: Partial<ApexOptions>;

  // life cycle
  ngOnInit() {
    this.chartOptions = {
      chart: {
        type: 'radialBar',
        width: 50,
        height: 50,
        background: 'transparent',
        sparkline: {
          enabled: true
        }
      },
      plotOptions: {
        radialBar: {
          offsetX: 0,
          offsetY: 0,
          track: {
            background: '#eaeaea'
          },
          hollow: {
            size: '10%'
          },
          dataLabels: {
            show: false
          }
        }
      },
      series: this.series()
    };
  }

  // private methods
  private isDarkTheme(isDark: boolean) {
    const colors = ['var(--bs-warning)'];
    const theme: ApexTheme = { mode: isDark === true ? 'dark' : 'light' };
    this.chartOptions = { ...this.chartOptions, theme, colors };
  }
}
