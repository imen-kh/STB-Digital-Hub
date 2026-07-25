// angular import
import { Injectable, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';

// rxjs
import { BehaviorSubject, Observable, of, Subject, debounceTime, delay, switchMap, tap } from 'rxjs';

// project import
import { teacher } from './teacher-list-type';
import { TEACHER } from './teacher-list-data';
import { SortDirection } from '../../../../../theme/shared/directive/sortable.directive';

interface SearchResult {
  teachers: teacher[];
  total: number;
}

interface State {
  page: number;
  pageSize: number;
  searchTerm: string;
  sortColumn: string;
  sortDirection: SortDirection;
}

const compare = (v1: string | number, v2: string | number) => (v1 < v2 ? -1 : v1 > v2 ? 1 : 0);
// eslint-disable-next-line
function sort(teachers: any, column: string, direction: string): teacher[] {
  if (direction === '' || column === '') {
    return teachers;
  } else {
    return [...teachers].sort((a, b) => {
      const res = compare(a[column], b[column]);
      return direction === 'asc' ? res : -res;
    });
  }
}

function matches(teacher: teacher, term: string) {
  return (
    teacher.name.toLowerCase().includes(term.toLowerCase()) ||
    teacher.departments.toLowerCase().includes(term.toLowerCase()) ||
    teacher.qualification.toLowerCase().includes(term.toLowerCase()) ||
    teacher.mobile.toLowerCase().includes(term.toLowerCase()) ||
    teacher.date.toLowerCase().includes(term.toLowerCase())
  );
}

@Injectable({ providedIn: 'root' })
export class TeacherListService {
  private pipe = inject(DecimalPipe);

  private _loading$ = new BehaviorSubject<boolean>(true);
  private _search$ = new Subject<void>();
  private _teacher$ = new BehaviorSubject<teacher[]>([]);
  private _total$ = new BehaviorSubject<number>(0);

  private _state: State = {
    page: 1,
    pageSize: 5,
    searchTerm: '',
    sortColumn: '',
    sortDirection: ''
  };

  constructor() {
    this._search$
      .pipe(
        tap(() => this._loading$.next(true)),
        debounceTime(200),
        switchMap(() => this._search()),
        delay(200),
        tap(() => this._loading$.next(false))
      )
      .subscribe((result) => {
        this._teacher$.next(result.teachers);
        this._total$.next(result.total);
      });

    this._search$.next();
  }

  get teachers$() {
    return this._teacher$.asObservable();
  }
  get total$() {
    return this._total$.asObservable();
  }
  get loading$() {
    return this._loading$.asObservable();
  }
  get page() {
    return this._state.page;
  }
  get pageSize() {
    return this._state.pageSize;
  }
  get searchTerm() {
    return this._state.searchTerm;
  }

  set page(page: number) {
    this._set({ page });
  }
  set pageSize(pageSize: number) {
    this._set({ pageSize });
  }
  set searchTerm(searchTerm: string) {
    this._set({ searchTerm });
  }
  set sortColumn(sortColumn: string) {
    this._set({ sortColumn });
  }
  set sortDirection(sortDirection: SortDirection) {
    this._set({ sortDirection });
  }

  private _set(patch: Partial<State>) {
    Object.assign(this._state, patch);
    this._search$.next();
  }

  private _search(): Observable<SearchResult> {
    const { sortColumn, sortDirection, pageSize, page, searchTerm } = this._state;

    // 1. sort
    let teachers = sort(TEACHER, sortColumn, sortDirection);

    // 2. filter
    teachers = teachers.filter((teacher) => matches(teacher, searchTerm));
    const total = teachers.length;

    // 3. paginate
    teachers = teachers.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize);
    return of({ teachers, total });
  }
}
