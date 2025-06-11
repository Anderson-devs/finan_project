import { SaidaRepository } from '../repositories/SaidaRepository';

export class SaidaService {
  static async getAllSaidas() {
    return SaidaRepository.getAll();
  }

  static async createSaida(saida) {
    return SaidaRepository.create(saida);
  }
}

export default SaidaService; 