import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TutorPanel from '../components/TutorPanel';

describe('TutorPanel Component', () => {
  const defaultMessages = [
    {
      role: 'user',
      text: 'Explain linked lists',
    },
    {
      role: 'assistant',
      text: 'Consider what invariant holds as you traverse each node.',
      mode: 'socratic',
      streaming: false,
    },
  ];

  it('renders workspace title, messages, and mode selector', () => {
    const setTutorMode = vi.fn();
    render(
      <TutorPanel
        chatMessages={defaultMessages}
        tutorMode="socratic"
        setTutorMode={setTutorMode}
        chatInput=""
        setChatInput={() => {}}
        handleSendChat={() => {}}
        topics={[{ id: 1, name: 'Linked Lists' }]}
      />
    );

    expect(screen.getByText('Tutor Workspace')).toBeInTheDocument();
    expect(screen.getByText('Explain linked lists')).toBeInTheDocument();
    expect(screen.getByText(/Consider what invariant holds/i)).toBeInTheDocument();
    expect(screen.getByText('Socratic Guided')).toBeInTheDocument();

    const modeSelect = screen.getByLabelText(/Pedagogical Learning Mode/i);
    expect(modeSelect).toBeInTheDocument();
    expect(modeSelect.value).toBe('socratic');

    fireEvent.change(modeSelect, { target: { value: 'exam_prep' } });
    expect(setTutorMode).toHaveBeenCalledWith('exam_prep');
  });

  it('displays streaming badge when assistant message is streaming', () => {
    const streamingMessages = [
      {
        role: 'assistant',
        text: 'Generating step-by-step guidance...',
        mode: 'socratic',
        streaming: true,
      },
    ];

    render(
      <TutorPanel
        chatMessages={streamingMessages}
        tutorMode="socratic"
        setTutorMode={() => {}}
        chatInput=""
        setChatInput={() => {}}
        handleSendChat={() => {}}
      />
    );

    expect(screen.getByText(/Streaming.../i)).toBeInTheDocument();
  });

  it('triggers handleSendChat upon form submission', () => {
    const handleSend = vi.fn((e) => e?.preventDefault?.());
    render(
      <TutorPanel
        chatMessages={[]}
        tutorMode="direct"
        setTutorMode={() => {}}
        chatInput="What is BFS?"
        setChatInput={() => {}}
        handleSendChat={handleSend}
      />
    );

    const input = screen.getByRole('textbox');
    expect(input.value).toBe('What is BFS?');

    fireEvent.keyDown(input, { key: 'Enter', shiftKey: false });
    expect(handleSend).toHaveBeenCalled();
  });
});
