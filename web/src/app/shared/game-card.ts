import { Component, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CollectionStore } from '../core/collection.store';
import { Game } from '../core/models';
import { errorMessage } from '../core/api';
import { GameArt } from './game-art';
@Component({
  selector: 'app-game-card',
  imports: [RouterLink, GameArt],
  template: `
    <article class="game-card">
      <a
        class="art-link"
        [routerLink]="['/juegos', game().id]"
        [attr.aria-label]="'Ver ' + game().title"
        ><app-game-art [game]="game()"
      /></a>
      <div class="card-content">
        <div class="card-meta">
          <span class="platform-pill" [attr.data-platform]="game().platform.slug">{{
            game().platform.name
          }}</span
          ><span class="mono">{{ game().releaseYear ?? '—' }}</span>
        </div>
        <h3>
          <a [routerLink]="['/juegos', game().id]">{{ game().title }}</a>
        </h3>
        <div class="card-bottom">
          <span class="region mono">{{
            game().region === 'UNKNOW' || game().region === 'UNKNOWN'
              ? 'Sin región'
              : game().region.replace('_', '-')
          }}</span>
          <button
            class="add-button"
            [disabled]="
              !!store.itemFor(game().id) ||
              !store.loaded() ||
              !!store.error() ||
              store.loading() ||
              store.busy().includes(game().id)
            "
            (click)="add()"
            [attr.aria-label]="
              (store.itemFor(game().id) ? 'En tu colección: ' : 'Agregar a colección: ') +
              game().title
            "
          >
            {{
              store.itemFor(game().id)
                ? '✓ En colección'
                : store.busy().includes(game().id)
                  ? 'Guardando…'
                  : '+ Agregar'
            }}
          </button>
        </div>
        @if (error()) {
          <p class="inline-error" role="alert">{{ error() }}</p>
        }
      </div>
    </article>
  `,
})
export class GameCard {
  readonly game = input.required<Game>();
  readonly store = inject(CollectionStore);
  readonly error = signal('');
  async add() {
    this.error.set('');
    try {
      await this.store.add(this.game().id);
    } catch (e) {
      this.error.set(errorMessage(e));
    }
  }
}
