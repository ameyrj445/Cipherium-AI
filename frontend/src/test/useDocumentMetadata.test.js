import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useDocumentMetadata, PAGE_METADATA } from '../hooks/useDocumentMetadata';

describe('useDocumentMetadata hook', () => {
  beforeEach(() => {
    document.title = 'Default Title';
    let desc = document.querySelector('meta[name="description"]');
    if (!desc) {
      desc = document.createElement('meta');
      desc.setAttribute('name', 'description');
      document.head.appendChild(desc);
    }
    desc.setAttribute('content', '');

    let og = document.querySelector('meta[property="og:title"]');
    if (!og) {
      og = document.createElement('meta');
      og.setAttribute('property', 'og:title');
      document.head.appendChild(og);
    }
    og.setAttribute('content', '');
  });

  it('sets proper title and description for Dashboard', () => {
    renderHook(() => useDocumentMetadata('Dashboard'));
    expect(document.title).toBe(PAGE_METADATA.Dashboard.title);
    expect(document.querySelector('meta[name="description"]').getAttribute('content')).toBe(
      PAGE_METADATA.Dashboard.description
    );
    expect(document.querySelector('meta[property="og:title"]').getAttribute('content')).toBe(
      PAGE_METADATA.Dashboard.title
    );
  });

  it('sets proper title and description for Learn', () => {
    renderHook(() => useDocumentMetadata('Learn'));
    expect(document.title).toBe(PAGE_METADATA.Learn.title);
    expect(document.querySelector('meta[name="description"]').getAttribute('content')).toBe(
      PAGE_METADATA.Learn.description
    );
  });

  it('sets proper title and description for Practice', () => {
    renderHook(() => useDocumentMetadata('Practice'));
    expect(document.title).toBe(PAGE_METADATA.Practice.title);
  });

  it('sets proper title and description for Study Plan', () => {
    renderHook(() => useDocumentMetadata('Study Plan'));
    expect(document.title).toBe(PAGE_METADATA['Study Plan'].title);
  });

  it('sets proper title and description for Analytics', () => {
    renderHook(() => useDocumentMetadata('Analytics'));
    expect(document.title).toBe(PAGE_METADATA.Analytics.title);
  });

  it('sets proper title and description for Resources', () => {
    renderHook(() => useDocumentMetadata('Resources'));
    expect(document.title).toBe(PAGE_METADATA.Resources.title);
  });

  it('sets proper title and description for AI Tutor', () => {
    renderHook(() => useDocumentMetadata('AI Tutor'));
    expect(document.title).toBe(PAGE_METADATA['AI Tutor'].title);
  });

  it('sets proper title and description for Settings', () => {
    renderHook(() => useDocumentMetadata('Settings'));
    expect(document.title).toBe(PAGE_METADATA.Settings.title);
  });

  it('sets proper title and description for Login', () => {
    renderHook(() => useDocumentMetadata('Login'));
    expect(document.title).toBe(PAGE_METADATA.Login.title);
  });

  it('allows override title when provided', () => {
    renderHook(() => useDocumentMetadata('Dashboard', 'Custom Title | Cipherium AI'));
    expect(document.title).toBe('Custom Title | Cipherium AI');
  });
});
