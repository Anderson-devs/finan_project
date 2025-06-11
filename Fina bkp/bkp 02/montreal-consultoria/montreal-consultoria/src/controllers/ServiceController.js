import API_BASE_URL from '../config/api';

const base = API_BASE_URL;

export class ServiceController {
  static async searchServices(query) {
    const res = await fetch(`${base}/services`);
    const services = await res.json();
    return services.filter(s => s.name.toLowerCase().includes(query.toLowerCase()));
  }

  static async createService(service) {
    const res = await fetch(`${base}/services`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(service)
    });
    return await res.json();
  }
}

export default ServiceController; 