import { Component, OnInit, OnDestroy, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ReservaService } from '../../services/reserva.service';
import { ClienteService } from '../../services/cliente.service';
import { AerolineaService } from '../../services/aerolinea.service';
import { CiudadService } from '../../services/ciudad.service';
import { EquipajeService } from '../../services/equipaje.service';
import { MonedaService, MonedaDto } from '../../services/moneda.service';
import { TipoPagoService, TipoPagoDto } from '../../services/tipo-pago.service';
import { ReservaDto } from '../../dto/reserva.dto';
import { ClienteDto } from '../../dto/cliente.dto';
import { AerolineaDto } from '../../services/aerolinea.service';
import { CiudadDto } from '../../services/ciudad.service';
import { EquipajeDto } from '../../services/equipaje.service';
import Swal from 'sweetalert2';
import { Observable, of, Subject } from 'rxjs';
import { map, startWith, debounceTime, switchMap, catchError, takeUntil } from 'rxjs/operators';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatOptionModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTimepickerModule } from '@angular/material/timepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { trigger, transition, style, animate } from '@angular/animations';

// Importar módulos del timepicker
import { NgxMaterialTimepickerModule } from 'ngx-material-timepicker';

@Component({
    selector: 'app-reserva',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatAutocompleteModule,
        MatInputModule,
        MatFormFieldModule,
        MatOptionModule,
        MatButtonModule,
        MatIconModule,
        MatTimepickerModule,
        MatNativeDateModule,
        NgxMaterialTimepickerModule
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    templateUrl: './reserva.component.html',
    styleUrls: ['./reserva.component.scss'],
    animations: [
        trigger('timepickerAnimation', [
            transition(':enter', [
                style({ opacity: 0, transform: 'scale(0.8)' }),
                animate('300ms ease-out', style({ opacity: 1, transform: 'scale(1)' }))
            ]),
            transition(':leave', [
                animate('300ms ease-in', style({ opacity: 0, transform: 'scale(0.8)' }))
            ])
        ])
    ]
})
export class ReservaComponent implements OnInit, OnDestroy {
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
    showConfirmModal = false;
    clienteExistente = false;
    ciudadesIguales: boolean = false;

    filteredClientes$: Observable<any[]> = of([]);
    documentoControl;

    private destroy$ = new Subject<void>();

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
        this.documentoControl = this.fb.control('', Validators.required);
        this.reservaForm = this.fb.group({
            id: [null],
            documento: this.documentoControl,
            nombre: ['', Validators.required],
            fecha_nacimiento: ['', Validators.required],
            telefono: ['', Validators.required],
            email: ['', [Validators.required, Validators.email]],
            numero_vuelos: [null, [Validators.required, Validators.min(1)]],
            valor: [null, [Validators.required, Validators.min(0)]],
            fecha_vuelos: ['', Validators.required],
            hora: ['', Validators.required],
            valor_equipaje: [null, [Validators.required, Validators.min(0)]],
            cliente_id: [null],
            aerolinea_id: [null, Validators.required],
            moneda_id: [null, Validators.required],
            tipo_pago_id: [null, Validators.required],
            origen_id: [null, Validators.required],
            destino_id: [null, Validators.required]
        }, { validators: this.validarCiudades });

        this.filteredClientes$ = this.documentoControl.valueChanges.pipe(
            startWith(''),
            debounceTime(200),
            map(value => {
                const filtro = value ? value.toString().toLowerCase() : '';
                if (!filtro) {
                    this.clienteExistente = false;
                }
                return this.clientes.filter(cliente =>
                    cliente.documento.toString().includes(filtro) ||
                    (cliente.nombre && cliente.nombre.toLowerCase().includes(filtro))
                );
            })
        );
    }

    ngOnInit(): void {
        this.cargarDatos();
        this.cargarSelects();

        this.clienteService.getAll().pipe(takeUntil(this.destroy$)).subscribe(clientes => {
            this.clientes = clientes;
        });

        this.reservaForm.get('origen_id')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => this.checkCiudadesIguales());
        this.reservaForm.get('destino_id')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => this.checkCiudadesIguales());

        // Agregar suscripción para monitorear el estado del formulario y sus controles detalladamente
        this.reservaForm.statusChanges.pipe(takeUntil(this.destroy$)).subscribe(status => {
            // console.log('--- Formulario Status Change ---');
            // console.log('Estado general del formulario:', status);
            // console.log('Errores generales del formulario (si aplica):', this.reservaForm.errors);

            // Logs detallados por cada control en cada cambio de estado
            // Object.keys(this.reservaForm.controls).forEach(key => {
            //     const control = this.reservaForm.get(key);
            //     console.log(`Control ${key}:`, {
            //         value: control?.value,
            //         valid: control?.valid,
            //         errors: control?.errors,
            //         touched: control?.touched,
            //         dirty: control?.dirty
            //     });
            // });
            // console.log('------------------------------');
        });

        // Eliminar la suscripción a valueChanges del formulario si ya no es necesaria para depuración
        this.reservaForm.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(values => {
            console.log('--- valueChanges detectado en formulario ---');
            const problematicControls = ['numero_vuelos', 'valor', 'hora', 'valor_equipaje', 'moneda_id', 'tipo_pago_id', 'destino_id'];
            problematicControls.forEach(key => {
                const control = this.reservaForm.get(key);
                console.log(`Control ${key} state:`, { value: control?.value, valid: control?.valid, errors: control?.errors });
            });
            console.log('Estado general del formulario:', { valid: this.reservaForm.valid, errors: this.reservaForm.errors });
            console.log('------------------------------------------');
        });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    cargarDatos(): void {
        this.loading = true;
        this.errorMessage = '';

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
            this.reservaService.getAll().pipe(takeUntil(this.destroy$)).subscribe(
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
            this.clienteService.getAll().pipe(takeUntil(this.destroy$)).subscribe(
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
            this.aerolineaService.getAll().pipe(takeUntil(this.destroy$)).subscribe(
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
            this.ciudadService.getAll().pipe(takeUntil(this.destroy$)).subscribe(
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
            this.equipajeService.getAll().pipe(takeUntil(this.destroy$)).subscribe(
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
            this.monedaService.getAll().pipe(takeUntil(this.destroy$)).subscribe(
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
            this.tipoPagoService.getAll().pipe(takeUntil(this.destroy$)).subscribe(
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
        return cliente ? cliente.nombre : '';
    }

    // Método de depuración para verificar el estado del formulario
    verificarEstadoFormulario() {
        console.log('--- Verificación Manual del Formulario ---');
        console.log('reservaForm.value:', this.reservaForm.value);
        console.log('reservaForm.valid:', this.reservaForm.valid);
        if (!this.reservaForm.valid) {
          console.log('Formulario inválido. Errores generales:', this.reservaForm.errors);
            Object.keys(this.reservaForm.controls).forEach(key => {
                const control = this.reservaForm.get(key);
                console.log(`Control ${key} => valor:`, control?.value, `, válido:`, control?.valid, `, errores:`, control?.errors);
            });
        }
        console.log('----------------------------------------');
    }

    abrirConfirmacion(): void {
        // Log para depurar el estado de validación del formulario
        console.log('--- Depuración de Formulario ---');
        console.log('reservaForm.valid:', this.reservaForm.valid);
        console.log('ciudadesIguales:', this.ciudadesIguales);
        console.log('Valores completos del formulario:', this.reservaForm.value);

        // Logs detallados por cada control
        Object.keys(this.reservaForm.controls).forEach(key => {
            const control = this.reservaForm.get(key);
            console.log(`Control ${key}:`, {
                value: control?.value,
                valid: control?.valid,
                errors: control?.errors,
                touched: control?.touched,
                dirty: control?.dirty
            });
        });

        if (!this.reservaForm.valid) {
            console.log('Formulario es inválido. Detalles de errores (ya mostrados arriba, pero repetimos si quieres verlos juntos):');
        }
        console.log('----------------------------');

        if (this.reservaForm.valid && !this.ciudadesIguales) {
            Swal.fire({
                title: "¿Está seguro?",
                text: "¿Desea guardar esta reserva?",
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#3085d6",
                cancelButtonColor: "#d33",
                confirmButtonText: "Sí, guardar",
                cancelButtonText: "Cancelar"
            }).then((result) => {
                if (result.isConfirmed) {
                    this.onSubmitInternal();
                }
            });
        } else {
            if (this.ciudadesIguales) {
                this.errorMessage = 'La ciudad de origen y destino no pueden ser la misma.';
            } else if (!this.reservaForm.valid) { // Mostrar mensaje genérico solo si no hay error de ciudades iguales
                this.errorMessage = 'Por favor, complete todos los campos requeridos correctamente.';
            }
        }
    }

    private onSubmitInternal(): void {
        if (this.reservaForm.valid) {
            this.loading = true;
            this.errorMessage = '';
            this.successMessage = '';

            const reserva: ReservaDto = this.reservaForm.value;
            if (reserva.id) {
                this.reservaService.update(reserva).pipe(takeUntil(this.destroy$)).subscribe(
                    () => {
                        Swal.fire({
                            icon: 'success',
                            title: '¡Reserva actualizada exitosamente!',
                            text: 'Tu reserva ha sido registrada de forma exitosa.',
                            showConfirmButton: false,
                            timer: 2000,
                            background: '#f0fff0',
                            color: '#155724',
                            customClass: {
                                popup: 'animated tada',
                                title: 'swal2-title-custom',
                                icon: 'swal2-icon-custom'
                            }
                        });
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
                this.enviar();
                this.loading = false;
            }
        }
    }

    onSubmit(): void {
        console.log('onSubmit llamado');
        console.log('Estado del formulario:', {
            valid: this.reservaForm.valid,
            ciudadesIguales: this.ciudadesIguales,
            valores: this.reservaForm.value
        });
        this.abrirConfirmacion();
    }

    editarReserva(reserva: ReservaDto): void {
        this.reservaForm.patchValue(reserva);
        // Actualizar el timepicker si es posible
        // La documentación no muestra un método setTime claro, podría requerir una interacción diferente
        // Si descubrimos cómo establecer la hora, descomentar y usar aquí
        /*
        if (this.timepicker && reserva.hora) {
            try {
                // Lógica para establecer la hora en timepicker-ui
            } catch (e) {
                console.error("Error setting timepicker time:", e);
            }
        }
        */
    }

    eliminarReserva(id: number): void {
        Swal.fire({
            title: "¿Está seguro?",
            text: "¡No podrás revertir esto!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Sí, eliminarlo!",
            cancelButtonText: "Cancelar"
        }).then((result) => {
            if (result.isConfirmed) {
                this.loading = true;
                this.errorMessage = '';
                this.successMessage = '';

                this.equipajeService.getAll().pipe(takeUntil(this.destroy$)).subscribe(
                    (equipajes) => {
                        const equipajesRelacionados = equipajes.filter(e => e.reserva_id === id);
                        if (equipajesRelacionados.length > 0) {
                            let eliminados = 0;
                            equipajesRelacionados.forEach((equipaje) => {
                                if (equipaje.id !== undefined) {
                                    this.equipajeService.delete(equipaje.id).pipe(takeUntil(this.destroy$)).subscribe(
                                        () => {
                                            eliminados++;
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
                            this.eliminarReservaFinal(id);
                        }
                    },
                    (error) => {
                        this.errorMessage = 'Error al obtener equipajes: ' + (error.error?.mensaje || error.message);
                        this.loading = false;
                    }
                );
            }
        });
    }

    private eliminarReservaFinal(id: number): void {
        this.reservaService.delete(id).pipe(takeUntil(this.destroy$)).subscribe(
            () => {
                Swal.fire(
                    'Eliminado!',
                    'La reserva ha sido eliminada.',
                    'success'
                );
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
        this.clienteExistente = false;
        this.documentoControl.reset();
        this.errorMessage = '';
        this.successMessage = '';
        this.ciudadesIguales = false;
        Object.keys(this.reservaForm.controls).forEach(key => {
            this.reservaForm.get(key)?.setErrors(null);
        });
        // Resetear también el timepicker si es posible
        // Si descubrimos cómo resetear la hora, descomentar y usar aquí
        /*
        if (this.timepicker) {
            try {
                // Lógica para resetear la hora en timepicker-ui
            } catch (e) {
                console.error("Error resetting timepicker time:", e);
            }
        }
        */
    }

    cargarSelects() {
        this.aerolineaService.getAll().pipe(takeUntil(this.destroy$)).subscribe(resp => this.aerolineas = resp);
        this.ciudadService.getAll().pipe(takeUntil(this.destroy$)).subscribe(resp => this.ciudades = resp);
        this.monedaService.getAll().pipe(takeUntil(this.destroy$)).subscribe(resp => this.monedas = resp);
        this.tipoPagoService.getAll().pipe(takeUntil(this.destroy$)).subscribe(resp => this.tiposPago = resp);
    }

    onClienteSelected(cliente: ClienteDto) {
        if (cliente) {
            this.clienteExistente = true;
            this.reservaForm.patchValue({
                documento: cliente.documento,
                nombre: cliente.nombre,
                fecha_nacimiento: cliente.fecha_nacimiento,
                telefono: cliente.telefono,
                email: cliente.email
            });
            this.documentoControl.setValue(String(cliente.documento), { emitEvent: false });
            console.log('clienteExistente:', this.clienteExistente);
            // Eliminar logs de depuración del formulario en onClienteSelected
            // console.log('Valores del formulario después de seleccionar cliente:', this.reservaForm.value);
            // console.log('Estado de validación del formulario después de seleccionar cliente:', this.reservaForm.valid);
            // console.log('Errores específicos después de seleccionar cliente:', this.reservaForm.controls['nombre'].errors);
            // console.log('Errores específicos después de seleccionar cliente:', this.reservaForm.controls['fecha_nacimiento'].errors);
            // console.log('Errores específicos después de seleccionar cliente:', this.reservaForm.controls['telefono'].errors);
            // console.log('Errores específicos después de seleccionar cliente:', this.reservaForm.controls['email'].errors);
        }
    }

    buscarClienteManual() {
        const documento = this.reservaForm.get('documento')?.value;
        if (!documento || isNaN(Number(documento))) {
            this.clienteExistente = false;
            this.reservaForm.patchValue({
                nombre: '',
                fecha_nacimiento: '',
                telefono: '',
                email: ''
            });
            console.log('clienteExistente:', this.clienteExistente);
            return;
        }
        this.clienteService.getByDocumento(documento).pipe(takeUntil(this.destroy$)).subscribe(
            cliente => {
                if (cliente) {
                    this.clienteExistente = true;
                    this.reservaForm.patchValue({
                        documento: cliente.documento,
                        nombre: cliente.nombre,
                        fecha_nacimiento: cliente.fecha_nacimiento,
                        telefono: cliente.telefono,
                        email: cliente.email
                    });
                } else {
                    this.clienteExistente = false;
                    this.reservaForm.patchValue({
                        nombre: '',
                        fecha_nacimiento: '',
                        telefono: '',
                        email: ''
                    });
                }
                console.log('clienteExistente:', this.clienteExistente);
            },
            error => {
                this.clienteExistente = false;
                this.reservaForm.patchValue({
                    nombre: '',
                    fecha_nacimiento: '',
                    telefono: '',
                    email: ''
                });
                console.log('clienteExistente:', this.clienteExistente);
            }
        );
    }

    onChangeCiudad() {
        const origen = this.reservaForm.get('origen_id')?.value;
        const destino = this.reservaForm.get('destino_id')?.value;
        if (origen && destino && origen === destino) {
            this.reservaForm.get('destino_id')?.setErrors({ sameCity: true });
        }
    }

    enviar() {
        this.reservaForm.get('id')?.setValue(null);
        this.errorMessage = '';
        this.successMessage = '';

        if (this.reservaForm.hasError('ciudadesIguales')) {
            this.errorMessage = 'La ciudad de origen y destino no pueden ser la misma.';
            return;
        }

        console.log('Método enviar() ejecutado. clienteExistente:', this.clienteExistente);

        if (this.clienteExistente) {
            const documento = this.reservaForm.value.documento;
            console.log('Buscando cliente existente por documento:', documento);
            this.clienteService.getByDocumento(documento).pipe(takeUntil(this.destroy$)).subscribe(cliente => {
                console.log('Resultado búsqueda cliente:', cliente);
                if (cliente && cliente.id) {
                    this.guardarReserva(cliente.id);
                } else {
                    this.errorMessage = 'No se encontró el cliente seleccionado.';
                }
            }, error => {
                this.errorMessage = 'Error al buscar cliente: ' + (error.error?.mensaje || error.message);
            });
        } else {
            const cliente: ClienteDto = {
                documento: this.reservaForm.value.documento,
                nombre: this.reservaForm.value.nombre,
                fecha_nacimiento: this.reservaForm.value.fecha_nacimiento,
                telefono: this.reservaForm.value.telefono,
                email: this.reservaForm.value.email
            };
            const reserva: ReservaDto = {
                numero_vuelos: Number(this.reservaForm.value.numero_vuelos),
                valor: Number(this.reservaForm.value.valor),
                fecha_vuelos: this.reservaForm.value.fecha_vuelos,
                hora: this.reservaForm.value.hora,
                valor_equipaje: Number(this.reservaForm.value.valor_equipaje),
                cliente_id: 0,
                aerolinea_id: Number(this.reservaForm.value.aerolinea_id),
                moneda_id: Number(this.reservaForm.value.moneda_id),
                tipo_pago_id: Number(this.reservaForm.value.tipo_pago_id),
                origen_id: Number(this.reservaForm.value.origen_id),
                destino_id: Number(this.reservaForm.value.destino_id)
            };
            const dto = { cliente, reserva };
            console.log('DTO a enviar:', dto);
            this.reservaService.registrarConCliente(dto).pipe(takeUntil(this.destroy$)).subscribe(
                (respuesta) => {
                    console.log('Respuesta del servidor:', respuesta);
                    Swal.fire({
                        icon: 'success',
                        title: '¡Reserva y cliente guardados exitosamente!',
                        text: 'Tu reserva y cliente han sido registrados de forma exitosa.',
                        showConfirmButton: false,
                        timer: 2000,
                        background: '#f0fff0',
                        color: '#155724',
                        customClass: {
                            popup: 'animated tada',
                            title: 'swal2-title-custom',
                            icon: 'swal2-icon-custom'
                        }
                    });
                    this.successMessage = '¡Reserva y cliente guardados exitosamente!';
                    this.cargarReservas();
                    this.resetForm();
                },
                (error) => {
                    this.errorMessage = 'Error al guardar reserva y cliente: ' + (error.error?.mensaje || error.message);
                }
            );
        }
    }

    private validarReserva(reserva: ReservaDto): string | null {
        if (!reserva.cliente_id || isNaN(reserva.cliente_id)) return 'Debe seleccionar un cliente válido.';
        if (!reserva.aerolinea_id || isNaN(reserva.aerolinea_id)) return 'Debe seleccionar una aerolínea válida.';
        if (!reserva.moneda_id || isNaN(reserva.moneda_id)) return 'Debe seleccionar una moneda válida.';
        if (!reserva.tipo_pago_id || isNaN(reserva.tipo_pago_id)) return 'Debe seleccionar un tipo de pago válido.';
        if (!reserva.origen_id || isNaN(reserva.origen_id)) return 'Debe seleccionar una ciudad de origen válida.';
        if (!reserva.destino_id || isNaN(reserva.destino_id)) return 'Debe seleccionar una ciudad de destino válida.';
        if (reserva.origen_id === reserva.destino_id) return 'La ciudad de origen y destino no pueden ser iguales.';
        if (!reserva.numero_vuelos || isNaN(reserva.numero_vuelos) || reserva.numero_vuelos < 1) return 'El número de vuelos debe ser mayor a 0.';
        if (reserva.valor == null || isNaN(reserva.valor)) return 'El valor debe ser un número válido.';
        if (reserva.valor_equipaje == null || isNaN(reserva.valor_equipaje)) return 'El valor del equipaje debe ser un número válido.';
        if (!reserva.fecha_vuelos) return 'Debe seleccionar una fecha de vuelo.';
        if (!reserva.hora) return 'Debe seleccionar una hora de vuelo.';
        return null;
    }

    guardarReserva(clienteId?: number) {
        let horaFormateada = '';

        // Obtener el valor de la hora como cadena del formulario
        const horaValue = this.reservaForm.value.hora;

        // Verificar si hay un valor en el form control 'hora' y si es una cadena no vacía
        if (typeof horaValue === 'string' && horaValue) {
            // El formato del input type="time" es "HH:mm"
            horaFormateada = `${horaValue}:00`;
        }

        const reserva: ReservaDto = {
            numero_vuelos: Number(this.reservaForm.value.numero_vuelos),
            valor: Number(this.reservaForm.value.valor),
            fecha_vuelos: this.reservaForm.value.fecha_vuelos,
            hora: horaFormateada,
            valor_equipaje: Number(this.reservaForm.value.valor_equipaje),
            cliente_id: Number(clienteId!),
            aerolinea_id: Number(this.reservaForm.value.aerolinea_id),
            moneda_id: Number(this.reservaForm.value.moneda_id),
            tipo_pago_id: Number(this.reservaForm.value.tipo_pago_id),
            origen_id: Number(this.reservaForm.value.origen_id),
            destino_id: Number(this.reservaForm.value.destino_id)
        };

        const errorValidacion = this.validarReserva(reserva);
        if (errorValidacion) {
            this.errorMessage = errorValidacion;
            console.error('Error de validación:', errorValidacion);
            return;
        }

        console.log('Reserva enviada al backend:', reserva);
        this.reservaService.create(reserva).pipe(takeUntil(this.destroy$)).subscribe(
            (respuesta) => {
                Swal.fire({
                    icon: 'success',
                    title: '¡Reserva guardada exitosamente!',
                    text: 'Tu reserva ha sido registrada de forma exitosa.',
                    showConfirmButton: false,
                    timer: 2000,
                    background: '#f0fff0',
                    color: '#155724',
                    customClass: {
                        popup: 'animated tada',
                        title: 'swal2-title-custom',
                        icon: 'swal2-icon-custom'
                    }
                });
                this.successMessage = '¡Reserva guardada exitosamente!';
                this.cargarReservas();
                this.resetForm();
            },
            (error) => {
                this.errorMessage = 'Error al crear reserva: ' + (error.error?.mensaje || error.message);
                console.error('Error backend al crear reserva:', error);
            }
        );
    }

    validarCiudades(form: FormGroup) {
        const origen = form.get('origen_id')?.value;
        const destino = form.get('destino_id')?.value;

        if (origen && destino && origen === destino) {
            return { ciudadesIguales: true };
        }
        return null;
    }

    checkCiudadesIguales(): void {
        const origen = this.reservaForm.get('origen_id')?.value;
        const destino = this.reservaForm.get('destino_id')?.value;
        this.ciudadesIguales = origen && destino && origen === destino;

        // --- Logs de depuración añadidos ---
        console.log('--- Verificación de Ciudades y Formulario ---');
        console.log('ciudadesIguales:', this.ciudadesIguales);
        console.log('reservaForm.valid:', this.reservaForm.valid);
        console.log('Errores del formulario (general):', this.reservaForm.errors);
        Object.keys(this.reservaForm.controls).forEach(key => {
            const control = this.reservaForm.get(key);
            if (control?.invalid) { // Solo loguear controles inválidos para no saturar
                console.log(`Control ${key} es inválido:`, { value: control.value, errors: control.errors });
            }
        });
        console.log('-----------------------------------------');
        // --- Fin de logs de depuración ---

        if (this.ciudadesIguales) {
            this.reservaForm.get('destino_id')?.setErrors({ ciudadesIguales: true });
            this.errorMessage = 'La ciudad de origen y destino no pueden ser la misma.';
        } else {
            this.reservaForm.get('destino_id')?.setErrors(null);
            // Limpiar el mensaje de error de ciudades iguales si se corrige
            if (this.errorMessage === 'La ciudad de origen y destino no pueden ser la misma.') {
                this.errorMessage = '';
            }
        }

        // Si el formulario no es válido por otras razones (y no es por ciudades iguales), mostrar un mensaje genérico
        if (!this.reservaForm.valid && !this.ciudadesIguales) {
             this.errorMessage = 'Por favor, complete todos los campos requeridos correctamente.';
        } else if (this.reservaForm.valid && !this.ciudadesIguales) {
             // Si el formulario es válido y las ciudades son diferentes, limpiar mensaje de error
             if (this.errorMessage === 'Por favor, complete todos los campos requeridos correctamente.') {
                 this.errorMessage = '';
             }
        }
    }
}


