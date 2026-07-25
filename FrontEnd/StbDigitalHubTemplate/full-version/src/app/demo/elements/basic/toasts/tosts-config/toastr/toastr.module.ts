import { Provider } from '@angular/core';

import { DefaultNoComponentGlobalConfig, GlobalConfig, TOAST_CONFIG } from './toastr-config';
import { provideToastr } from './toast.provider';

export function provideCustomToastr(config: Partial<GlobalConfig> = {}): Provider[] {
  return provideToastr(config);
}

export function provideComponentlessToastr(config: Partial<GlobalConfig> = {}): Provider[] {
  return [
    {
      provide: TOAST_CONFIG,
      useValue: {
        default: DefaultNoComponentGlobalConfig,
        config
      }
    }
  ];
}
