// Angular import
import { Component, OnInit } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';

// project Import
import { DateComponent } from './common/date-component.component';
import { DEF_CONF } from './common/conts/consts';
import { IDatePickerConfig } from './date-picker/date-picker-config.model';
import { CardComponent } from 'src/app/theme/shared/components/card/card.component';
import { ConfigFormComponent } from './config-form/config-form.component';

// third party
import { DpDatePickerModule } from 'ng2-date-picker';

@Component({
  selector: 'app-datepicker',
  templateUrl: './datepicker.component.html',
  styleUrl: './datepicker.component.scss',
  imports: [CardComponent, DpDatePickerModule, FormsModule, ReactiveFormsModule, ConfigFormComponent]
})
export class DatepickerComponent extends DateComponent implements OnInit {
  // private Props
  override control!: FormControl;
  config: IDatePickerConfig = {
    ...DEF_CONF,
    format: 'DD-MM-YYYY'
  };

  config1: IDatePickerConfig = {
    ...DEF_CONF,
    format: 'DD-MM-YYYY HH:mm:ss'
  };

  // Life cycle events
  ngOnInit(): void {
    this.control = this.buildForm();
  }
}
