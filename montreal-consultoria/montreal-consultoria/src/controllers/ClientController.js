import API_BASE_URL from '../config/api';

const base = API_BASE_URL;

export class ClientController {
  static async searchClients(query) {
    const res = await fetch(`${base}/clients`);
    const clients = await res.json();
    return clients.filter(c => c.name.toLowerCase().includes(query.toLowerCase()));
  }

  static async createClient(client) {
    const res = await fetch(`${base}/clients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(client)
    });
    return await res.json();
  }

  static async updateClient(id, data) {
    const res = await fetch(`${base}/clients/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await res.json();
  }

  static async deleteClient(id) {
    const res = await fetch(`${base}/clients/${id}`, { method: 'DELETE' });
    return res.ok;
  }
}

export default ClientController; 