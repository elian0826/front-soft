import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_CONFIG } from '../config/api.config';
import { GetMaestras } from '../dto/GetMaestras';
import { DataGeneral } from '../dto/DataGeneral';
import { Mensaje } from '../dto/Mensaje'; // Asumiendo que Mensaje DTO ya existe
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ListasGeneralesService {

  private endpoint = API_CONFIG.endpoints.listasGenerales; // Necesitamos agregar este endpoint en api.config.ts

  constructor(private http: HttpClient) { }

  getDataGeneral(lista: GetMaestras[]): Observable<DataGeneral> {
    return this.http.post<Mensaje<DataGeneral>>(`${API_CONFIG.baseUrl}${this.endpoint}/registrar`, lista).pipe(
        map(response => response.data as DataGeneral)
    );
  }
} 