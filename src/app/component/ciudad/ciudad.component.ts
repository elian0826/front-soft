import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CiudadService } from '../../services/ciudad.service';
import { Ciudad } from '../../dto/Ciudad';

@Component({
  selector: 'app-ciudad',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ciudad.component.html',
  styleUrls: ['./ciudad.component.css'],
})
export class CiudadComponent {
  ciudades: Ciudad[] = [];
  ciudad: Ciudad = { id: 0, nombre: '', pais_id: 0 };

  constructor(private ciudadService: CiudadService) {
    this.listarTodos();
  }

  listarTodos(): void {
    this.ciudadService.listarTodos().subscribe((data) => {
      this.ciudades = data;
    });
  }

  guardar(): void {
    if (this.ciudad.id) {
      this.ciudadService.actualizar(this.ciudad.id, this.ciudad).subscribe(() => {
        this.limpiar();
        this.listarTodos();
      });
    } else {
      this.ciudadService.insertar(this.ciudad).subscribe(() => {
        this.limpiar();
        this.listarTodos();
      });
    }
  }

  eliminar(id: number): void {
    this.ciudadService.eliminar(id).subscribe(() => {
      this.listarTodos();
    });
  }

  seleccionar(c: Ciudad): void {
    this.ciudad = { ...c };
  }

  limpiar(): void {
    this.ciudad = { id: 0, nombre: '', pais_id: 0 };
  }
}
