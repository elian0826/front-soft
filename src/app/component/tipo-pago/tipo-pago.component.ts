import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TipoPagoService } from '../../services/tipo-pago.service';
import { TipoPago } from '../../dto/TipoPago';

@Component({
  selector: 'app-tipo-pago',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tipo-pago.component.html',
  styleUrls: ['./tipo-pago.component.css'],
})
export class TipoPagoComponent {
  tiposPago: TipoPago[] = [];
  tipoPago: TipoPago = { medio_pago: '' };

  constructor(private tipoPagoService: TipoPagoService) {
    this.listarTodos();
  }

  listarTodos(): void {
    fetch('http://localhost:8080/api/tipo-pago')
      .then((res) => res.json())
      .then((data) => (this.tiposPago = data));
  }

  guardar(): void {
    if (this.tipoPago.id) {
      this.tipoPagoService.actualizar(this.tipoPago.id, this.tipoPago).subscribe(() => {
        this.limpiar();
        this.listarTodos();
      });
    } else {
      this.tipoPagoService.crear(this.tipoPago).subscribe(() => {
        this.limpiar();
        this.listarTodos();
      });
    }
  }

  eliminar(id: number): void {
    this.tipoPagoService.eliminar(id).subscribe(() => {
      this.listarTodos();
    });
  }

  seleccionar(tipo: TipoPago): void {
    this.tipoPago = { ...tipo };
  }

  limpiar(): void {
    this.tipoPago = { medio_pago: '' };
  }
}
