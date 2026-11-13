import { NumeroDecimalPipe } from './numero-decimal.pipe';

describe('NumeroDecimalPipe', () => {
  const pipe = new NumeroDecimalPipe();
  it('muestra dos decimales y separa los miles', () => {
    expect(pipe.transform('15.0000')).toBe('15.00');
    expect(pipe.transform('100.0000')).toBe('100.00');
    expect(pipe.transform(1234.5)).toBe('1,234.50');
    expect(pipe.transform(1.239)).toBe('1.24');
    expect(pipe.transform(0)).toBe('0.00');
  });
  it('representa valores ausentes o inválidos con un guion', () => {
    expect(pipe.transform(null)).toBe('—');
    expect(pipe.transform('')).toBe('—');
    expect(pipe.transform('invalido')).toBe('—');
  });
});
