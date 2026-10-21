import { test, expect } from '@playwright/test';

const mock = 'http://127.0.0.1:4900/retrovault';
test.beforeEach(async ({ request }) => {
  const reset = await request.post(`${mock}/__test/reset`);
  expect(reset.ok()).toBeTruthy();
});

test('busca con acentos y puntuación; conserva filtros en la URL', async ({ page }) => {
  await page.goto('/catalogo');
  await expect(page.locator('app-game-card')).toHaveCount(12);
  await page.getByRole('button', { name: 'Siguiente' }).click();
  await expect(page).toHaveURL(/page=2/);
  await expect(page.locator('app-game-card')).toHaveCount(1);
  await page.getByRole('searchbox', { name: 'Buscar juegos' }).fill('Pokémon');
  await page.getByRole('button', { name: 'Buscar', exact: false }).click();
  await expect(page.locator('app-game-card')).toHaveCount(1);
  await expect(page.getByRole('heading', { name: 'Pokémon Snap' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('searchbox')).toHaveValue('Pokémon');
  await page.getByRole('searchbox').fill('Castlevania: Symphony of the Night');
  await page.getByRole('button', { name: 'Buscar', exact: false }).click();
  await expect(page.locator('app-game-card')).toHaveCount(1);
  await page.getByRole('link', { name: 'Ver Castlevania: Symphony of the Night' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Castlevania: Symphony of the Night',
  );
});

test('agrega, cambia estado, persiste al recargar y quita con confirmación', async ({ page }) => {
  await page.goto('/juegos/1');
  const add = page.getByRole('button', { name: '+ Agregar a mi colección', exact: true });
  await expect(add).toBeEnabled();
  await add.click();
  await expect(page.getByRole('heading', { name: '✓ Pendiente' })).toBeVisible();
  await page.getByRole('link', { name: 'Administrar en mi colección' }).click();
  const status = page.getByRole('combobox', { name: 'Estado de Super Mario 64' });
  await status.selectOption('COMPLETED');
  await expect(page.getByRole('status')).toHaveText('Estado actualizado.');
  await page.reload();
  await expect(status).toHaveValue('COMPLETED');
  await page.getByRole('combobox', { name: 'Mostrar' }).selectOption('PLAYING');
  await expect(
    page.getByRole('heading', { name: 'Todavía no hay juegos con este estado' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Ver todos' }).click();
  await page.getByRole('button', { name: 'Quitar Super Mario 64' }).click();
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await expect(status).toBeVisible();
  await page.getByRole('button', { name: 'Quitar Super Mario 64' }).click();
  await page.getByRole('button', { name: 'Sí, quitar' }).click();
  await expect(
    page.getByRole('heading', { name: 'Tu historia empieza con un juego' }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'Tu historia empieza con un juego' }),
  ).toBeVisible();
});

test('muestra errores y permite reintentar el catálogo', async ({ page, request }) => {
  await request.post(`${mock}/__test/failure`, { data: { path: '/api/games', status: 503 } });
  await page.goto('/catalogo');
  await expect(page.getByRole('heading', { name: 'Se pausó la partida' })).toBeVisible();
  await request.post(`${mock}/__test/reset`);
  await page.getByRole('button', { name: 'Volver a intentar', exact: true }).click();
  await expect(page.locator('app-game-card')).toHaveCount(12);
});

test('un fallo al guardar conserva el estado anterior', async ({ page, request }) => {
  const created = await request.post(`${mock}/api/collection`, { data: { gameId: 1 } });
  const item = await created.json();
  await request.post(`${mock}/__test/failure`, {
    data: { path: `/api/collection/${item.id}`, method: 'PATCH', status: 503 },
  });
  await page.goto('/coleccion');
  const status = page.getByRole('combobox', { name: 'Estado de Super Mario 64' });
  await status.selectOption('COMPLETED');
  await expect(page.getByRole('alert')).toContainText('No pudimos completar');
  await expect(status).toHaveValue('BACKLOG');
});

test('una colección no disponible impide agregar; permite recuperar', async ({ page, request }) => {
  await request.post(`${mock}/__test/failure`, {
    data: { path: '/api/collection', method: 'GET', status: 503 },
  });
  await page.goto('/catalogo');
  await expect(page.locator('app-game-card')).toHaveCount(12);
  await expect(
    page.getByRole('button', { name: 'Agregar a colección: Chrono Trigger', exact: true }),
  ).toBeDisabled();
  await request.post(`${mock}/__test/reset`);
  await page.getByRole('button', { name: 'Reintentar colección' }).click();
  await expect(
    page.getByRole('button', { name: 'Agregar a colección: Chrono Trigger', exact: true }),
  ).toBeEnabled();
});

test('maneja búsquedas vacías, rutas inexistentes y pantalla estrecha', async ({
  page,
}, testInfo) => {
  await page.goto('/catalogo?q=un-juego-inexistente');
  await expect(page.getByRole('heading', { name: 'Ese clásico todavía no aparece' })).toBeVisible();
  await page.goto('/juegos/99999');
  await expect(page.getByRole('alert')).toContainText('No encontramos ese juego');
  await page.goto('/ruta-inexistente');
  await expect(page.getByRole('heading', { name: 'Esta partida no existe.' })).toBeVisible();
  await page.goto('/catalogo');
  await expect(page.locator('app-game-card')).toHaveCount(12);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  expect(overflow).toBe(false);
  await page.screenshot({ path: testInfo.outputPath('catalogo.png'), fullPage: true });
});
