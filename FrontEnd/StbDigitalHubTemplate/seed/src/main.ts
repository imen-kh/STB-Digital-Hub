// Angular Import
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, withComponentInputBinding } from '@angular/router';

// project import
import { AppComponent } from './app/app.component';
import { basicAuthInterceptor } from 'src/app/theme/shared/_helpers/basic-auth.interceptor';
import { errorInterceptor } from 'src/app/theme/shared/_helpers/error.interceptor';
import { appRoutes } from './app/app-routing.module';
import { provideTranslateService, TranslateLoader } from '@ngx-translate/core';
import { CustomTranslateLoader } from './app/theme/shared/custom-translate-loader';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(appRoutes, withComponentInputBinding()),
    provideTranslateService({
      loader: { provide: TranslateLoader, useClass: CustomTranslateLoader }
    }),
    provideHttpClient(withInterceptors([basicAuthInterceptor, errorInterceptor]))
  ]
}).catch((err) => console.error(err));
