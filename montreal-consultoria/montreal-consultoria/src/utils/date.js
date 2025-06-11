export function formatDateBrazil(dateInput) {
  if (!dateInput) return '';
  let date;
  // Se for string no formato 'yyyy-mm-dd', parse manual para preservar local
  if (typeof dateInput === 'string') {
    const isoDateMatch = dateInput.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoDateMatch) {
      const [, year, month, day] = isoDateMatch;
      date = new Date(Number(year), Number(month) - 1, Number(day));
    } else {
      date = new Date(dateInput);
    }
  } else {
    // Date ou outro tipo
    date = new Date(dateInput);
  }
  // Formatar em UTC para não aplicar deslocamento de fuso
  return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
} 