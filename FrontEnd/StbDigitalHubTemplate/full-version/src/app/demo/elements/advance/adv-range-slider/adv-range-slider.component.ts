// Angular Import
import { Component } from '@angular/core';

import { FormControl, FormGroup } from '@angular/forms';

// Project Import
import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';

// Third party
import { NgxSliderModule, Options, CustomStepDefinition } from 'ngx-slider-v2';

interface SliderDetails {
  value: number;
  highValue: number;
  floor: number;
  ceil: number;
}

interface SimpleSliderModel {
  value: number;
  options: Options;
}

interface RangeSliderModel {
  minValue: number;
  maxValue: number;
  options: Options;
}

@Component({
  selector: 'app-adv-range-slider',
  imports: [...SHARED_IMPORTS, NgxSliderModule],
  templateUrl: './adv-range-slider.component.html',
  styleUrl: './adv-range-slider.component.scss'
})
export class AdvRangeSliderComponent {
  // private props
  sliderControl: FormControl = new FormControl(100);
  sliderForm: FormGroup = new FormGroup({
    sliderControl: new FormControl([20, 80])
  });

  // private Method
  sliderOptions(slider: SliderDetails): Options {
    return {
      floor: slider.floor,
      ceil: slider.ceil
    };
  }

  onChangeReadOnly(): void {
    this.options = Object.assign({}, this.options, { readOnly: this.readOnly });
  }

  indexToLetter(index: number): string {
    return this.alphabet[index];
  }

  letterToIndex(letter: string): number {
    return this.alphabet.indexOf(letter);
  }

  resetForm(): void {
    this.sliderControl.reset(100);
  }

  resetForm1(): void {
    this.sliderForm.reset({ sliderControl: [20, 80] });
  }

  createDateRange(): Date[] {
    const dates: Date[] = [];
    for (let i = 1; i <= 31; i++) {
      dates.push(new Date(2018, 5, i));
    }
    return dates;
  }

  minValue = 50;
  maxValue = 200;
  value = 100;
  options: Options = {
    floor: 0,
    ceil: 200
  };

  minValue1 = 10;
  maxValue1 = 90;
  options1: Options = {
    floor: 0,
    ceil: 100,
    step: 10,
    showTicks: true
  };

  minValue2 = 10;
  maxValue2 = 90;
  options2: Options = {
    floor: 0,
    ceil: 100,
    step: 1,
    noSwitching: true
  };

  minValue3 = 60;
  maxValue3 = 70;
  options3: Options = {
    floor: 0,
    ceil: 100,
    step: 1,
    minRange: 10,
    maxRange: 30,
    pushRange: true
  };

  value4 = 5;
  options4: Options = {
    floor: -10,
    ceil: 10,
    showSelectionBarFromValue: 0
  };

  value5 = 12;
  options5: Options = {
    floor: 0,
    ceil: 12,
    showSelectionBar: true,
    getSelectionBarColor: (value: number): string => {
      if (value <= 3) {
        return 'red';
      }
      if (value <= 6) {
        return 'orange';
      }
      if (value <= 9) {
        return 'yellow';
      }
      return '#2AE02A';
    }
  };

  value6 = 20;
  options6: Options = {
    floor: 10,
    ceil: 100,
    step: 5,
    rightToLeft: true
  };

  value7 = 5;
  options7: Options = {
    showTicksValues: true,
    stepsArray: [
      { value: 1, legend: 'Very poor' },
      { value: 2 },
      { value: 3, legend: 'Fair' },
      { value: 4 },
      { value: 5, legend: 'Average' },
      { value: 6 },
      { value: 7, legend: 'Good' },
      { value: 8 },
      { value: 9, legend: 'Excellent' }
    ]
  };

  alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  value8: number = this.letterToIndex('E');
  options8: Options = {
    stepsArray: this.alphabet.split('').map((letter: string): CustomStepDefinition => {
      return { value: this.letterToIndex(letter) };
    }),
    translate: (value: number): string => {
      return this.indexToLetter(value);
    }
  };

  dateRange: Date[] = this.createDateRange();
  value9: number = this.dateRange[0].getTime();
  options9: Options = {
    stepsArray: this.dateRange.map((date: Date) => {
      return { value: date.getTime() };
    }),
    translate: (value: number): string => {
      return new Date(value).toDateString();
    }
  };

  sliders: SliderDetails[] = [
    {
      value: -1,
      highValue: 2,
      floor: -5,
      ceil: 5
    },
    {
      value: 1,
      highValue: 2,
      floor: 0,
      ceil: 5
    },
    {
      value: 30,
      highValue: 60,
      floor: 0,
      ceil: 100
    }
  ];

  readOnly = true;
  value10 = 50;
  options10: Options = {
    floor: 0,
    ceil: 100,
    readOnly: true
  };

  verticalSlider1: SimpleSliderModel = {
    value: 5,
    options: {
      floor: 0,
      ceil: 10,
      vertical: true
    }
  };

  verticalSlider2: RangeSliderModel = {
    minValue: 20,
    maxValue: 80,
    options: {
      floor: 0,
      ceil: 100,
      vertical: true
    }
  };

  verticalSlider3: SimpleSliderModel = {
    value: 5,
    options: {
      floor: 0,
      ceil: 10,
      vertical: true,
      showTicks: true
    }
  };

  verticalSlider4: RangeSliderModel = {
    minValue: 1,
    maxValue: 5,
    options: {
      floor: 0,
      ceil: 6,
      vertical: true,
      showTicksValues: true
    }
  };

  verticalSlider5: SimpleSliderModel = {
    value: 50,
    options: {
      floor: 0,
      ceil: 100,
      vertical: true,
      showSelectionBar: true
    }
  };

  verticalSlider6: SimpleSliderModel = {
    value: 6,
    options: {
      floor: 0,
      ceil: 6,
      vertical: true,
      showSelectionBar: true,
      showTicksValues: true,
      ticksValuesTooltip: (v: number): string => {
        return 'Tooltip for ' + v;
      }
    }
  };
}
