export class EntryRepository {
  static async getAll() {
    return JSON.parse(localStorage.getItem('entries') || '[]');
  }

  static async create(entry) {
    const data = JSON.parse(localStorage.getItem('entries') || '[]');
    const newEntry = { id: Date.now(), ...entry };
    data.push(newEntry);
    localStorage.setItem('entries', JSON.stringify(data));
    return newEntry;
  }
} 