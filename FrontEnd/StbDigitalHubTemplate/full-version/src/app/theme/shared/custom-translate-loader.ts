// project import
import en from '../../../assets/i18n/en.json';
import fr from '../../../assets/i18n/fr.json';
import ro from '../../../assets/i18n/ro.json';
import cn from '../../../assets/i18n/cn.json';

// third party
import { TranslateLoader } from '@ngx-translate/core';

// angular import
import { of } from 'rxjs';

export class CustomTranslateLoader implements TranslateLoader {
  // public method
  getTranslation(lang: string) {
    if (lang === 'fr') {
      return of(fr);
    }
    if (lang === 'ro') {
      return of(ro);
    }
    if (lang === 'cn') {
      return of(cn);
    }
    return of(en);
  }
}
