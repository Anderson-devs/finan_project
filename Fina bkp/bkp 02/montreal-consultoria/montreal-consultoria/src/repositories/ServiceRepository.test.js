import { ServiceRepository } from './ServiceRepository';

describe('ServiceRepository', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('should create and search services', async () => {
    await ServiceRepository.create({ name: 'Consultoria' });
    await ServiceRepository.create({ name: 'Limpa Nome' });

    const all = await ServiceRepository.search('');
    expect(all).toHaveLength(2);

    const filtered = await ServiceRepository.search('Limpa');
    expect(filtered).toHaveLength(1);
    expect(filtered[0].name).toBe('Limpa Nome');
  });
}); 