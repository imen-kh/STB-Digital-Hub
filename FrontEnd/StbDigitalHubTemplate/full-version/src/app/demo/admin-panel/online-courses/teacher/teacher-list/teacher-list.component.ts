// angular import
import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterModule } from '@angular/router';
import { DecimalPipe } from '@angular/common';

// rxjs import
import { Observable } from 'rxjs';

// project import
import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';
import { teacher } from './teacher-list-type';
import { TeacherListService } from './teacher-list.service';

// icon service

@Component({
  selector: 'app-teacher-list',
  imports: [...SHARED_IMPORTS, RouterModule],
  templateUrl: './teacher-list.component.html',
  styleUrl: './teacher-list.component.scss',
  providers: [TeacherListService, DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TeacherListComponent {
  service = inject(TeacherListService);

  // public props
  teachers$: Observable<teacher[]>;
  total$: Observable<number>;

  // constructor
  constructor() {
    const service = this.service;

    this.teachers$ = service.teachers$;
    this.total$ = service.total$;
  }
}
