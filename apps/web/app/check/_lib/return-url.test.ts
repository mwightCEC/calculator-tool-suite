import { describe, expect, it } from 'vitest';
import { allowedReturnUrl } from './return-url';

describe('allowedReturnUrl', () => {
  it.each([
    'https://clintonelectronics.com/cart',
    'https://www.clintonelectronics.com/cart?x=1',
    'https://staging.shop.clintonelectronics.com/cart',
  ])('allows %s', (url) => {
    expect(allowedReturnUrl(url)).toBe(url);
  });

  it.each([
    undefined,
    '',
    'not a url',
    'http://www.clintonelectronics.com/cart',
    'https://clintonelectronics.com.example.com/cart',
    'https://evilclintonelectronics.com/cart',
    'https://user:pass@www.clintonelectronics.com/cart',
    'data:text/html,clintonelectronics.com',
  ])('refuses %s', (url) => {
    expect(allowedReturnUrl(url)).toBeUndefined();
  });
});
