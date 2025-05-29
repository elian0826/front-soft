// app.routes.ts
import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'reserva',
    loadComponent: () => import('./component/reserva/reserva.component').then(m => m.ReservaComponent)
  },
];
