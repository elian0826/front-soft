import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MonedaService } from '../../services/moneda.service';
import { Moneda } from '../../dto/Moneda'

@Component({
  selector: 'app-moneda',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './moneda.component.html',
  styleUrls: ['./moneda.component.css'],
})
export class MonedaComponent {
  monedas: Moneda[] = [];
  moneda: Moneda = { tipo_moneda: '' };

  constructor(private monedaService: MonedaService) {
    this.listar();
  }

  listar(): void {
    this.monedaService.listarTodos().subscribe((data) => {
      this.monedas = data;
    });
  }

  guardar(): void {
    if (this.moneda.id) {
      this.monedaService.actualizar(this.moneda.id, this.moneda).subscribe(() => {
        this.limpiar();
        this.listar();
      });
    } else {
      this.monedaService.insertar(this.moneda).subscribe(() => {
        this.limpiar();
        this.listar();
      });
    }
  }

  eliminar(id: number): void {
    this.monedaService.eliminar(id).subscribe(() => {
      this.listar();
    });
  }

  seleccionar(moneda: Moneda): void {
    this.moneda = { ...moneda };
  }

  limpiar(): void {
    this.moneda = { tipo_moneda: '' };
  }
}
