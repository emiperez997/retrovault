import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CollectionStore } from '../core/collection.store';
import { errorMessage } from '../core/api';
import { BacklogStatus, CollectionItem, STATUSES } from '../core/models';
import { GameArt } from '../shared/game-art';
@Component({ imports: [FormsModule, RouterLink, GameArt], templateUrl: './collection.html' })
export class CollectionPage {
  readonly store = inject(CollectionStore);
  readonly statuses = STATUSES;
  readonly filter = signal('');
  readonly error = signal('');
  readonly message = signal('');
  readonly confirming = signal<number | null>(null);
  readonly visible = computed(() =>
    this.store.items().filter((item) => !this.filter() || item.status === this.filter()),
  );
  readonly completed = computed(
    () => this.store.items().filter((item) => item.status === 'COMPLETED').length,
  );
  readonly playing = computed(
    () => this.store.items().filter((item) => item.status === 'PLAYING').length,
  );
  async change(item: CollectionItem, event: Event) {
    const select = event.target as HTMLSelectElement;
    const status = select.value as BacklogStatus;
    this.error.set('');
    this.message.set('');
    try {
      await this.store.change(item, status);
      this.message.set('Estado actualizado.');
    } catch (e) {
      this.error.set(errorMessage(e));
    } finally {
      select.value = this.store.itemFor(item.game.id)?.status ?? item.status;
    }
  }
  async remove(item: CollectionItem) {
    this.error.set('');
    this.message.set('');
    try {
      await this.store.remove(item);
      this.confirming.set(null);
      this.message.set('Juego quitado de la colección.');
    } catch (e) {
      this.error.set(errorMessage(e));
    }
  }
}
