export class ClientRepository {
  static async search(query) {
    const data = JSON.parse(localStorage.getItem('clients') || '[]');
    return data.filter(c => c.name.toLowerCase().includes(query.toLowerCase()));
  }

  static async create(client) {
    const data = JSON.parse(localStorage.getItem('clients') || '[]');
    const newClient = { id: Date.now(), ...client };
    data.push(newClient);
    localStorage.setItem('clients', JSON.stringify(data));
    return newClient;
  }

  // Delete a client by id from localStorage
  static delete(id) {
    const data = JSON.parse(localStorage.getItem('clients') || '[]');
    const newData = data.filter(c => c.id !== id);
    localStorage.setItem('clients', JSON.stringify(newData));
    return true;
  }
} 