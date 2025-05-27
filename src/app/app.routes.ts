// app.routes.ts
import { Routes } from '@angular/router';
import { ReservaComponent } from './component/reserva/reserva.component';

export const routes: Routes = [
    { path: '', redirectTo: '/reservas', pathMatch: 'full' },
    { path: 'reservas', component: ReservaComponent }
];
