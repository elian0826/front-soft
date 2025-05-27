import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseService } from './base.service';
import { ClienteDto } from '../dto/cliente.dto';
import { API_CONFIG } from '../config/api.config';

@Injectable({
    providedIn: 'root'
})
export class ClienteService extends BaseService<ClienteDto> {
    protected endpoint = API_CONFIG.endpoints.clientes;

    constructor(http: HttpClient) {
        super(http);
    }

    getByDocumento(documento: number): Observable<ClienteDto> {
        return this.http.get<ClienteDto>(`${API_CONFIG.baseUrl}${this.endpoint}/documento/${documento}`);
    }
}
