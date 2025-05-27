export interface Mensaje<T = any> {
  id: string;
  mensaje: string;
  data?: T;
}


