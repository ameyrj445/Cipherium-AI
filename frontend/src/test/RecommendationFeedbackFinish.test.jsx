import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ResourceCard from '../components/common/ResourceCard';
import RecommendedPanel from '../components/RecommendedPanel';
import ResourcesFullView from '../components/ResourcesFullView';

const resource = { id: 42, feedbackTargetId: 42, title: 'Binary search', url: 'https://example.com/resource' };
const feedback = (state, authenticated = true) => ({ authenticated, entries: new Map(state ? [[42, state]] : []), submit: vi.fn() });
const card = () => screen.getByRole('link', { name: 'Open Resource' }).closest('.resource-card');

describe('Confirmed recommendation feedback presentation', () => {
  it.each(['helpful', 'too_easy', 'too_hard', 'not_relevant'])('dims only the surface after %s succeeds and keeps the resource usable', (choice) => {
    const state = feedback({ status: 'success', choice });
    render(<ResourceCard resource={resource} recommendationFeedback={state} />);
    expect(card()).toHaveClass('resource-card--rated');
    expect(card().style.opacity).toBe('');
    expect(card().style.background).toContain('linear-gradient');
    expect(screen.getByRole('link', { name: 'Open Resource' })).toHaveAttribute('href', resource.url);
    expect(screen.getByRole('button', { name: 'Feedback saved' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Helpful' })).toBeDisabled();
  });
  it.each([undefined, { status: 'pending' }, { status: 'error' }, { status: 'error', uncertain: true }, { status: 'pending', uncertain: true }])('does not dim on unconfirmed state %j', (state) => {
    render(<ResourceCard resource={resource} recommendationFeedback={feedback(state)} />);
    expect(card()).not.toHaveClass('resource-card--rated');
    expect(screen.queryByRole('button', { name: 'Feedback saved' })).not.toBeInTheDocument();
  });
  it.each([undefined, '42', 0, -1])('does not dim cards without genuine recommendation target %j', (id) => {
    render(<ResourceCard resource={{ ...resource, feedbackTargetId: id }} recommendationFeedback={feedback({ status: 'success' })} />);
    expect(card()).not.toHaveClass('resource-card--rated');
  });
  it('restores normal appearance after logout or a new session', () => {
    const { rerender } = render(<ResourceCard resource={resource} recommendationFeedback={feedback({ status: 'success' })} />);
    expect(card()).toHaveClass('resource-card--rated');
    rerender(<ResourceCard resource={resource} recommendationFeedback={feedback({ status: 'success' }, false)} />);
    expect(card()).not.toHaveClass('resource-card--rated');
    expect(screen.queryByRole('button', { name: 'Feedback saved' })).not.toBeInTheDocument();
    rerender(<ResourceCard resource={resource} recommendationFeedback={feedback()} />);
    expect(card()).not.toHaveClass('resource-card--rated');
  });
  it('uses confirmed history without sending a second vote', () => {
    const state = feedback({ status: 'success', previouslySaved: true });
    render(<ResourceCard resource={resource} recommendationFeedback={state} />);
    expect(card()).toHaveClass('resource-card--rated');
    expect(screen.getByRole('status')).toHaveTextContent('No new feedback was sent');
    expect(state.submit).not.toHaveBeenCalled();
  });
  it.each([RecommendedPanel, ResourcesFullView])('renders saved treatment in each recommendation view', (View) => {
    render(<View recommendations={[resource]} recommendationFeedback={feedback({ status: 'success', choice: 'helpful' })} />);
    expect(card()).toHaveClass('resource-card--rated');
  });
});

describe('Thanks tooltip', () => {
  it('opens on focus, describes trigger, is dismissed by Escape, and remains keyboard reachable', () => {
    render(<ResourceCard resource={resource} recommendationFeedback={feedback({ status: 'success' })} />);
    const trigger = screen.getByRole('button', { name: 'Feedback saved' });
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    fireEvent.focus(trigger);
    const tooltip = screen.getByRole('tooltip');
    expect(trigger).toHaveAttribute('aria-describedby', tooltip.id);
    expect(tooltip).toHaveTextContent('Thank you');
    fireEvent.keyDown(trigger, { key: 'Escape' });
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    expect(trigger).not.toHaveAttribute('aria-describedby');
    fireEvent.blur(trigger);
    fireEvent.focus(trigger);
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    fireEvent.blur(trigger);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });
  it('opens on hover, remains hoverable, and opens on tap without submitting feedback', () => {
    const state = feedback({ status: 'success' });
    render(<ResourceCard resource={resource} recommendationFeedback={state} />);
    const trigger = screen.getByRole('button', { name: 'Feedback saved' });
    const container = trigger.parentElement;
    fireEvent.mouseEnter(container);
    fireEvent.mouseEnter(screen.getByRole('tooltip'));
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    fireEvent.mouseLeave(container);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    fireEvent.click(trigger);
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    expect(state.submit).not.toHaveBeenCalled();
  });
  it('dismisses a hover-only tooltip with Escape while keyboard focus stays elsewhere', () => {
    render(<ResourceCard resource={resource} recommendationFeedback={feedback({ status: 'success' })} />);
    fireEvent.mouseEnter(screen.getByRole('button', { name: 'Feedback saved' }).parentElement);
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    fireEvent.keyDown(document.body, { key: 'Escape' });
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });
  it('keeps an Escape-dismissed tooltip closed when focus leaves but pointer stays', () => {
    render(<ResourceCard resource={resource} recommendationFeedback={feedback({ status: 'success' })} />);
    const trigger = screen.getByRole('button', { name: 'Feedback saved' });
    fireEvent.mouseEnter(trigger.parentElement);
    fireEvent.focus(trigger);
    fireEvent.keyDown(document.body, { key: 'Escape' });
    fireEvent.blur(trigger);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    fireEvent.mouseLeave(trigger.parentElement);
    fireEvent.mouseEnter(trigger.parentElement);
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
  });
  it('dismisses touch-open content on an outside pointer event even without focus', () => {
    render(<ResourceCard resource={resource} recommendationFeedback={feedback({ status: 'success' })} />);
    const trigger = screen.getByRole('button', { name: 'Feedback saved' });
    fireEvent.click(trigger);
    fireEvent.pointerDown(screen.getByRole('tooltip'));
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    fireEvent.pointerDown(document.body);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    fireEvent.click(trigger);
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
  });
  it('gives duplicate resource placements unique tooltip associations', () => {
    render(<><ResourceCard resource={resource} recommendationFeedback={feedback({ status: 'success' })} /><ResourceCard resource={resource} recommendationFeedback={feedback({ status: 'success' })} /></>);
    const triggers = screen.getAllByRole('button', { name: 'Feedback saved' });
    triggers.forEach((trigger) => fireEvent.focus(trigger));
    expect(triggers[0].getAttribute('aria-describedby')).not.toBe(triggers[1].getAttribute('aria-describedby'));
  });
});
