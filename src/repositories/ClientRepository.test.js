import { ClientRepository } from './ClientRepository';

describe('ClientRepository', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('should create and search clients', async () => {
    await ClientRepository.create({ name: 'Alice', phone: '123', whatsapp: '456', email: 'alice@example.com' });
    await ClientRepository.create({ name: 'Bob', phone: '789', whatsapp: '012', email: 'bob@example.com' });

    const all = await ClientRepository.search('');
    expect(all).toHaveLength(2);

    const filtered = await ClientRepository.search('Ali');
    expect(filtered).toHaveLength(1);
    expect(filtered[0].name).toBe('Alice');
  });
}); 