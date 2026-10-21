import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, catchError, combineLatest, of, startWith, switchMap, tap } from 'rxjs';
import { Api, errorMessage } from '../core/api';
import { CollectionStore } from '../core/collection.store';
import { GamePage } from '../core/models';
import { GameCard } from '../shared/game-card';

@Component({ imports: [FormsModule, RouterLink, GameCard], templateUrl: './catalog.html' })
export class CatalogPage {
  private readonly api = inject(Api);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly refresh = new Subject<void>();
  readonly store = inject(CollectionStore);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly result = signal<GamePage>({ items: [], total: 0, page: 1, pageSize: 12 });
  readonly query = signal('');
  searchText = '';
  readonly skeletons = Array.from({ length: 8 }, (_, i) => i);
  constructor() {
    combineLatest([this.route.queryParamMap, this.refresh.pipe(startWith(undefined))])
      .pipe(
        tap(([params]) => {
          this.query.set(params.get('q') ?? '');
          this.searchText = this.query();
          this.loading.set(true);
          this.error.set('');
        }),
        switchMap(([params]) => {
          const requested = Number(params.get('page'));
          const page =
            Number.isSafeInteger(requested) && requested > 0 && requested < 100000 ? requested : 1;
          return this.api.games(this.query(), page).pipe(
            catchError((e) => {
              this.error.set(errorMessage(e));
              return of(null);
            }),
          );
        }),
        takeUntilDestroyed(inject(DestroyRef)),
      )
      .subscribe((result) => {
        if (result) this.result.set(result);
        this.loading.set(false);
      });
  }
  search() {
    void this.router.navigate(['/catalogo'], {
      queryParams: { q: this.searchText.trim() || null },
    });
  }
  page(value: number) {
    void this.router.navigate(['/catalogo'], {
      queryParams: { q: this.query() || null, page: value === 1 ? null : value },
    });
  }
  retry() {
    this.refresh.next();
  }
  get totalPages() {
    return Math.max(1, Math.ceil(this.result().total / this.result().pageSize));
  }
}
