import { describe, expect, it } from 'vitest';

import { stripHtml, truncate } from '../html.js';

describe('stripHtml', () => {
  it('returns empty string for null/undefined', () => {
    expect(stripHtml(null)).toBe('');
    expect(stripHtml(undefined)).toBe('');
    expect(stripHtml('')).toBe('');
  });

  it('converts <br> tags to newlines', () => {
    expect(stripHtml('line1<br>line2')).toBe('line1\nline2');
    expect(stripHtml('line1<br/>line2')).toBe('line1\nline2');
    expect(stripHtml('line1<br />line2')).toBe('line1\nline2');
  });

  it('converts closing block tags to newlines', () => {
    expect(stripHtml('<p>para1</p><p>para2</p>')).toBe('para1\npara2');
    expect(stripHtml('<div>div1</div><div>div2</div>')).toBe('div1\ndiv2');
  });

  it('converts list items to bullet points', () => {
    expect(stripHtml('<ul><li>item1</li><li>item2</li></ul>')).toBe('• item1\n• item2');
  });

  it('extracts link text with URL', () => {
    expect(stripHtml('<a href="https://example.com">Click here</a>')).toBe(
      'Click here (https://example.com)',
    );
  });

  it('strips remaining HTML tags', () => {
    expect(stripHtml('<strong>bold</strong> and <em>italic</em>')).toBe('bold and italic');
  });

  it('decodes HTML entities', () => {
    expect(stripHtml('&amp; &lt; &gt; &quot; &#39;')).toBe('& < > " \'');
    expect(stripHtml('&nbsp;space')).toBe('space');
  });

  it('normalizes whitespace', () => {
    expect(stripHtml('  too   many    spaces  ')).toBe('too many spaces');
  });

  it('collapses excessive newlines', () => {
    expect(stripHtml('a<br><br><br><br>b')).toBe('a\n\nb');
  });
});

describe('truncate', () => {
  it('returns text unchanged when shorter than max', () => {
    expect(truncate('short', 10)).toBe('short');
  });

  it('returns text unchanged when equal to max', () => {
    expect(truncate('exact', 5)).toBe('exact');
  });

  it('truncates with ellipsis when longer', () => {
    expect(truncate('this is too long', 10)).toBe('this is t…');
  });

  it('handles empty/null text', () => {
    expect(truncate('', 10)).toBe('');
  });
});
