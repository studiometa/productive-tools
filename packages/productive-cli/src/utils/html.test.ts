import { describe, it, expect, beforeEach } from 'vitest';

import { setColorEnabled } from './colors.js';
import { stripHtml, truncate, link } from './html.js';

describe('stripHtml', () => {
  beforeEach(() => {
    setColorEnabled(true);
  });

  it('should return empty string for null/undefined', () => {
    expect(stripHtml(null)).toBe('');
    expect(stripHtml(undefined)).toBe('');
    expect(stripHtml('')).toBe('');
  });

  it('should convert <br> tags to newlines', () => {
    expect(stripHtml('line1<br>line2')).toBe('line1\nline2');
    expect(stripHtml('line1<br/>line2')).toBe('line1\nline2');
    expect(stripHtml('line1<br />line2')).toBe('line1\nline2');
    expect(stripHtml('line1<BR>line2')).toBe('line1\nline2');
  });

  it('should convert closing block tags to newlines', () => {
    expect(stripHtml('<p>para1</p><p>para2</p>')).toBe('para1\npara2');
    expect(stripHtml('<div>div1</div><div>div2</div>')).toBe('div1\ndiv2');
  });

  it('should convert list items to bullet points', () => {
    expect(stripHtml('<ul><li>item1</li><li>item2</li></ul>')).toBe('• item1\n• item2');
  });

  it('should strip all other HTML tags', () => {
    expect(stripHtml('<strong>bold</strong>')).toBe('bold');
    expect(stripHtml('<em>italic</em>')).toBe('italic');
    expect(stripHtml('<span class="test">text</span>')).toBe('text');
  });

  it('should strip images including data-uri', () => {
    expect(stripHtml('<img src="data:image/png;base64,abc123" />')).toBe('');
    expect(stripHtml('text<img src="image.jpg">more')).toBe('textmore');
  });

  it('should decode HTML entities', () => {
    expect(stripHtml('&amp;')).toBe('&');
    expect(stripHtml('&lt;')).toBe('<');
    expect(stripHtml('&gt;')).toBe('>');
    expect(stripHtml('&quot;')).toBe('"');
    expect(stripHtml('&#39;')).toBe("'");
    expect(stripHtml('&apos;')).toBe("'");
    expect(stripHtml('a&nbsp;b')).toBe('a b'); // nbsp between text (standalone gets trimmed)
  });

  it('should decode numeric HTML entities', () => {
    expect(stripHtml('&#65;')).toBe('A');
    expect(stripHtml('&#x41;')).toBe('A');
  });

  it('should normalize whitespace', () => {
    expect(stripHtml('text   with    spaces')).toBe('text with spaces');
    expect(stripHtml('line1\n\n\n\nline2')).toBe('line1\n\nline2');
  });

  it('should extract and preserve links as clickable', () => {
    const result = stripHtml('<a href="https://example.com">Click here</a>');
    expect(result).toContain('Click here');
    expect(result).toContain('https://example.com');
    // Should contain OSC 8 escape sequence for hyperlink
    expect(result).toContain('\x1b]8;;');
  });

  it('should convert plain URLs to clickable links', () => {
    const result = stripHtml('Visit https://example.com for more');
    expect(result).toContain('https://example.com');
    expect(result).toContain('\x1b]8;;');
  });

  it('should handle complex HTML', () => {
    const html = `
      <div>
        <p>Hello <strong>world</strong>!</p>
        <ul>
          <li>Item 1</li>
          <li>Item 2</li>
        </ul>
        <p>Visit <a href="https://example.com">our site</a>.</p>
      </div>
    `;
    const result = stripHtml(html);
    expect(result).toContain('Hello world!');
    expect(result).toContain('• Item 1');
    expect(result).toContain('• Item 2');
    expect(result).toContain('our site');
  });
});

describe('truncate', () => {
  it('should return original text if shorter than max length', () => {
    expect(truncate('short', 10)).toBe('short');
  });

  it('should truncate and add ellipsis if longer than max length', () => {
    expect(truncate('this is a long text', 10)).toBe('this is a…');
  });

  it('should handle empty/null input', () => {
    expect(truncate('', 10)).toBe('');
  });

  it('should handle exact length', () => {
    expect(truncate('exact', 5)).toBe('exact');
  });
});

describe('link', () => {
  beforeEach(() => {
    setColorEnabled(true);
  });

  it('should create OSC 8 hyperlink with underline', () => {
    const result = link('Click me', 'https://example.com');
    // Link should have underline formatting and OSC 8 escape sequence
    expect(result).toBe('\x1b]8;;https://example.com\x1b\\\x1b[4mClick me\x1b[0m\x1b]8;;\x1b\\');
  });

  it('should return plain text when colors disabled', () => {
    setColorEnabled(false);
    const result = link('Click me', 'https://example.com');
    expect(result).toBe('Click me');
  });
});
