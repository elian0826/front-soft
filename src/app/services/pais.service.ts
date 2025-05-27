import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseService } from './base.service';
import { API_CONFIG } from '../config/api.config';

export interface PaisDto {
    id?: number;
    nombre: string;
    codigo: string;
}

@Injectable({
    providedIn: 'root'
})
export class PaisService extends BaseService<PaisDto> {
    protected endpoint = API_CONFIG.endpoints.paises;

    constructor(http: HttpClient) {
        super(http);
    }
}
