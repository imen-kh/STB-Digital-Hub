// angular import
import { Injectable, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';

// rxjs
import { BehaviorSubject, Observable, of, Subject, debounceTime, delay, switchMap, tap } from 'rxjs';

// project import
import { studentApply } from './student-apply-type';
import { StudentApply } from './student-apply-data';
import { SortDirection } from '../../../../../theme/shared/directive/sortable.directive';

interface SearchResult {
  students: studentApply[];
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
function sort(students: any, column: string, direction: string): studentApply[] {
  if (direction === '' || column === '') {
    return students;
  } else {
    return [...students].sort((a, b) => {
      const res = compare(a[column], b[column]);
      return direction === 'asc' ? res : -res;
    });
  }
}

function matches(studentApply: studentApply, term: string) {
  return (
    studentApply.name.toLowerCase().includes(term.toLowerCase()) ||
    studentApply.email.toLowerCase().includes(term.toLowerCase()) ||
    studentApply.qualification.toLowerCase().includes(term.toLowerCase()) ||
    studentApply.mobile.toLowerCase().includes(term.toLowerCase()) ||
    studentApply.date.toLowerCase().includes(term.toLowerCase())
  );
}

@Injectable({ providedIn: 'root' })
export class StudentApplyService {
  private pipe = inject(DecimalPipe);

  private _loading$ = new BehaviorSubject<boolean>(true);
  private _search$ = new Subject<void>();
  private _student$ = new BehaviorSubject<studentApply[]>([]);
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
        this._student$.next(result.students);
        this._total$.next(result.total);
      });

    this._search$.next();
  }

  get students$() {
    return this._student$.asObservable();
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
    let students = sort(StudentApply, sortColumn, sortDirection);

    // 2. filter
    students = students.filter((studentApply) => matches(studentApply, searchTerm));
    const total = students.length;

    // 3. paginate
    students = students.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize);
    return of({ students, total });
  }
}
