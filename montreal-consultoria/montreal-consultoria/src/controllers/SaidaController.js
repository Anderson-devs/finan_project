import API_BASE_URL from '../config/api';

const base = API_BASE_URL;

export class SaidaController {
  static async getSaidas() {
    const res = await fetch(`${base}/saidas`);
    return await res.json();
  }

  static async saveSaida(saida) {
    const res = await fetch(`${base}/saidas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(saida)
    });
    return await res.json();
  }

  static async deleteAllSaidas() {
    const res = await fetch(`${base}/saidas`, { method: 'DELETE' });
    return res.ok;
  }
}

export default SaidaController; 