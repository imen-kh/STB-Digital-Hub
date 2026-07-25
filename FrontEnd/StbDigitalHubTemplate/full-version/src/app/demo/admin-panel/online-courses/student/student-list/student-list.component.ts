// angular import
import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { DecimalPipe } from '@angular/common';

// rxjs import
import { Observable } from 'rxjs';

// project import
import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';
import { student } from './student-list-type';
import { StudentListService } from './student-list.service';

@Component({
  selector: 'app-student-list',
  imports: [...SHARED_IMPORTS, RouterModule],
  templateUrl: './student-list.component.html',
  styleUrl: './student-list.component.scss',
  providers: [StudentListService, DecimalPipe]
})
export class StudentListComponent {
  service = inject(StudentListService);

  // public props
  students$: Observable<student[]>;
  total$: Observable<number>;

  // constructor
  constructor() {
    const service = this.service;

    this.students$ = service.students$;
    this.total$ = service.total$;
  }
}
