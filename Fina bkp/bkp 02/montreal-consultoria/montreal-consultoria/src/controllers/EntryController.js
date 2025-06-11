import API_BASE_URL from '../config/api';

const base = API_BASE_URL;

export class EntryController {
  static async getEntries() {
    const res = await fetch(`${base}/entries`);
    return await res.json();
  }

  static async saveEntry(entry) {
    const res = await fetch(`${base}/entries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry)
    });
    return await res.json();
  }

  static async deleteEntry(id) {
    const res = await fetch(`${base}/entries/${id}`, { method: 'DELETE' });
    return res.ok;
  }
}

export default EntryController; 