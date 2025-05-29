// src/app/dto/reserva-con-cliente.dto.ts
import { ClienteDto } from './cliente.dto';
import { ReservaDto } from './reserva.dto';

export interface ReservaConClienteDto {
  cliente: ClienteDto;
  reserva: ReservaDto;
}