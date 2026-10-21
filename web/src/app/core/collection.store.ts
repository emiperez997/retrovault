import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Api } from './api';
import { errorMessage } from './api';
import { BacklogStatus, CollectionItem } from './models';

@Injectable({ providedIn: 'root' })
export class CollectionStore {
  private readonly api = inject(Api);
  readonly items = signal<CollectionItem[]>([]);
  readonly loading = signal(false);
  readonly loaded = signal(false);
  readonly error = signal('');
  readonly busy = signal<number[]>([]);
  async load() {
    if (this.loading()) return;
    this.loading.set(true);
    this.error.set('');
    try {
      this.items.set(await firstValueFrom(this.api.collection()));
      this.loaded.set(true);
    } catch (e) {
      this.error.set(errorMessage(e));
    } finally {
      this.loading.set(false);
    }
  }
  itemFor(gameId: number) {
    return this.items().find((item) => item.game.id === gameId);
  }
  async add(gameId: number) {
    return this.mutate(gameId, async () => {
      const item = await firstValueFrom(this.api.add(gameId));
      this.items.update((items) => [item, ...items.filter((old) => old.id !== item.id)]);
    });
  }
  async change(item: CollectionItem, status: BacklogStatus) {
    return this.mutate(item.game.id, async () => {
      const updated = await firstValueFrom(this.api.update(item.id, status));
      this.items.update((items) => items.map((old) => (old.id === updated.id ? updated : old)));
    });
  }
  async remove(item: CollectionItem) {
    return this.mutate(item.game.id, async () => {
      await firstValueFrom(this.api.remove(item.id));
      this.items.update((items) => items.filter((old) => old.id !== item.id));
    });
  }
  private async mutate(gameId: number, operation: () => Promise<void>) {
    if (this.busy().includes(gameId)) return;
    this.busy.update((ids) => [...ids, gameId]);
    try {
      await operation();
    } finally {
      this.busy.update((ids) => ids.filter((id) => id !== gameId));
    }
  }
}
