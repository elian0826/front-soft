import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseService } from './base.service';
import { API_CONFIG } from '../config/api.config';

export interface TipoPagoDto {
    id?: number;
    medio_pago: string;
}

@Injectable({
    providedIn: 'root'
})
export class TipoPagoService extends BaseService<TipoPagoDto> {
    protected endpoint = '/tipopago';

    constructor(http: HttpClient) {
        super(http);
    }
}
