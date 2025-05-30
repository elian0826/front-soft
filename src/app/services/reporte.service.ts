import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ReporteService {

  private apiUrl = 'http://localhost:8080/api/reportes'; // Asegúrate que esta sea la URL correcta de tu backend

  constructor(private http: HttpClient) { }

  generarReporteReservasPdf(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/reservas/pdf`, { responseType: 'blob' });
  }
}
