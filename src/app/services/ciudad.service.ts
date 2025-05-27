import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseService } from './base.service';
import { API_CONFIG } from '../config/api.config';

export interface CiudadDto {
    id?: number;
    nombre: string;
    codigo: string;
    paisId: number;
}

@Injectable({
    providedIn: 'root'
})
export class CiudadService extends BaseService<CiudadDto> {
    protected endpoint = API_CONFIG.endpoints.ciudades;

    constructor(http: HttpClient) {
        super(http);
    }

  insertar(ciudad: CiudadDto): Observable<void> {
    return this.http.post<void>(this.endpoint, ciudad);
  }

  actualizar(id: number, ciudad: CiudadDto): Observable<void> {
    return this.http.put<void>(`${this.endpoint}/${id}`, ciudad);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.endpoint}/${id}`);
  }

  obtenerPorId(id: number): Observable<CiudadDto> {
    return this.http.get<CiudadDto>(`${this.endpoint}/${id}`);
  }

  listarTodos(): Observable<CiudadDto[]> {
    return this.http.get<CiudadDto[]>(this.endpoint);
  }
}
