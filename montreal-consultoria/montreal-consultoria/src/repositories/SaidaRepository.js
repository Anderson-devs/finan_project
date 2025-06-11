export class SaidaRepository {
  static async getAll() {
    return JSON.parse(localStorage.getItem('saidas') || '[]');
  }

  static async create(saida) {
    const data = JSON.parse(localStorage.getItem('saidas') || '[]');
    const newSaida = { id: Date.now(), ...saida };
    data.push(newSaida);
    localStorage.setItem('saidas', JSON.stringify(data));
    return newSaida;
  }
} 