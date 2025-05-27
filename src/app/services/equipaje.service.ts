import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseService } from './base.service';
import { API_CONFIG } from '../config/api.config';

export interface EquipajeDto {
    id?: number;
    tipo: string;
    pesoMaximo: number;
    precio: number;
    reserva_id: number;
}

@Injectable({
    providedIn: 'root'
})
export class EquipajeService extends BaseService<EquipajeDto> {
    protected endpoint = API_CONFIG.endpoints.equipajes;

    constructor(http: HttpClient) {
        super(http);
    }
}
