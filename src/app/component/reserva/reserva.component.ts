import { Component, OnInit, OnDestroy, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, ValidatorFn, AbstractControl } from '@angular/forms';
import { ReservaService } from '../../services/reserva.service';
import { ClienteService } from '../../services/cliente.service';
import { AerolineaService } from '../../services/aerolinea.service';
import { CiudadService } from '../../services/ciudad.service';
import { EquipajeService } from '../../services/equipaje.service';
import { MonedaService, MonedaDto } from '../../services/moneda.service';
import { TipoPagoService, TipoPagoDto } from '../../services/tipo-pago.service';
import { ListasGeneralesService } from '../../services/listas-generales.service';
import { ReporteService } from '../../services/reporte.service';
import { ReservaDto } from '../../dto/Reserva';
import { ClienteDto } from '../../dto/cliente.dto';
import { AerolineaDto } from '../../dto/Aerolinea';
import { CiudadDto } from '../../dto/Ciudad';
import { Equipaje } from '../../dto/Equipaje';
import Swal, { SweetAlertResult } from 'sweetalert2';
import { Observable, of, Subject } from 'rxjs';
import { map, startWith, debounceTime, switchMap, catchError, takeUntil } from 'rxjs/operators';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatOptionModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTimepickerModule } from '@angular/material/timepicker';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { trigger, transition, style, animate } from '@angular/animations';

import { NgxMaterialTimepickerModule } from 'ngx-material-timepicker';
import { ReservaConClienteDto } from '../../dto/ReservaConClienteDto';

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
        MatDatepickerModule,
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
    dummyProperty: boolean = false;
    reservaForm: FormGroup;
    reservas: ReservaDto[] = [];
    clientes: ClienteDto[] = [];
    aerolineas: AerolineaDto[] = [];
    ciudades: CiudadDto[] = [];
    equipajes: Equipaje[] = [];
    monedas: MonedaDto[] = [];
    tiposPago: TipoPagoDto[] = [];
    loading: boolean = false;
    errorMessage: string = '';
    successMessage: string = '';
    showConfirmModal = false;
    clienteExistente = false;
    ciudadesIguales: boolean = false;
    isDownloadingReport: boolean = false;
    formSubmitted: boolean = false;

    filteredClientes$: Observable<any[]> = of([]);
    documentoControl;

    private destroy$ = new Subject<void>();
    private requiredValidators: { [key: string]: ValidatorFn | ValidatorFn[] | null } = {};

    constructor(
        private fb: FormBuilder,
        private reservaService: ReservaService,
        private clienteService: ClienteService,
        private aerolineaService: AerolineaService,
        private ciudadService: CiudadService,
        private equipajeService: EquipajeService,
        private monedaService: MonedaService,
        private tipoPagoService: TipoPagoService,
        private listasGeneralesService: ListasGeneralesService,
        private reporteService: ReporteService
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

        this.storeRequiredValidators();

        this.clienteService.getAll().pipe(takeUntil(this.destroy$)).subscribe(clientes => {
            this.clientes = clientes;
        });

        this.reservaForm.get('origen_id')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => this.checkCiudadesIguales());
        this.reservaForm.get('destino_id')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => this.checkCiudadesIguales());

        this.reservaForm.statusChanges.pipe(takeUntil(this.destroy$)).subscribe(status => {
        });


        this.reservaForm.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(values => {
            const problematicControls = ['numero_vuelos', 'valor', 'hora', 'valor_equipaje', 'moneda_id', 'tipo_pago_id', 'destino_id'];
            problematicControls.forEach(key => {
                const control = this.reservaForm.get(key);
            });
        });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private storeRequiredValidators(): void {
        Object.keys(this.reservaForm.controls).forEach(key => {
            const control = this.reservaForm.get(key);
            if (control && control.validator) {
                 const validator = control.validator;
                 const errors = validator(control as AbstractControl);
                 if (errors && errors['required']) {
                      this.requiredValidators[key] = validator;
                 }
            }
        });
    }

    private temporarilyRemoveRequiredValidators(): void {
        Object.keys(this.requiredValidators).forEach(key => {
            const control = this.reservaForm.get(key);
            if (control) {
                control.clearValidators();
                control.updateValueAndValidity({ emitEvent: false });
            }
        });
    }

    private restoreRequiredValidators(): void {
         Object.keys(this.requiredValidators).forEach(key => {
             const control = this.reservaForm.get(key);
             if (control && this.requiredValidators[key]) {
                 control.setValidators(this.requiredValidators[key]);
                 control.updateValueAndValidity();
             }
         });
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

    verificarEstadoFormulario() {
    }

    abrirConfirmacion(): void {

        Object.keys(this.reservaForm.controls).forEach(key => {
            const control = this.reservaForm.get(key);
        });

        if (!this.reservaForm.valid) {
        }

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
            }).then((result: SweetAlertResult) => {
                if (result.isConfirmed) {
                    this.onSubmitInternal();
                }
            });
        } else {
            if (!this.isDownloadingReport) {
                if (this.ciudadesIguales) {
                    this.errorMessage = 'La ciudad de origen y destino no pueden ser la misma.';
                } else if (!this.reservaForm.valid) {
                    this.errorMessage = 'Por favor, complete todos los campos requeridos correctamente.';
                }
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
        this.formSubmitted = true;
        this.abrirConfirmacion();
    }

    editarReserva(reserva: ReservaDto): void {
        this.reservaForm.patchValue(reserva);
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
        }).then((result: SweetAlertResult) => {
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
        this.formSubmitted = false;
        Object.keys(this.reservaForm.controls).forEach(key => {
            this.reservaForm.get(key)?.setErrors(null);
        });
    }

    cargarSelects() {
        const listasSolicitadas = [
            { nombre: 'aerolinea' },
            { nombre: 'ciudad' },
            { nombre: 'moneda' },
            { nombre: 'tipo_pago' }
        ];

        this.listasGeneralesService.getDataGeneral(listasSolicitadas).pipe(takeUntil(this.destroy$)).subscribe(
            (data) => {
                if (data && data.generalData) {
                    if (data.generalData['aerolinea']) {
                         this.aerolineas = data.generalData['aerolinea'];
                    }
                    if (data.generalData['ciudad']) {
                        this.ciudades = data.generalData['ciudad'];
                    }
                     if (data.generalData['moneda']) {
                        this.monedas = data.generalData['moneda'];
                    }
                    if (data.generalData['tipo_pago']) {
                        this.tiposPago = data.generalData['tipo_pago'];
                    }
                }
            },
            (error) => {
                this.errorMessage = 'Error al cargar listas generales: ' + (error.error?.mensaje || error.message);
            }
        );
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
            },
            error => {
                this.clienteExistente = false;
                this.reservaForm.patchValue({
                    nombre: '',
                    fecha_nacimiento: '',
                    telefono: '',
                    email: ''
                });
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

         const cliente: ClienteDto = {
            documento: this.reservaForm.value.documento,
            nombre: this.reservaForm.value.nombre,
            fecha_nacimiento: this.reservaForm.value.fecha_nacimiento,
            telefono: this.reservaForm.value.telefono,
            email: this.reservaForm.value.email
        };

        const dto: ReservaConClienteDto = { cliente: cliente, reserva: reserva };

        this.reservaService.registrarConCliente(dto).pipe(takeUntil(this.destroy$)).subscribe(
            (respuesta) => {
                if (respuesta && respuesta.id === '0') {
                    Swal.fire({
                        icon: 'success',
                        title: '¡Reserva y cliente guardados exitosamente!',
                        text: respuesta.mensaje || 'Tu reserva ha sido registrada de forma exitosa.',
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
                    this.successMessage = respuesta.mensaje || '¡Reserva y cliente guardados exitosamente!';
                    this.cargarReservas();
                    this.resetForm();
                } else {
                    this.errorMessage = respuesta.mensaje || 'Error desconocido al guardar reserva y cliente.';
                }
            },
            (error) => {
                this.errorMessage = 'Error al guardar reserva y cliente: ' + (error.error?.mensaje || error.message);
            }
        );
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


        const horaValue = this.reservaForm.value.hora;

        if (typeof horaValue === 'string' && horaValue) {
            const [hours, minutes] = horaValue.split(':');
            horaFormateada = `${hours}:${minutes}:00`;
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
        Object.keys(this.reservaForm.controls).forEach(key => {
            const control = this.reservaForm.get(key);
            if (control?.invalid) {
            }
        });

        if (this.ciudadesIguales) {
            this.reservaForm.get('destino_id')?.setErrors({ ciudadesIguales: true });
            this.errorMessage = 'La ciudad de origen y destino no pueden ser la misma.';
        } else {
            this.reservaForm.get('destino_id')?.setErrors(null);
            if (this.errorMessage === 'La ciudad de origen y destino no pueden ser la misma.') {
                this.errorMessage = '';
            }
        }
        if (!this.isDownloadingReport) {
            if (!this.reservaForm.valid && !this.ciudadesIguales) {
                 this.errorMessage = 'Por favor, complete todos los campos requeridos correctamente.';
            } else if (this.reservaForm.valid && !this.ciudadesIguales) {
                 if (this.errorMessage === 'Por favor, complete todos los campos requeridos correctamente.') {
                     this.errorMessage = '';
                 }
            }
        }
    }

    // Método que se llama al hacer clic en el botón 'Reporte Reservas'
    iniciarDescargaReporte() {
        // Activar la bandera para control visual y de mensajes de error
        this.isDownloadingReport = true;
        this.errorMessage = ''; // Limpiar mensajes de error al inicio

        // Deshabilitar temporalmente el formulario completo *antes* de mostrar la alerta
        this.reservaForm.disable({ emitEvent: false });

        // Limpiar errorMessage *justo antes* de mostrar la alerta, por si se reestableció
        this.errorMessage = '';

        // Mostrar la alerta de confirmación
        Swal.fire({
            title: "¿Está seguro?",
            text: "¿Desea descargar el reporte de reservas?",
            icon: "question",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Sí, descargar",
            cancelButtonText: "Cancelar"
        }).then((result: SweetAlertResult) => {
            if (result.isConfirmed) {
                // Si el usuario confirma, proceder con la descarga (el formulario ya está deshabilitado)
                this.confirmarYDescargarReporte();
                 this.errorMessage = ''; // Asegurar limpieza después de confirmar (la lógica de confirmacionYDescargar también limpia al final)
            } else {
                // Si cancela, desactivar la bandera y habilitar el formulario
                 this.isDownloadingReport = false;
                 this.reservaForm.enable(); // Habilitar el formulario
                 // Forzar re-validación si es necesario para mostrar errores si el formulario está incompleto para guardar
                 this.reservaForm.updateValueAndValidity();
                 this.errorMessage = ''; // Asegurar limpieza después de cancelar
            }
        });
    }

    // Método que contiene la lógica real de descarga (llamado después de la confirmación)
    private confirmarYDescargarReporte() {
        // El formulario ya está deshabilitado al llegar aquí desde iniciarDescargaReporte

        // La lógica para marcar como untouched/pristine y manipular validadores ya no es tan crítica aquí si se controla por CSS y disable/enable,
        // pero la dejaremos por ahora por si acaso.
        // Object.keys(this.reservaForm.controls).forEach(key => { ... });
        // this.temporarilyRemoveRequiredValidators();

        this.reporteService.generarReporteReservasPdf().subscribe({
            next: (blob) => {
                if (blob.size > 100) {
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'reporte_reservas.pdf'; // Nombre del archivo a descargar
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url); // Liberar el recurso después de la descarga
                    document.body.removeChild(a);

                    // Mostrar mensaje de éxito tras descarga
                    Swal.fire({
                        icon: 'success',
                        title: '¡Descarga Exitosa!',
                        text: 'El reporte se ha generado y descargado correctamente.',
                        showConfirmButton: false,
                        timer: 2000
                    });

                } else {
                    console.error('Respuesta inesperada o blob vacío recibido.', blob);
                    Swal.fire({
                        icon: 'error',
                        title: 'Error al descargar el reporte',
                        text: 'Hubo un problema al generar el reporte. Inténtalo de nuevo o contacta al administrador.',
                    });
                }
                this.isDownloadingReport = false; // Desactivar la bandera
                this.reservaForm.enable(); // Habilitar el formulario
                this.reservaForm.updateValueAndValidity(); // Forzar re-validación para mostrar errores si es necesario
                // Restaurar estados touched/dirty si es necesario
                 Object.keys(this.reservaForm.controls).forEach(key => {
                     const control = this.reservaForm.get(key);
                     if (control && control.value !== null && control.value !== '') {
                          control.markAsTouched({ onlySelf: true });
                          control.markAsDirty({ onlySelf: true }); // Corregido typo
                     }
                 });
                this.errorMessage = ''; // Limpieza final después de éxito
            },
            error: (err) => {
                console.error('Error al descargar el reporte:', err);
                let errorMessage = 'Hubo un problema al generar o descargar el reporte.';
                if (err.error && err.error.mensaje) {
                    errorMessage = err.error.mensaje;
                } else if (err.message) {
                    errorMessage = err.message;
                }

                Swal.fire({
                    icon: 'error',
                    title: 'Error al descargar el reporte',
                    text: errorMessage,
                });
                this.isDownloadingReport = false; // Desactivar la bandera
                this.reservaForm.enable(); // Habilitar el formulario
                this.reservaForm.updateValueAndValidity(); // Forzar re-validación
                 // Restaurar estados touched/dirty si es necesario
                 Object.keys(this.reservaForm.controls).forEach(key => {
                     const control = this.reservaForm.get(key);
                     if (control && control.value !== null && control.value !== '') {
                          control.markAsTouched({ onlySelf: true });
                          control.markAsDirty({ onlySelf: true }); // Corregido typo
                     }
                 });
                this.errorMessage = ''; // Limpieza final después de error
            }
        });
    }
}


