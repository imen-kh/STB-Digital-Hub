// angular import
import { Injectable } from '@angular/core';

// rxjs
import { BehaviorSubject, Observable, of, Subject, debounceTime, delay, switchMap, tap } from 'rxjs';

// project import
import { membership } from './membership-list-type';
import { MEMBERSHIP } from './membership-list-data';
import { SortDirection } from '../../../../theme/shared/directive/sortable.directive';

interface SearchResult {
  memberships: membership[];
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
function sort(memberships: any, column: string, direction: string): membership[] {
  if (direction === '' || column === '') {
    return memberships;
  } else {
    return [...memberships].sort((a, b) => {
      const res = compare(a[column], b[column]);
      return direction === 'asc' ? res : -res;
    });
  }
}

function matches(membership: membership, term: string) {
  return (
    membership.name.toLowerCase().includes(term.toLowerCase()) ||
    membership.mobile.toLowerCase().includes(term.toLowerCase()) ||
    membership.date.toLowerCase().includes(term.toLowerCase()) ||
    membership.time.toLowerCase().includes(term.toLowerCase()) ||
    membership.status.toLowerCase().includes(term.toLowerCase()) ||
    membership.plan.toLowerCase().includes(term.toLowerCase())
  );
}

@Injectable({ providedIn: 'root' })
export class MembershipListService {
  private _loading$ = new BehaviorSubject<boolean>(true);
  private _search$ = new Subject<void>();
  private _membership$ = new BehaviorSubject<membership[]>([]);
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
        this._membership$.next(result.memberships);
        this._total$.next(result.total);
      });

    this._search$.next();
  }

  get memberships$() {
    return this._membership$.asObservable();
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
    let memberships = sort(MEMBERSHIP, sortColumn, sortDirection);

    // 2. filter
    memberships = memberships.filter((membership) => matches(membership, searchTerm));
    const total = memberships.length;

    // 3. paginate
    memberships = memberships.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize);
    return of({ memberships, total });
  }
}
