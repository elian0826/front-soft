import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AerolineaService } from '../../services/aerolinea.service';
import { Aerolinea } from '../../dto/Aerolinea';

@Component({
  selector: 'app-aerolinea',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './aerolinea.component.html',
  styleUrls: ['./aerolinea.component.css'],
})
export class AerolineaComponent implements OnInit {
  private aerolineaService = inject(AerolineaService);

  aerolineas: Aerolinea[] = [];
  aerolinea: Aerolinea = this.nuevaAerolinea();

  ngOnInit() {
    this.cargarAerolineas();
  }

  cargarAerolineas() {
    this.aerolineaService.listarTodas().subscribe({
      next: (data) => (this.aerolineas = data),
      error: (err) => console.error('Error al listar aerolíneas', err),
    });
  }

  guardar() {
    if (this.aerolinea.id) {
      this.aerolineaService.actualizar(this.aerolinea.id, this.aerolinea).subscribe({
        next: () => {
          alert('Aerolínea actualizada');
          this.limpiar();
          this.cargarAerolineas();
        },
        error: (err) => alert('Error actualizando: ' + err.message),
      });
    } else {
      this.aerolineaService.insertar(this.aerolinea).subscribe({
        next: () => {
          alert('Aerolínea insertada');
          this.limpiar();
          this.cargarAerolineas();
        },
        error: (err) => alert('Error insertando: ' + err.message),
      });
    }
  }

  seleccionar(aerolinea: Aerolinea) {
    this.aerolinea = { ...aerolinea };
  }

  eliminar(id: number) {
    if (confirm('¿Deseas eliminar esta aerolínea?')) {
      this.aerolineaService.eliminar(id).subscribe({
        next: () => {
          alert('Aerolínea eliminada');
          this.limpiar();
          this.cargarAerolineas();
        },
        error: (err) => alert('Error eliminando: ' + err.message),
      });
    }
  }

  limpiar() {
    this.aerolinea = this.nuevaAerolinea();
  }

  private nuevaAerolinea(): Aerolinea {
    return {
      id: 0,
      nombre: '',
    };
  }
}
