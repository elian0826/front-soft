import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { API_CONFIG } from '../config/api.config';

interface Mensaje<T> {
    id: string;
    mensaje: string;
    data?: T;
}

export abstract class BaseService<T> {
    protected abstract endpoint: string;

    constructor(protected http: HttpClient) {}

    getAll(): Observable<T[]> {
        return this.http.get<Mensaje<T[]>>(`${API_CONFIG.baseUrl}${this.endpoint}`).pipe(
            map(response => response.data || [])
        );
    }

    getById(id: number): Observable<T> {
        return this.http.get<Mensaje<T>>(`${API_CONFIG.baseUrl}${this.endpoint}/${id}`).pipe(
            map(response => response.data as T)
        );
    }

    create(item: T): Observable<T> {
        return this.http.post<Mensaje<T>>(`${API_CONFIG.baseUrl}${this.endpoint}/registrar`, item).pipe(
            map(response => response.data as T)
        );
    }

    update(item: T): Observable<T> {
        return this.http.put<Mensaje<T>>(`${API_CONFIG.baseUrl}${this.endpoint}/actualizar`, item).pipe(
            map(response => response.data as T)
        );
    }

    delete(id: number): Observable<void> {
        return this.http.delete<Mensaje<void>>(`${API_CONFIG.baseUrl}${this.endpoint}/eliminar/${id}`).pipe(
            map(() => void 0)
        );
    }
}
