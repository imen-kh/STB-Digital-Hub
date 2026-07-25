// angular import
import { Injectable, PipeTransform, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';

// rxjs import
import { BehaviorSubject, Observable, of, Subject, debounceTime, delay, switchMap, tap } from 'rxjs';

// project import
import { productReview } from './product-review';
import { PRODUCTS_REVIEW } from './product-review-data';
import { SortDirection } from '../../../../../theme/shared/directive/sortable.directive';

interface SearchResult {
  productReview: productReview[];
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
function sort(productReview: any, column: string, direction: string): productReview[] {
  if (direction === '' || column === '') {
    return productReview;
  } else {
    return [...productReview].sort((a, b) => {
      const res = compare(a[column], b[column]);
      return direction === 'asc' ? res : -res;
    });
  }
}

function matches(productReview: productReview, term: string, pipe: PipeTransform) {
  return (
    productReview.name.toLowerCase().includes(term.toLowerCase()) ||
    productReview.author.toLowerCase().includes(term.toLowerCase()) ||
    productReview.review.toLowerCase().includes(term.toLowerCase()) ||
    productReview.date.toLowerCase().includes(term.toLowerCase()) ||
    productReview.status.toLowerCase().includes(term.toLowerCase()) ||
    pipe.transform(productReview.rating).includes(term)
  );
}

@Injectable({
  providedIn: 'root'
})
export class ProductReviewService {
  private pipe = inject(DecimalPipe);

  private _loading$ = new BehaviorSubject<boolean>(true);
  private _search$ = new Subject<void>();
  private _productReview$ = new BehaviorSubject<productReview[]>([]);
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
        this._productReview$.next(result.productReview);
        this._total$.next(result.total);
      });

    this._search$.next();
  }

  get productReview$() {
    return this._productReview$.asObservable();
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
    let productReview = sort(PRODUCTS_REVIEW, sortColumn, sortDirection);

    // 2. filter
    productReview = productReview.filter((PRODUCTS_REVIEW) => matches(PRODUCTS_REVIEW, searchTerm, this.pipe));
    const total = productReview.length;

    // 3. paginate
    productReview = productReview.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize);
    return of({ productReview, total });
  }
}
