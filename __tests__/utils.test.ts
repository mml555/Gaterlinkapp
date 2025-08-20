// Simple utility function tests
describe('Utility Functions', () => {
  it('should perform basic math operations', () => {
    expect(2 + 2).toBe(4);
    expect(10 - 5).toBe(5);
    expect(3 * 4).toBe(12);
    expect(15 / 3).toBe(5);
  });

  it('should handle string operations', () => {
    expect('Hello' + ' ' + 'World').toBe('Hello World');
    expect('test'.toUpperCase()).toBe('TEST');
    expect('TEST'.toLowerCase()).toBe('test');
  });

  it('should handle array operations', () => {
    const arr = [1, 2, 3, 4, 5];
    expect(arr.length).toBe(5);
    expect(arr.map(x => x * 2)).toEqual([2, 4, 6, 8, 10]);
    expect(arr.filter(x => x > 3)).toEqual([4, 5]);
  });

  it('should handle object operations', () => {
    const obj = { name: 'Test', value: 42 };
    expect(obj.name).toBe('Test');
    expect(obj.value).toBe(42);
    expect(Object.keys(obj)).toEqual(['name', 'value']);
  });
});
