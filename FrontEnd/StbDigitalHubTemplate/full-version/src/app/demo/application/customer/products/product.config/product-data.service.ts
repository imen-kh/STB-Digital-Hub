// angular import
import { Injectable, PipeTransform, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';

// rxjs import
import { BehaviorSubject, Observable, of, Subject, debounceTime, delay, switchMap, tap } from 'rxjs';

// project import
import { product } from './product';
import { PRODUCTS } from './product-data';
import { SortDirection } from '../../../../../theme/shared/directive/sortable.directive';

interface SearchResult {
  product: product[];
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
export class ProductDataService {
  private pipe = inject(DecimalPipe);

  private _loading$ = new BehaviorSubject<boolean>(true);
  private _search$ = new Subject<void>();
  private _products$ = new BehaviorSubject<product[]>([]);
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
        this._products$.next(result.product);
        this._total$.next(result.total);
      });

    this._search$.next();
  }

  get product$() {
    return this._products$.asObservable();
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
    let product = sort(PRODUCTS, sortColumn, sortDirection);

    // 2. filter
    product = product.filter((PRODUCTS) => matches(PRODUCTS, searchTerm, this.pipe));
    const total = product.length;

    // 3. paginate
    product = product.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize);
    return of({ product, total });
  }
}

// eslint-disable-next-line
function sort(products: any, column: string, direction: string): product[] {
  if (direction === '' || column === '') {
    return products;
  } else {
    return [...products].sort((a, b) => {
      const res = compare(a[column], b[column]);
      return direction === 'asc' ? res : -res;
    });
  }
}

function matches(product: product, term: string, pipe: PipeTransform) {
  return (
    product.id.toLowerCase().includes(term.toLowerCase()) ||
    product.name.toLowerCase().includes(term.toLowerCase()) ||
    product.category.toLowerCase().includes(term.toLowerCase()) ||
    product.date.toLowerCase().includes(term.toLowerCase()) ||
    pipe.transform(product.quantity).includes(term) ||
    pipe.transform(product.price).includes(term)
  );
}
