import API_BASE_URL from '../config/api';

const base = `${API_BASE_URL}/personalExpenses`;

export default class PersonalExpenseController {
  static async getExpenses() {
    const res = await fetch(base);
    return await res.json();
  }

  static async getExpensesToday() {
    const res = await fetch(`${base}/today`);
    return await res.json();
  }

  static async createExpense(expense) {
    const res = await fetch(base, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(expense)
    });
    return await res.json();
  }

  static async updateExpense(id, expense) {
    const res = await fetch(`${base}/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(expense)
    });
    return await res.json();
  }

  static async deleteExpense(id) {
    const res = await fetch(`${base}/${id}`, { method: 'DELETE' });
    return res.ok;
  }

  static async deleteAllExpenses() {
    const res = await fetch(base, { method: 'DELETE' });
    return res.ok;
  }
} 