export class ChartDB {
  static seoChart = {
    chart: {
      type: 'area',
      height: 40,
      sparkline: {
        enabled: true
      }
    },

    dataLabels: {
      enabled: false
    },
    fill: {
      type: 'solid',
      opacity: 0.3
    },
    markers: {
      size: 2,
      colors: ['#2196f3'],
      strokeWidth: 2,
      hover: {
        size: 4
      }
    },
    stroke: {
      curve: 'straight',
      width: 3
    },
    series: [
      {
        name: 'series1',
        data: [9, 66, 41, 89, 63, 25, 44, 12, 36, 20, 54, 25, 9]
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
  static conversionsChart = {
    chart: {
      type: 'bar',
      height: 200,
      sparkline: {
        enabled: true
      },
      background: 'transparent'
    },
    series: [
      {
        data: [
          25, 66, 41, 89, 63, 25, 44, 12, 36, 9, 54, 25, 66, 41, 89, 63, 54, 25, 66, 41, 89, 63, 25, 44, 12, 36, 9, 54, 25, 66, 41, 89, 63,
          25, 44, 12, 36, 9, 25, 44, 12, 36, 9, 54
        ]
      }
    ],
    plotOptions: {
      bar: {
        columnWidth: '80%'
      }
    },
    xaxis: {
      crosshairs: {
        width: 1
      }
    },
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
  static revenueChart = {
    chart: {
      height: 228,
      type: 'donut'
    },
    dataLabels: {
      enabled: false
    },
    labels: ['Youtube', 'Facebook', 'Twitter'],
    series: [1258, 975, 500],
    legend: {
      show: true,
      position: 'bottom'
    },
    responsive: [
      {
        breakpoint: 768,
        options: {
          legend: {
            show: false
          }
        }
      }
    ]
  };
  static ChartOptions_10 = {
    chart: {
      height: 170,
      type: 'bar',
      sparkline: {
        enabled: true
      }
    },
    colors: ['#2196f3', '#0e9e4a', '#f44336'],
    plotOptions: {
      bar: {
        columnWidth: '55%',
        distributed: true
      }
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      width: 0
    },
    series: [
      {
        name: 'Requests',
        data: [66.6, 29.7, 32.8]
      }
    ],
    xaxis: {
      categories: ['Desktop', 'Tablet', 'Mobile']
    },
    tooltip: {
      theme: 'light'
    }
  };
  static ChartOptions_11 = {
    chart: {
      type: 'bar',
      height: 40,
      sparkline: {
        enabled: true
      }
    },
    dataLabels: {
      enabled: false
    },
    colors: ['#17C666'],
    plotOptions: {
      bar: {
        columnWidth: '60%'
      }
    },
    series: [
      {
        data: [25, 66, 41, 89, 63, 25, 44, 12, 36, 9, 54, 25, 66, 41, 89, 63]
      }
    ],
    xaxis: {
      crosshairs: {
        width: 1
      }
    },
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
  static ChartOptions_12 = {
    chart: {
      type: 'area',
      height: 40,
      sparkline: {
        enabled: true
      }
    },
    dataLabels: {
      enabled: false
    },
    colors: ['#f44336'],
    fill: {
      type: 'solid',
      opacity: 0
    },
    markers: {
      size: 2,
      strokeWidth: 2,
      hover: {
        size: 4
      }
    },
    stroke: {
      curve: 'straight',
      width: 3
    },
    series: [
      {
        name: 'series1',
        data: [9, 66, 41, 89, 63, 25, 44, 12, 36, 20, 54, 25, 9]
      }
    ],
    tooltip: {
      theme: 'dark',
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
  static ChartOptions_13 = {
    chart: {
      height: 260,
      type: 'pie'
    },
    series: [66, 50, 40, 30],
    labels: ['Very Poor', 'Satisfied', 'Very Satisfied', 'Poor'],
    legend: {
      show: true,
      position: 'bottom'
    },
    dataLabels: {
      enabled: true,
      dropShadow: {
        enabled: false
      }
    },
    theme: {
      monochrome: {
        enabled: true,
        color: '#f44336'
      }
    }
  };
  static columnChart = {
    chart: {
      height: 350,
      type: 'bar'
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '55%'
      }
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      show: true,
      width: 2,
      colors: ['transparent']
    },
    series: [
      {
        name: 'Net Profit',
        data: [44, 55, 57, 56, 61, 58, 63]
      },
      {
        name: 'Revenue',
        data: [76, 85, 101, 98, 87, 105, 91]
      },
      {
        name: 'Free Cash Flow',
        data: [35, 41, 36, 26, 45, 48, 52]
      }
    ],
    xaxis: {
      categories: ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug']
    },
    yaxis: {
      title: {
        text: '$ (thousands)'
      }
    },
    fill: {
      opacity: 1
    },
    tooltip: {
      theme: 'light',
      y: {
        formatter: function (val: string) {
          return '$ ' + val + ' thousands';
        }
      }
    }
  };
  static barChart = {
    series: [
      {
        name: 'basic',
        data: [400, 430, 448, 470, 540, 580, 690, 1100, 1200, 1380]
      }
    ],
    chart: {
      type: 'bar',
      height: 350
    },
    plotOptions: {
      bar: {
        horizontal: true
      }
    },
    dataLabels: {
      enabled: false
    },
    xaxis: {
      categories: [
        'South Korea',
        'Canada',
        'United Kingdom',
        'Netherlands',
        'Italy',
        'France',
        'Japan',
        'United States',
        'China',
        'Germany'
      ]
    },
    tooltip: {
      theme: 'light'
    }
  };
  static LineChart = {
    series: [
      {
        name: 'Desktops',
        data: [10, 41, 35, 51, 49, 62, 69, 91, 148]
      }
    ],
    chart: {
      height: 350,
      type: 'line',
      zoom: {
        enabled: false
      },
      background: 'transparent'
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      curve: 'straight'
    },
    title: {
      text: 'Product Trends by Month',
      align: 'left'
    },
    grid: {
      row: {
        colors: ['#f3f3f3', 'transparent'], // takes an array which will be repeated on columns
        opacity: 0.5
      }
    },
    xaxis: {
      categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep']
    },
    tooltip: {
      theme: 'light'
    }
  };
  static areaChart = {
    series: [
      {
        name: 'series1',
        data: [31, 40, 28, 51, 42, 109, 100]
      },
      {
        name: 'series2',
        data: [11, 32, 45, 32, 34, 52, 41]
      }
    ],
    chart: {
      height: 350,
      type: 'area'
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      curve: 'smooth'
    },
    xaxis: {
      type: 'datetime',
      categories: [
        '2018-09-19T00:00:00.000Z',
        '2018-09-19T01:30:00.000Z',
        '2018-09-19T02:30:00.000Z',
        '2018-09-19T03:30:00.000Z',
        '2018-09-19T04:30:00.000Z',
        '2018-09-19T05:30:00.000Z',
        '2018-09-19T06:30:00.000Z'
      ]
    },
    tooltip: {
      theme: 'light',
      x: {
        format: 'dd/MM/yy HH:mm'
      }
    }
  };
  static mixedChart = {
    series: [
      {
        name: 'Income',
        type: 'column',
        data: [14, 2, 22, 15, 25, 28, 38, 46]
      },
      {
        name: 'Cashflow',
        type: 'column',
        data: [11, 5, 27, 10, 32, 35, 45, 50]
      },
      {
        name: 'Revenue',
        type: 'line',
        data: [20, 29, 33, 36, 44, 45, 50, 58]
      }
    ],
    chart: {
      type: 'line',
      stacked: false,
      height: 350
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      width: [1, 1, 4]
    },
    xaxis: {
      categories: [2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016]
    },
    legend: {
      horizontalAlign: 'left',
      offsetX: 40
    },

    tooltip: {
      theme: 'light',
      fixed: {
        enabled: true,
        position: 'topLeft', // topRight, topLeft, bottomRight, bottomLeft
        offsetY: 30,
        offsetX: 60
      }
    }
  };
  static radialChart = {
    series: [76, 67, 61, 90],
    chart: {
      height: 390,
      type: 'radialBar'
    },
    plotOptions: {
      radialBar: {
        offsetY: 0,
        startAngle: 0,
        endAngle: 270,
        hollow: {
          margin: 5,
          size: '30%',
          background: 'transparent',
          image: undefined
        },
        dataLabels: {
          name: {
            show: false
          },
          value: {
            show: false
          }
        }
      }
    },
    labels: ['Vimeo', 'Messenger', 'Facebook', 'LinkedIn'],
    legend: {
      show: true,
      floating: true,
      fontSize: '16px',
      position: 'left',
      offsetX: 50,
      offsetY: 10,
      labels: {
        useSeriesColors: true
      },
      formatter: function (
        seriesName: string,
        opts: { w: { globals: { series: { [x: string]: string } } }; seriesIndex: string | number }
      ) {
        return seriesName + ':  ' + opts.w.globals.series[opts.seriesIndex];
      },
      itemMargin: {
        horizontal: 3
      }
    },
    responsive: [
      {
        breakpoint: 480,
        options: {
          legend: {
            show: false
          }
        }
      }
    ]
  };
  static polarChart = {
    series: [14, 23, 21, 17, 15, 10, 12, 17, 21],
    chart: {
      height: 390,
      type: 'polarArea'
    },
    stroke: {
      colors: ['#fff']
    },
    fill: {
      opacity: 1
    },
    responsive: [
      {
        breakpoint: 480,
        options: {
          chart: {
            width: 200
          },
          legend: {
            position: 'bottom'
          }
        }
      }
    ]
  };
  static pieChart = {
    series: [25, 15, 44, 55, 41, 17],
    chart: {
      width: '100%',
      type: 'pie'
    },

    theme: {
      monochrome: {
        enabled: true
      }
    },
    title: {
      text: 'Number of leads'
    },
    responsive: [
      {
        breakpoint: 480,
        options: {
          chart: {
            width: 200
          },
          legend: {
            position: 'bottom'
          }
        }
      }
    ]
  };
}
