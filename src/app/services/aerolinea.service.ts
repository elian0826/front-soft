import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseService } from './base.service';
import { API_CONFIG } from '../config/api.config';

export interface AerolineaDto {
    id?: number;
    nombre: string;
    codigo: string;
    paisId: number;
}

@Injectable({
    providedIn: 'root'
})
export class AerolineaService extends BaseService<AerolineaDto> {
    protected endpoint = API_CONFIG.endpoints.aerolineas;

    constructor(http: HttpClient) {
        super(http);
    }
}
