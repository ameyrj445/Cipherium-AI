import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import BlueprintWizard from '../components/common/BlueprintWizard';

describe('BlueprintWizard Component', () => {
  it('renders all 3 curated blueprint career tracks', () => {
    render(<BlueprintWizard />);

    expect(screen.getByText('Select a Proven Curriculum Track')).toBeInTheDocument();
    expect(screen.getByText('Software Engineering & Algorithms')).toBeInTheDocument();
    expect(screen.getByText('Machine Learning & AI Engineering')).toBeInTheDocument();
    expect(screen.getByText('Full-Stack & System Architecture')).toBeInTheDocument();
  });

  it('triggers onSelectBlueprint with correct blueprint id', () => {
    const handleSelect = vi.fn();
    render(<BlueprintWizard onSelectBlueprint={handleSelect} />);

    const startButtons = screen.getAllByRole('button', { name: /Start This Blueprint/i });
    expect(startButtons.length).toBe(3);

    fireEvent.click(startButtons[0]);
    expect(handleSelect).toHaveBeenCalledWith('DSA');

    fireEvent.click(startButtons[1]);
    expect(handleSelect).toHaveBeenCalledWith('ML');
  });

  it('triggers onOpenCustomGenerator when custom plan button clicked', () => {
    const handleOpenCustom = vi.fn();
    render(<BlueprintWizard onOpenCustomGenerator={handleOpenCustom} />);

    const customBtn = screen.getByRole('button', { name: /Generate Custom AI Plan/i });
    fireEvent.click(customBtn);
    expect(handleOpenCustom).toHaveBeenCalledTimes(1);
  });
});
