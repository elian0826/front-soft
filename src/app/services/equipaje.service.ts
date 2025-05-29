import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseService } from './base.service';
import { API_CONFIG } from '../config/api.config';
import { Equipaje } from '../dto/Equipaje';

@Injectable({
    providedIn: 'root'
})
export class EquipajeService extends BaseService<Equipaje> {
    protected endpoint = API_CONFIG.endpoints.equipajes;

    constructor(http: HttpClient) {
        super(http);
    }
}
