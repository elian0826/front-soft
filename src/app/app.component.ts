import { Component } from '@angular/core';
import { ReservaComponent } from './component/reserva/reserva.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ReservaComponent],
  template: `<app-reserva></app-reserva>`,
})
export class AppComponent {}
