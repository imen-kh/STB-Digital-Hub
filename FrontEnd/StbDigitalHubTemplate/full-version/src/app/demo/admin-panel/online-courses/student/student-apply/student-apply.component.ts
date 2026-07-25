// angular import
import { Component, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';

// rxjs import
import { Observable } from 'rxjs';

// project import
import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';
import { studentApply } from './student-apply-type';
import { StudentApplyService } from './student-apply.service';

@Component({
  selector: 'app-student-apply',
  imports: [...SHARED_IMPORTS],
  templateUrl: './student-apply.component.html',
  styleUrl: './student-apply.component.scss',
  providers: [StudentApplyService, DecimalPipe]
})
export class StudentApplyComponent {
  service = inject(StudentApplyService);

  // public props
  studentApply$: Observable<studentApply[]>;
  total$: Observable<number>;

  // constructor
  constructor() {
    const service = this.service;

    this.studentApply$ = service.students$;
    this.total$ = service.total$;
  }
}
