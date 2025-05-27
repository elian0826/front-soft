import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PaisesService } from '../../services/pais.service';
import { Paises } from '../../dto/Pais';

@Component({
  selector: 'app-paises',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './paises.component.html',
  styleUrls: ['./paises.component.css'],
})
export class PaisesComponent implements OnInit {
  private paisService = inject(PaisesService);

  paises: Paises[] = [];
  pais: Paises = this.nuevoPais();

  ngOnInit(): void {
    this.cargarPaises();
  }

  cargarPaises() {
    this.paisService.listarTodos().subscribe({
      next: (data) => (this.paises = data),
      error: (err) => console.error('Error cargando países', err),
    });
  }

  guardar() {
    if (this.pais.id) {
      this.paisService.actualizar(this.pais.id, this.pais).subscribe({
        next: () => {
          alert('País actualizado');
          this.limpiar();
          this.cargarPaises();
        },
        error: (err) => alert('Error actualizando: ' + err.message),
      });
    } else {
      this.paisService.insertar(this.pais).subscribe({
        next: () => {
          alert('País insertado');
          this.limpiar();
          this.cargarPaises();
        },
        error: (err) => alert('Error insertando: ' + err.message),
      });
    }
  }

  seleccionar(pais: Paises) {
    this.pais = { ...pais };
  }

  eliminar(id: number) {
    if (confirm('¿Deseas eliminar este país?')) {
      this.paisService.eliminar(id).subscribe({
        next: () => {
          alert('País eliminado');
          this.limpiar();
          this.cargarPaises();
        },
        error: (err) => alert('Error eliminando: ' + err.message),
      });
    }
  }

  limpiar() {
    this.pais = this.nuevoPais();
  }

  private nuevoPais(): Paises {
    return { nombre: '' };
  }
}
