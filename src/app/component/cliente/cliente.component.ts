import { Component } from '@angular/core';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-cliente',
  templateUrl: './cliente.component.html',
  styleUrls: ['./cliente.component.scss']
})
export class ClienteComponent {
  // Aquí irían tus propiedades y formulario reactivo

  confirmarCrearCliente() {
    Swal.fire({
      title: '¿Está seguro?',
      text: '¿Desea guardar este cliente?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, guardar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.guardarCliente();
      }
    });
  }

  guardarCliente() {
    // Aquí iría la lógica real para guardar el cliente
    Swal.fire({
      icon: 'success',
      title: '¡Cliente guardado!',
      showConfirmButton: false,
      timer: 1500
    });
  }
}


