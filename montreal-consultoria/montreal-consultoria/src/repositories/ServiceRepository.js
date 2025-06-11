export class ServiceRepository {
  static async search(query) {
    const data = JSON.parse(localStorage.getItem('services') || '[]');
    return data.filter(s => s.name.toLowerCase().includes(query.toLowerCase()));
  }

  static async create(service) {
    const data = JSON.parse(localStorage.getItem('services') || '[]');
    const newService = { id: Date.now(), ...service };
    data.push(newService);
    localStorage.setItem('services', JSON.stringify(data));
    return newService;
  }

  static delete(id) {
    const data = JSON.parse(localStorage.getItem('services') || '[]');
    const newData = data.filter(s => s.id !== id);
    localStorage.setItem('services', JSON.stringify(newData));
    return true;
  }
} 