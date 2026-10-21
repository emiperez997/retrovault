import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
@Component({
  imports: [RouterLink],
  template: `<section class="empty-state">
    <p class="eyebrow">ERROR 404</p>
    <h1>Esta partida no existe.</h1>
    <p>La página que buscás no está en el archivo.</p>
    <a class="button primary" routerLink="/catalogo">Volver al catálogo</a>
  </section>`,
})
export class NotFoundPage {}
