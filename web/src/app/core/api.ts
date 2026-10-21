import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { timeout } from 'rxjs';
import { BacklogStatus, CollectionItem, Game, GamePage, normalizeSearch } from './models';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class Api {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl.replace(/\/$/, '');
  games(query: string, page: number) {
    let params = new HttpParams().set('page', page).set('page_size', 12);
    const normalized = normalizeSearch(query);
    if (normalized) params = params.set('q', normalized);
    return this.http.get<GamePage>(`${this.base}/games`, { params }).pipe(timeout(12000));
  }
  game(id: number) {
    return this.http.get<Game>(`${this.base}/games/${id}`).pipe(timeout(12000));
  }
  collection() {
    return this.http.get<CollectionItem[]>(`${this.base}/collection`).pipe(timeout(12000));
  }
  add(gameId: number) {
    return this.http
      .post<CollectionItem>(`${this.base}/collection`, { gameId })
      .pipe(timeout(12000));
  }
  update(id: number, status: BacklogStatus) {
    return this.http
      .patch<CollectionItem>(`${this.base}/collection/${id}`, { status })
      .pipe(timeout(12000));
  }
  remove(id: number) {
    return this.http.delete<void>(`${this.base}/collection/${id}`).pipe(timeout(12000));
  }
}
export function errorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0)
      return 'No pudimos conectar con RetroVault. Comprobá que la API esté encendida e intentá de nuevo.';
    if (error.status === 404) return 'No encontramos ese juego o ítem de la colección.';
    if (error.status === 409)
      return 'Ese juego ya está en tu colección. Actualizá la colección para verlo.';
    if (error.status === 429)
      return 'Hay demasiadas solicitudes. Esperá un momento y volvé a intentar.';
  }
  if (error instanceof Error && error.name === 'TimeoutError')
    return 'La API está tardando demasiado. Volvé a intentar en un momento.';
  return 'No pudimos completar la operación. Volvé a intentar.';
}
