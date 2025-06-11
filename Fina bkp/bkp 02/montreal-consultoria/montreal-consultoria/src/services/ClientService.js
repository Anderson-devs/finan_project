import { ClientRepository } from '../repositories/ClientRepository';

export class ClientService {
  static async searchClients(query) {
    return ClientRepository.search(query);
  }

  static async createClient(client) {
    return ClientRepository.create(client);
  }
}

export default ClientService; 