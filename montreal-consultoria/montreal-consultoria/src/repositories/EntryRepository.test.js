import { EntryRepository } from './EntryRepository';

describe('EntryRepository', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('should create and retrieve entries', async () => {
    const entry1 = { cliente: 'Alice', servico: 'Teste', parcelas: [], dataRef: '2025-06-01' };
    await EntryRepository.create(entry1);
    const entry2 = { cliente: 'Bob', servico: 'Teste2', parcelas: [], dataRef: '2025-06-02' };
    await EntryRepository.create(entry2);

    const all = await EntryRepository.getAll();
    expect(all).toHaveLength(2);
    expect(all[0].cliente).toBe('Alice');
    expect(all[1].cliente).toBe('Bob');
  });
}); 