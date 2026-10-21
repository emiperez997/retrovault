import { Routes } from '@angular/router';
export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'catalogo' },
  {
    path: 'catalogo',
    title: 'Catálogo · RetroVault',
    loadComponent: () => import('./pages/catalog').then((m) => m.CatalogPage),
  },
  {
    path: 'juegos/:id',
    title: 'Ficha de juego · RetroVault',
    loadComponent: () => import('./pages/detail').then((m) => m.DetailPage),
  },
  {
    path: 'coleccion',
    title: 'Mi colección · RetroVault',
    loadComponent: () => import('./pages/collection').then((m) => m.CollectionPage),
  },
  {
    path: '**',
    title: 'Página no encontrada · RetroVault',
    loadComponent: () => import('./pages/not-found').then((m) => m.NotFoundPage),
  },
];
