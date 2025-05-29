import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { BaseService } from './base.service';
import { ClienteDto } from '../dto/cliente.dto';
import { API_CONFIG } from '../config/api.config';
import { Mensaje } from '../dto/Mensaje';

@Injectable({
    providedIn: 'root'
})
export class ClienteService extends BaseService<ClienteDto> {
    protected endpoint = API_CONFIG.endpoints.clientes;

    constructor(http: HttpClient) {
        super(http);
    }

    getByDocumento(documento: string): Observable<ClienteDto | null> {
        return this.http.get<Mensaje<ClienteDto>>(`${API_CONFIG.baseUrl}${this.endpoint}/documento/${documento}`).pipe(
            map(response => response.data || null)
        );
    }
}
