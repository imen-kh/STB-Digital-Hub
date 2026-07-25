// angular import
import { ChangeDetectorRef, Component, OnInit, effect, inject, ChangeDetectionStrategy } from '@angular/core';
import { HostListener } from '@angular/core';
// project import
import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';
import { ConfigService } from 'src/app/theme/shared/service/config.service';

// apexChart
import { NgApexchartsModule, ApexOptions } from 'ng-apexcharts';

@Component({
  selector: 'app-total-expenses-chart',
  imports: [...SHARED_IMPORTS, NgApexchartsModule],
  templateUrl: './total-expenses-chart.component.html',
  styleUrl: './total-expenses-chart.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TotalExpensesChartComponent implements OnInit {

  dropdownPlacement = this.getPlacement();

  @HostListener('window:resize')
  onResize(): void {
    this.dropdownPlacement = this.getPlacement();
  }

  private getPlacement(): string {
    return window.innerWidth >= 1025 ? 'left' : 'bottom-start';
  }

  private configService = inject(ConfigService);
  private cdr = inject(ChangeDetectorRef);

  // public props
  chartOptions!: ApexOptions;

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
      chart: {
        height: 280,
        type: 'donut'
      },
      series: [27, 23, 20, 17],
      colors: ['#faad14', '#52c41a', '#ff4d4f', '#1677ff'],
      labels: ['Pending', 'Paid', 'Overdue', 'Draft'],
      fill: {
        opacity: [1, 1, 1, 0.3]
      },
      legend: {
        show: false
      },
      plotOptions: {
        pie: {
          donut: {
            size: '65%',
            labels: {
              show: true,
              name: {
                show: true
              },
              value: {
                show: true
              }
            }
          }
        }
      },
      dataLabels: {
        enabled: false
      },
      responsive: [
        {
          breakpoint: 575,
          options: {
            chart: {
              height: 250
            },
            plotOptions: {
              pie: {
                donut: {
                  size: '65%',
                  labels: {
                    show: false
                  }
                }
              }
            }
          }
        }
      ]
    };
  }

  // public method
  expenses = [
    {
      title: 'Pending',
      value: '$3,202',
      color: 'text-warning'
    },
    {
      title: 'Paid',
      value: '$45,050',
      color: 'text-success'
    },
    {
      title: 'Overdue',
      value: '$25,000',
      color: 'text-danger'
    },
    {
      title: 'Draft',
      value: '$7,694',
      color: ' text-primary text-opacity-25'
    }
  ];

  // private method
  private rerenderChartOnContainerResize(isBox: boolean) {
    const chart = { ...this.chartOptions.chart };
    chart.redrawOnWindowResize = !isBox;
    this.chartOptions = { ...this.chartOptions, chart } as ApexOptions;
  }
}
