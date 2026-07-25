import { TDrops, TOpens } from '../common/type/poistions.type';
import { ElementRef } from '@angular/core';
import { IDayCalendarConfig } from 'ng2-date-picker';

// These internal types are not publicly exported by ng2-date-picker
type IDayCalendarConfigInternal = IDayCalendarConfig & Record<string, unknown>;
type ITimeSelectConfig = Record<string, unknown>;
type ITimeSelectConfigInternal = Record<string, unknown>;

export interface IConfig {
  closeOnSelectDelay?: number;
  openOnFocus?: boolean;
  openOnClick?: boolean;
  disableKeypress?: boolean;
  inputElementContainer?: HTMLElement | string | ElementRef;
  drops?: TDrops;
  opens?: TOpens;
  hideInputContainer?: boolean;
  hideOnOutsideClick?: boolean;
}

export interface IDatePickerConfig extends IConfig, IDayCalendarConfig, ITimeSelectConfig {}

export interface IDatePickerConfigInternal extends IConfig, IDayCalendarConfigInternal, ITimeSelectConfigInternal {}
