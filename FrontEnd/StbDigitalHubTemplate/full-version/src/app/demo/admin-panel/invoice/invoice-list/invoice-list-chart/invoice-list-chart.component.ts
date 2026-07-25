// angular import
import { ChangeDetectorRef, Component, OnInit, effect, input, inject, ChangeDetectionStrategy } from '@angular/core';

// project import
import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';
import { ConfigService } from 'src/app/theme/shared/service/config.service';

// apexChart
import { NgApexchartsModule, ApexOptions } from 'ng-apexcharts';

@Component({
  selector: 'app-invoice-list-chart',
  imports: [...SHARED_IMPORTS, NgApexchartsModule],
  templateUrl: './invoice-list-chart.component.html',
  styleUrl: './invoice-list-chart.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InvoiceListChartComponent implements OnInit {
  private configService = inject(ConfigService);
  private cdr = inject(ChangeDetectorRef);

  // public props
  chartOptions!: ApexOptions;
  seriesData = input.required<[]>();
  colors = input.required<string[]>();

  // constructor
  constructor() {
    effect(() => {
      this.isDarkTheme(this.configService.isDarkMode());
      this.isContainerTheme(this.configService.isBox_container());
      this.cdr.detectChanges();
    });
  }

  // life cycle hook
  ngOnInit(): void {
    this.chartOptions = {
      chart: {
        type: 'area',
        height: 55,
        sparkline: {
          enabled: true
        }
      },
      series: [
        {
          data: this.seriesData()
        }
      ],
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          type: 'vertical',
          inverseColors: false,
          opacityFrom: 0.5,
          opacityTo: 0
        }
      },
      stroke: {
        curve: 'smooth',
        width: 2
      },
      grid: {
        show: false
      },
      tooltip: {
        fixed: {
          enabled: false
        },
        x: {
          show: false
        },
        marker: {
          show: false
        }
      },
      colors: this.colors()
    };
  }

  // private methods
  private isDarkTheme(isDark: boolean): void {
    const tooltip = { ...this.chartOptions.tooltip };
    tooltip.theme = isDark === true ? 'dark' : 'light';
    this.chartOptions = { ...this.chartOptions, tooltip };
  }

  private isContainerTheme(isBox: boolean): void {
    const chart = { ...this.chartOptions.chart };
    chart.redrawOnWindowResize = !isBox;
    this.chartOptions = { ...this.chartOptions, chart } as ApexOptions;
  }
}
