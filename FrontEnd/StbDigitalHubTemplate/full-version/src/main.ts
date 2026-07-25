declare global {
  interface Window {
    global: Window;
  }
}

(window as Window & typeof globalThis).global = window;

// Angular Import
import { importProvidersFrom } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter, withComponentInputBinding, withRouterConfig } from '@angular/router';

// project import
import { AppComponent } from './app/app.component';
import { basicAuthInterceptor } from 'src/app/theme/shared/_helpers/basic-auth.interceptor';
import { errorInterceptor } from 'src/app/theme/shared/_helpers/error.interceptor';
import { appRoutes } from './app/app-routing.module';
import { CustomTranslateLoader } from './app/theme/shared/custom-translate-loader';

// third party
import { provideTranslateService, TranslateLoader } from '@ngx-translate/core';
import { provideSweetAlert2 } from '@sweetalert2/ngx-sweetalert2';
import { provideToastr } from 'ngx-toastr';
import { FeatherModule } from 'angular-feather';
import { allIcons } from 'angular-feather/icons';
import { GalleryModule } from '@ks89/angular-modal-gallery';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(
      appRoutes,
      withComponentInputBinding(),
      withRouterConfig({
        paramsInheritanceStrategy: 'emptyOnly'
      })
    ),
    provideAnimations(),
    provideTranslateService({
      loader: { provide: TranslateLoader, useClass: CustomTranslateLoader }
    }),
    provideHttpClient(withInterceptors([basicAuthInterceptor, errorInterceptor])),
    importProvidersFrom(FeatherModule.pick(allIcons), GalleryModule),
    provideToastr(),
    provideSweetAlert2({
      fireOnInit: false,
      dismissOnDestroy: true
    })
  ]
}).catch((err) => console.error(err));
