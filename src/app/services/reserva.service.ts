import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseService } from './base.service';
import { ReservaDto } from '../dto/reserva.dto';
import { API_CONFIG } from '../config/api.config';
import { ReservaConClienteDto } from '../dto/ReservaConClienteDto';

@Injectable({
    providedIn: 'root'
})
export class ReservaService extends BaseService<ReservaDto> {
    protected endpoint = API_CONFIG.endpoints.reservas;

    constructor(http: HttpClient) {
        super(http);
    }

    // Métodos específicos para Reservas si son necesarios
    getReservasPorCliente(clienteId: number): Observable<ReservaDto[]> {
        return this.http.get<ReservaDto[]>(`${API_CONFIG.baseUrl}${this.endpoint}/cliente/${clienteId}`);
    }

    registrarConCliente(dto: ReservaConClienteDto) {
        return this.http.post(`${API_CONFIG.baseUrl}${this.endpoint}/registrar-con-cliente`, dto);
    }
}
