import { Component, input, signal } from '@angular/core';
import { Game } from '../core/models';
@Component({
  selector: 'app-game-art',
  host: { '[class]': '"game-art " + game().platform.slug' },
  template: `
    @if (game().coverUrl && !failed()) {
      <img
        [src]="game().coverUrl"
        [alt]="'Portada de ' + game().title"
        loading="lazy"
        (error)="failed.set(true)"
      />
    } @else {
      <div class="art-grid" aria-hidden="true"></div>
      <span class="art-platform" aria-hidden="true">{{ game().platform.slug }}</span>
      <div class="cartridge" aria-hidden="true">
        <div class="cartridge-ridges"></div>
        <div class="cartridge-label">
          <span>RETROVAULT ARCHIVE</span><strong>{{ game().title }}</strong
          ><small>{{ game().releaseYear ?? '—' }} <span>✦</span> {{ game().platform.slug }}</small>
        </div>
        <div class="cartridge-notch"></div>
      </div>
      <span class="art-caption">Portada no disponible</span>
    }
  `,
})
export class GameArt {
  readonly game = input.required<Game>();
  readonly failed = signal(false);
}
