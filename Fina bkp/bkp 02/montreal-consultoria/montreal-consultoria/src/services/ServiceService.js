import { ServiceRepository } from '../repositories/ServiceRepository';

export class ServiceService {
  static async searchServices(query) {
    return ServiceRepository.search(query);
  }

  static async createService(service) {
    return ServiceRepository.create(service);
  }
}

export default ServiceService; 