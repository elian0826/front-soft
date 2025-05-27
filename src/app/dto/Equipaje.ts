export interface Equipaje {
  id?: number; // Opcional porque no se necesita al insertar
  tipo_equipaje: string;
  peso: number;
  precio: number;
  moneda_id: number;
  reserva_id: number;
}
