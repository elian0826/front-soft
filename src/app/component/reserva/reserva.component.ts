import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ReservaService } from '../../services/reserva.service';
import { ClienteService } from '../../services/cliente.service';
import { AerolineaService } from '../../services/aerolinea.service';
import { CiudadService } from '../../services/ciudad.service';
import { EquipajeService } from '../../services/equipaje.service';
import { MonedaService } from '../../services/moneda.service';
import { TipoPagoService } from '../../services/tipo-pago.service';
import { ReservaDto } from '../../dto/reserva.dto';
import { ClienteDto } from '../../dto/cliente.dto';
import { AerolineaDto } from '../../services/aerolinea.service';
import { CiudadDto } from '../../services/ciudad.service';
import { EquipajeDto } from '../../services/equipaje.service';
import { MonedaDto } from '../../services/moneda.service';
import { TipoPagoDto } from '../../services/tipo-pago.service';

@Component({
    selector: 'app-reserva',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './reserva.component.html',
    styleUrls: ['./reserva.component.css']
})
export class ReservaComponent implements OnInit {
    reservaForm: FormGroup;
    reservas: ReservaDto[] = [];
    clientes: ClienteDto[] = [];
    aerolineas: AerolineaDto[] = [];
    ciudades: CiudadDto[] = [];
    equipajes: EquipajeDto[] = [];
    monedas: MonedaDto[] = [];
    tiposPago: TipoPagoDto[] = [];
    loading: boolean = false;
    errorMessage: string = '';
    successMessage: string = '';

    constructor(
        private fb: FormBuilder,
        private reservaService: ReservaService,
        private clienteService: ClienteService,
        private aerolineaService: AerolineaService,
        private ciudadService: CiudadService,
        private equipajeService: EquipajeService,
        private monedaService: MonedaService,
        private tipoPagoService: TipoPagoService
    ) {
        this.reservaForm = this.fb.group({
            id: [null],
            numero_vuelos: ['', [Validators.required, Validators.min(1)]],
            valor: ['', [Validators.required, Validators.min(0)]],
            fecha_vuelos: ['', Validators.required],
            hora: ['', Validators.required],
            valor_equipaje: ['', [Validators.required, Validators.min(0)]],
            cliente_id: ['', Validators.required],
            aerolinea_id: ['', Validators.required],
            moneda_id: ['', Validators.required],
            tipo_pago_id: ['', Validators.required],
            origen_id: ['', Validators.required],
            destino_id: ['', Validators.required]
        });
    }

    ngOnInit(): void {
        this.cargarDatos();
    }

    cargarDatos(): void {
        this.loading = true;
        this.errorMessage = '';

        // Cargar todos los datos en paralelo
        Promise.all([
            this.cargarReservas(),
            this.cargarClientes(),
            this.cargarAerolineas(),
            this.cargarCiudades(),
            this.cargarEquipajes(),
            this.cargarMonedas(),
            this.cargarTiposPago()
        ]).finally(() => {
            this.loading = false;
        });
    }

    cargarReservas(): Promise<void> {
        return new Promise((resolve) => {
            this.reservaService.getAll().subscribe(
                (data) => {
                    this.reservas = data;
                    resolve();
                },
                (error) => {
                    this.errorMessage = 'Error al cargar reservas: ' + (error.error?.mensaje || error.message);
                    resolve();
                }
            );
        });
    }

    cargarClientes(): Promise<void> {
        return new Promise((resolve) => {
            this.clienteService.getAll().subscribe(
                (data) => {
                    this.clientes = data;
                    resolve();
                },
                (error) => {
                    this.errorMessage = 'Error al cargar clientes: ' + (error.error?.mensaje || error.message);
                    resolve();
                }
            );
        });
    }

    cargarAerolineas(): Promise<void> {
        return new Promise((resolve) => {
            this.aerolineaService.getAll().subscribe(
                (data) => {
                    this.aerolineas = data;
                    resolve();
                },
                (error) => {
                    this.errorMessage = 'Error al cargar aerolíneas: ' + (error.error?.mensaje || error.message);
                    resolve();
                }
            );
        });
    }

    cargarCiudades(): Promise<void> {
        return new Promise((resolve) => {
            this.ciudadService.getAll().subscribe(
                (data) => {
                    this.ciudades = data;
                    resolve();
                },
                (error) => {
                    this.errorMessage = 'Error al cargar ciudades: ' + (error.error?.mensaje || error.message);
                    resolve();
                }
            );
        });
    }

    cargarEquipajes(): Promise<void> {
        return new Promise((resolve) => {
            this.equipajeService.getAll().subscribe(
                (data) => {
                    this.equipajes = data;
                    resolve();
                },
                (error) => {
                    this.errorMessage = 'Error al cargar equipajes: ' + (error.error?.mensaje || error.message);
                    resolve();
                }
            );
        });
    }

    cargarMonedas(): Promise<void> {
        return new Promise((resolve) => {
            this.monedaService.getAll().subscribe(
                (data) => {
                    this.monedas = data;
                    resolve();
                },
                (error) => {
                    this.errorMessage = 'Error al cargar monedas: ' + (error.error?.mensaje || error.message);
                    resolve();
                }
            );
        });
    }

    cargarTiposPago(): Promise<void> {
        return new Promise((resolve) => {
            this.tipoPagoService.getAll().subscribe(
                (data) => {
                    this.tiposPago = data;
                    resolve();
                },
                (error) => {
                    this.errorMessage = 'Error al cargar tipos de pago: ' + (error.error?.mensaje || error.message);
                    resolve();
                }
            );
        });
    }

    getClienteNombre(clienteId: number): string {
        const cliente = this.clientes.find(c => c.id === clienteId);
        return cliente ? `${cliente.nombre} ${cliente.apellido}` : '';
    }

    onSubmit(): void {
        if (this.reservaForm.valid) {
            this.loading = true;
            this.errorMessage = '';
            this.successMessage = '';

            const reserva: ReservaDto = this.reservaForm.value;
            if (reserva.id) {
                this.reservaService.update(reserva).subscribe(
                    () => {
                        this.successMessage = 'Reserva actualizada exitosamente';
                        this.cargarReservas();
                        this.resetForm();
                    },
                    (error) => {
                        this.errorMessage = 'Error al actualizar reserva: ' + (error.error?.mensaje || error.message);
                    }
                ).add(() => {
                    this.loading = false;
                });
            } else {
                this.reservaService.create(reserva).subscribe(
                    () => {
                        this.successMessage = 'Reserva creada exitosamente';
                        this.cargarReservas();
                        this.resetForm();
                    },
                    (error) => {
                        this.errorMessage = 'Error al crear reserva: ' + (error.error?.mensaje || error.message);
                    }
                ).add(() => {
                    this.loading = false;
                });
            }
        }
    }

    editarReserva(reserva: ReservaDto): void {
        this.reservaForm.patchValue(reserva);
    }

    eliminarReserva(id: number): void {
        if (confirm('¿Está seguro de eliminar esta reserva?')) {
            this.loading = true;
            this.errorMessage = '';
            this.successMessage = '';

            // 1. Obtener todos los equipajes
            this.equipajeService.getAll().subscribe(
                (equipajes) => {
                    // 2. Filtrar los equipajes relacionados a la reserva
                    const equipajesRelacionados = equipajes.filter(e => e.reserva_id === id);
                    if (equipajesRelacionados.length > 0) {
                        // 3. Eliminar todos los equipajes relacionados (en cadena)
                        let eliminados = 0;
                        equipajesRelacionados.forEach((equipaje) => {
                            if (equipaje.id !== undefined) {
                                this.equipajeService.delete(equipaje.id).subscribe(
                                    () => {
                                        eliminados++;
                                        // Cuando se hayan eliminado todos los equipajes, eliminar la reserva
                                        if (eliminados === equipajesRelacionados.length) {
                                            this.eliminarReservaFinal(id);
                                        }
                                    },
                                    (error) => {
                                        this.errorMessage = 'Error al eliminar equipaje: ' + (error.error?.mensaje || error.message);
                                        this.loading = false;
                                    }
                                );
                            }
                        });
                    } else {
                        // Si no hay equipajes relacionados, eliminar la reserva directamente
                        this.eliminarReservaFinal(id);
                    }
                },
                (error) => {
                    this.errorMessage = 'Error al obtener equipajes: ' + (error.error?.mensaje || error.message);
                    this.loading = false;
                }
            );
        }
    }

    // Método auxiliar para eliminar la reserva
    private eliminarReservaFinal(id: number): void {
        this.reservaService.delete(id).subscribe(
            () => {
                this.successMessage = 'Reserva eliminada exitosamente';
                this.cargarDatos();
            },
            (error) => {
                this.errorMessage = 'Error al eliminar reserva: ' + (error.error?.mensaje || error.message);
            }
        ).add(() => {
            this.loading = false;
        });
    }

    resetForm(): void {
        this.reservaForm.reset();
    }
}
