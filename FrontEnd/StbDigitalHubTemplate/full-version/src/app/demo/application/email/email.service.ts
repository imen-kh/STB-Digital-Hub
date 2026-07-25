import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EmailService {
  private fadeInSubject = new BehaviorSubject<boolean>(false);
  fadeIn$ = this.fadeInSubject.asObservable();

  constructor() {}

  toggleFadeIn() {
    this.fadeInSubject.next(!this.fadeInSubject.value);
  }
}
