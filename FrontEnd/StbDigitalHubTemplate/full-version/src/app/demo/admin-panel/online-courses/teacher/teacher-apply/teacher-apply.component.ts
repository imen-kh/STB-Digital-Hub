// angular import
import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { DecimalPipe } from '@angular/common';

// rxjs import
import { Observable } from 'rxjs';

// project import
import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';
import { teacherApply } from './teacher-apply-type';
import { TeacherApplyService } from './teacher-apply.service';

@Component({
  selector: 'app-teacher-apply',
  imports: [...SHARED_IMPORTS],
  templateUrl: './teacher-apply.component.html',
  styleUrl: './teacher-apply.component.scss',
  providers: [TeacherApplyService, DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TeacherApplyComponent {
  service = inject(TeacherApplyService);

  // public props
  teacherApply$: Observable<teacherApply[]>;
  total$: Observable<number>;

  // constructor
  constructor() {
    const service = this.service;

    this.teacherApply$ = service.teachers$;
    this.total$ = service.total$;
  }
}
