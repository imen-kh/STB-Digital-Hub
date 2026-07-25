// angular import
import { ChangeDetectorRef, Component, effect, inject } from '@angular/core';

// project import
import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';
import { ChartDB } from 'src/fake-data/chartData';
import { ConfigService } from 'src/app/theme/shared/service/config.service';

// third party
import { NgApexchartsModule, ApexOptions } from 'ng-apexcharts';

@Component({
  selector: 'app-apex-chart',
  imports: [...SHARED_IMPORTS, NgApexchartsModule],
  templateUrl: './apex-chart.component.html',
  styleUrl: './apex-chart.component.scss'
})
export class ApexChartComponent {
  private configService = inject(ConfigService);
  private cdr = inject(ChangeDetectorRef);

  // private props
  columnChart!: ApexOptions;
  barChart!: ApexOptions;
  LineChart!: ApexOptions;
  areaChart!: ApexOptions;
  mixedChart!: ApexOptions;
  radialChart!: ApexOptions;
  polarChart!: ApexOptions;

  // this color change with theme color change
  columnChartColor = ['#1565c0', '#003d7a', '#00c853'];
  barChartColor = ['#00c853'];
  lineChart = ['#003d7a'];
  areaColor = ['#003d7a', '#1565c0'];
  mixedColor = ['#003d7a', '#1565c0', '#00c853'];
  radialColor = ['#003d7a', '#1565c0', '#00c853', '#f44336'];
  polarColor = ['#003d7a', '#1565c0', '#00c853', '#f44336', '#ffc107', '#d84315'];
  // eslint-disable-next-line
  chartDB: any;

  // constructor
  constructor() {
    this.chartDB = ChartDB;
    const { columnChart, barChart, LineChart, areaChart, polarChart, mixedChart, radialChart } = this.chartDB;
    // eslint-disable-next-line
    ((this.columnChart = columnChart),
      (this.barChart = barChart),
      (this.LineChart = LineChart),
      (this.areaChart = areaChart),
      (this.mixedChart = mixedChart),
      (this.radialChart = radialChart),
      (this.polarChart = polarChart));
    effect(() => {
      this.updateThemeChart(this.configService.theme_color());
      this.isDarkTheme(this.configService.isDarkMode());
      this.rerenderChartOnContainerResize(this.configService.isBox_container());
      this.cdr.detectChanges();
    });
  }

  // private method
  private updateThemeChart(theme: string) {
    switch (theme) {
      case 'preset-1':
        this.columnChartColor = ['#1565c0', '#003d7a', '#00c853'];
        this.barChartColor = ['#00c853'];
        this.lineChart = ['#003d7a'];
        this.areaColor = ['#003d7a', '#1565c0'];
        this.mixedColor = ['#003d7a', '#1565c0', '#00c853'];
        this.radialColor = ['#003d7a', '#1565c0', '#00c853', '#f44336'];
        this.polarColor = ['#003d7a', '#1565c0', '#00c853', '#f44336', '#ffc107', '#d84315'];
        break;
      case 'preset-2':
        this.columnChartColor = ['#607d8b', '#009688', '#64ba5f'];
        this.barChartColor = ['#64ba5f'];
        this.lineChart = ['#009688'];
        this.areaColor = ['#2196f3', '#607d8b'];
        this.mixedColor = ['#009688', '#607d8b', '#64ba5f'];
        this.radialColor = ['#009688', '#607d8b', '#64ba5f', '#d9534f'];
        this.polarColor = ['#009688', '#607d8b', '#64ba5f', '#d9534f', '#ec9c3d', '#d84315'];
        break;
      case 'preset-3':
        this.columnChartColor = ['#203461', '#ec407a', '#14bb38'];
        this.barChartColor = ['#14bb38'];
        this.lineChart = ['#ec407a'];
        this.areaColor = ['#ec407a', '#203461'];
        this.mixedColor = ['#ec407a', '#203461', '#14bb38'];
        this.radialColor = ['#ec407a', '#203461', '#14bb38', '#d9534f'];
        this.polarColor = ['#ec407a', '#203461', '#14bb38', '#d9534f', '#ec9c3d', '#d84315'];
        break;
      case 'preset-4':
        this.columnChartColor = ['#16595a', '#c77e23', '#00c853'];
        this.barChartColor = ['#00c853'];
        this.lineChart = ['#c77e23'];
        this.areaColor = ['#c77e23', '#16595a'];
        this.mixedColor = ['#c77e23', '#16595a', '#00c853'];
        this.radialColor = ['#c77e23', '#16595a', '#00c853', '#f44336'];
        this.polarColor = ['#c77e23', '#16595a', '#00c853', '#f44336', '#ec9c3d', '#d84315'];
        break;
      case 'preset-5':
        this.columnChartColor = ['#173e43', '#3fb0ac', '#00c853'];
        this.barChartColor = ['#00c853'];
        this.lineChart = ['#3fb0ac'];
        this.areaColor = ['#3fb0ac', '#173e43'];
        this.mixedColor = ['#3fb0ac', '#173e43', '#00c853'];
        this.radialColor = ['#3fb0ac', '#173e43', '#00c853', '#f44336'];
        this.polarColor = ['#3fb0ac', '#173e43', '#00c853', '#f44336', '#ec9c3d', '#d84315'];
        break;
      case 'preset-6':
        this.columnChartColor = ['#0a2342', '#2ca58d', '#00c853'];
        this.barChartColor = ['#00c853'];
        this.lineChart = ['#2ca58d'];
        this.areaColor = ['#2ca58d', '#0a2342'];
        this.mixedColor = ['#2ca58d', '#0a2342', '#00c853'];
        this.radialColor = ['#2ca58d', '#0a2342', '#00c853', '#f44336'];
        this.polarColor = ['#2ca58d', '#0a2342', '#00c853', '#f44336', '#ec9c3d', '#d84315'];
        break;
      case 'preset-7':
        this.columnChartColor = ['#3f51b5', '#3f51b5', '#00c853'];
        this.barChartColor = ['#00c853'];
        this.lineChart = ['#3f51b5'];
        this.areaColor = ['#3f51b5', '#3f51b5'];
        this.mixedColor = ['#3f51b5', '#3f51b5', '#00c853'];
        this.radialColor = ['#3f51b5', '#3f51b5', '#00c853', '#f44336'];
        this.polarColor = ['#3f51b5', '#3f51b5', '#00c853', '#d9534f', '#ec9c3d', '#d84315'];
        break;
    }
  }

  private isDarkTheme(isDark: boolean) {
    const tooltipTheme = isDark === true ? 'dark' : 'light';
    const tooltip = { theme: tooltipTheme };
    this.columnChart = { ...this.columnChart, tooltip };
    this.barChart = { ...this.barChart, tooltip };
    this.LineChart = { ...this.LineChart, tooltip };
    this.areaChart = { ...this.areaChart, tooltip };
    this.mixedChart = { ...this.mixedChart, tooltip };
  }

  private rerenderChartOnContainerResize(isBox: boolean) {
    const charts = [this.columnChart, this.barChart, this.LineChart, this.areaChart, this.polarChart, this.mixedChart, this.radialChart];
    charts.forEach((chart, index) => {
      const chartClone = { ...chart.chart };
      chartClone.redrawOnWindowResize = !isBox;
      charts[index] = { ...chart, chart: chartClone } as ApexOptions;
    });
    [this.columnChart, this.barChart, this.LineChart, this.areaChart, this.polarChart, this.mixedChart, this.radialChart] = charts;
  }
}
