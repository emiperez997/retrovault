import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subject, catchError, combineLatest, of, startWith, switchMap, tap } from 'rxjs';
import { Api, errorMessage } from '../core/api';
import { CollectionStore } from '../core/collection.store';
import { Game, statusLabel } from '../core/models';
import { GameArt } from '../shared/game-art';

@Component({
  imports: [RouterLink, GameArt],
  template: `
    <a class="back-link" routerLink="/catalogo">← Volver al catálogo</a>
    @if (loading()) {
      <div class="empty-state" aria-busy="true"><p>Cargando juego…</p></div>
    } @else if (error()) {
      <div class="empty-state" role="alert">
        <h1>No pudimos abrir la ficha</h1>
        <p>{{ error() }}</p>
        <button class="button" (click)="retry()">Reintentar</button>
      </div>
    } @else if (game(); as g) {
      <article class="detail-layout">
        <div class="detail-art"><app-game-art [game]="g" /></div>
        <div class="detail-copy">
          <p class="eyebrow">EL ARCHIVO / {{ g.platform.name }}</p>
          <h1>{{ g.title }}</h1>
          <div class="detail-facts">
            <div>
              <span>PLATAFORMA</span><strong>{{ g.platform.name }}</strong>
            </div>
            <div>
              <span>LANZAMIENTO</span><strong>{{ g.releaseYear ?? 'Sin datos' }}</strong>
            </div>
            <div>
              <span>REGIÓN</span
              ><strong>{{
                g.region === 'UNKNOW' || g.region === 'UNKNOWN'
                  ? 'Sin datos'
                  : g.region.replace('_', '-')
              }}</strong>
            </div>
          </div>
          @if (store.itemFor(g.id); as item) {
            <div class="collection-callout">
              <p class="eyebrow">YA ES PARTE DE TU HISTORIA</p>
              <h2>✓ {{ label(item.status) }}</h2>
              <a class="text-link" routerLink="/coleccion">Administrar en mi colección ↗</a>
            </div>
          } @else {
            <div class="collection-callout">
              <h2>Tu próxima partida, a un clic.</h2>
              <p>Agregalo a tu colección para organizar lo que querés jugar.</p>
              <button
                class="button primary"
                [disabled]="
                  !store.loaded() ||
                  store.loading() ||
                  !!store.error() ||
                  store.busy().includes(g.id)
                "
                (click)="add(g.id)"
              >
                {{ store.busy().includes(g.id) ? 'Guardando…' : '+ Agregar a mi colección' }}
              </button>
            </div>
          }
          @if (store.error()) {
            <div class="notice" role="alert">
              <span>{{ store.error() }}</span
              ><button class="button small" (click)="store.load()" [disabled]="store.loading()">
                Reintentar colección
              </button>
            </div>
          }
          @if (actionError()) {
            <p role="alert" class="inline-error">{{ actionError() }}</p>
          }
        </div>
      </article>
    }
  `,
})
export class DetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(Api);
  private readonly refresh = new Subject<void>();
  readonly store = inject(CollectionStore);
  readonly game = signal<Game | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly actionError = signal('');
  readonly label = statusLabel;
  constructor() {
    combineLatest([this.route.paramMap, this.refresh.pipe(startWith(undefined))])
      .pipe(
        tap(() => {
          this.loading.set(true);
          this.error.set('');
          this.actionError.set('');
        }),
        switchMap(([params]) => {
          const id = Number(params.get('id'));
          if (!Number.isSafeInteger(id) || id < 1) {
            this.error.set('No encontramos ese juego.');
            return of(null);
          }
          return this.api.game(id).pipe(
            catchError((e) => {
              this.error.set(errorMessage(e));
              return of(null);
            }),
          );
        }),
        takeUntilDestroyed(inject(DestroyRef)),
      )
      .subscribe((game) => {
        this.game.set(game);
        this.loading.set(false);
      });
  }
  retry() {
    this.refresh.next();
  }
  async add(id: number) {
    this.actionError.set('');
    try {
      await this.store.add(id);
    } catch (e) {
      this.actionError.set(errorMessage(e));
    }
  }
}
