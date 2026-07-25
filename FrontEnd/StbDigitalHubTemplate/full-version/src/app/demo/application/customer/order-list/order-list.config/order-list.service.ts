// angular import
import { Injectable, PipeTransform, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';

// rxjs import
import { BehaviorSubject, Observable, of, Subject, debounceTime, delay, switchMap, tap } from 'rxjs';

// project import
import { orderList } from './order-list';
import { ORDER } from './order';
import { SortDirection } from '../../../../../theme/shared/directive/sortable.directive';

interface SearchResult {
  order: orderList[];
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

@Injectable({
  providedIn: 'root'
})
export class OrderListService {
  private pipe = inject(DecimalPipe);

  private _loading$ = new BehaviorSubject<boolean>(true);
  private _search$ = new Subject<void>();
  private _orderList$ = new BehaviorSubject<orderList[]>([]);
  private _total$ = new BehaviorSubject<number>(0);

  private _state: State = {
    page: 1,
    pageSize: 5,
    searchTerm: '',
    sortColumn: '',
    sortDirection: ''
  };

  // constructor
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
        this._orderList$.next(result.order);
        this._total$.next(result.total);
      });

    this._search$.next();
  }

  get orderList$() {
    return this._orderList$.asObservable();
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
  set page(page: number) {
    this._set({ page });
  }
  get pageSize() {
    return this._state.pageSize;
  }
  set pageSize(pageSize: number) {
    this._set({ pageSize });
  }
  get searchTerm() {
    return this._state.searchTerm;
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
    let order = sort(ORDER, sortColumn, sortDirection);

    // 2. filter
    order = order.filter((ORDER) => matches(ORDER, searchTerm, this.pipe));
    const total = order.length;

    // 3. paginate
    order = order.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize);
    return of({ order, total });
  }
}

// eslint-disable-next-line
function sort(order: any, column: string, direction: string): orderList[] {
  if (direction === '' || column === '') {
    return order;
  } else {
    return [...order].sort((a, b) => {
      const res = compare(a[column], b[column]);
      return direction === 'asc' ? res : -res;
    });
  }
}

function matches(order: orderList, term: string, pipe: PipeTransform) {
  return (
    order.id.toLowerCase().includes(term.toLowerCase()) ||
    order.customer_name.toLowerCase().includes(term.toLowerCase()) ||
    order.branch.toLowerCase().includes(term.toLowerCase()) ||
    order.payment_type.toLowerCase().includes(term.toLowerCase()) ||
    order.registered.toLowerCase().includes(term.toLowerCase()) ||
    order.status.toLowerCase().includes(term.toLowerCase()) ||
    pipe.transform(order.quantity).includes(term)
  );
}
