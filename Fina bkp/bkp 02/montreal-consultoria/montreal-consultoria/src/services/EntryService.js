import { EntryRepository } from '../repositories/EntryRepository';

export class EntryService {
  static async getAllEntries() {
    return EntryRepository.getAll();
  }

  static async createEntry(entry) {
    return EntryRepository.create(entry);
  }
}

export default EntryService; 