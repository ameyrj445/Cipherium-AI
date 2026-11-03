import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
const css = readFileSync(`${process.cwd()}/src/index.css`, 'utf8');
const luminance = (hex) => {
  const rgb = hex.match(/[0-9a-f]{2}/gi).map(value => parseInt(value, 16) / 255).map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
};
const contrast = (foreground, background) => {
  const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
};
const token = name => css.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`))[1];
describe('measured opaque shared color pairs (not a rendered page audit)', () => {
  it.each(['text-primary', 'text-secondary', 'text-tertiary', 'text-dim', 'text-accent'])('%s exceeds body text contrast on shared surfaces', name => {
    for (const surface of ['bg-canvas', 'bg-shell', 'bg-surface', 'bg-surface-elevated', 'bg-hover']) expect(contrast(token(name), token(surface))).toBeGreaterThanOrEqual(4.5);
  });
  it('primary button white label exceeds 4.5:1', () => expect(contrast('#ffffff', token('primary-600'))).toBeGreaterThanOrEqual(4.5));
  it('retains global focus-visible override for controls with inline outline:none', () => expect(css).toMatch(/outline: 3px solid #A5B4FC !important/));
});
