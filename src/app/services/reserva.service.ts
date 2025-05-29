import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseService } from './base.service';
import { ReservaDto } from '../dto/Reserva';
import { API_CONFIG } from '../config/api.config';
import { ReservaConClienteDto } from '../dto/ReservaConClienteDto';
import { Mensaje } from '../dto/Mensaje';

@Injectable({
    providedIn: 'root'
})
export class ReservaService extends BaseService<ReservaDto> {
    protected endpoint = API_CONFIG.endpoints.reservas;

    constructor(http: HttpClient) {
        super(http);
    }

    registrarConCliente(dto: ReservaConClienteDto): Observable<Mensaje> {
        return this.http.post<Mensaje>(`${API_CONFIG.baseUrl}${this.endpoint}/registrar-con-cliente`, dto);
    }
}
