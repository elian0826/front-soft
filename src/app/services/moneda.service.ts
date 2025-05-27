import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseService } from './base.service';
import { API_CONFIG } from '../config/api.config';

export interface MonedaDto {
    id: number;
    tipo_moneda: string;
}

@Injectable({
    providedIn: 'root'
})
export class MonedaService extends BaseService<MonedaDto> {
    protected endpoint = API_CONFIG.endpoints.monedas;

    constructor(http: HttpClient) {
        super(http);
    }
}
