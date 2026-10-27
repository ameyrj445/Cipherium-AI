/**
 * Cipherium AI - AI Pedagogical Tutor Workspace
 *
 * Modern 3-panel workspace filling calc(100dvh - 56px):
 *   - Left Panel (260px collapsible): Session history, topic quick-picker list, new chat action.
 *   - Center Panel (flex-1): Main chat stream with auto-scroll, formatted messages,
 *     interactive visual cards, and sticky bottom input bar with model selector.
 *   - Right Panel (320px collapsible): Grounded context & reference rail showing
 *     syllabus topic notes, key algorithmic formulas/snippets, and suggested follow-ups.
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Bot, Brain, Paperclip, Send, RefreshCw, BookOpen, ExternalLink,
  PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen,
  Sparkles, Code2, Lightbulb, Compass, Plus, MessageSquare, Copy, Check, Hash
} from 'lucide-react';

// Fallback topic metadata when API topics lack full syllabus notes
const DEFAULT_TOPIC_REFS = {
  'arrays': {
    notes: 'Contiguous memory allocation. Provides O(1) random access by index, O(n) insertions and deletions without reallocation.',
    formulas: [
      { label: 'Two Pointers (Opposite Ends)', code: 'left, right = 0, len(nums) - 1\nwhile left < right:\n  curr_sum = nums[left] + nums[right]' },
      { label: 'Prefix Sum Array', code: 'prefix = [0] * (n + 1)\nfor i in range(n):\n  prefix[i + 1] = prefix[i] + nums[i]' },
    ],
    questions: [
      'How does dynamic array resizing work in amortized O(1)?',
      'Explain the Two Sum problem using Hash Map vs Two Pointers.',
      'Show the Sliding Window template for maximum subarray.',
      'What are common edge cases with empty or 1-element arrays?',
    ],
  },
  'trees': {
    notes: 'Hierarchical node structure. Binary Search Trees (BST) maintain left < root < right invariant for O(log n) average lookups.',
    formulas: [
      { label: 'Recursive DFS Inorder (BST)', code: 'def inorder(node):\n  if not node: return\n  inorder(node.left)\n  visit(node.val)\n  inorder(node.right)' },
      { label: 'BFS Level-Order Queue', code: 'queue = deque([root])\nwhile queue:\n  node = queue.popleft()\n  if node.left: queue.append(node.left)' },
    ],
    questions: [
      'Compare Depth-First Search (DFS) vs Breadth-First Search (BFS).',
      'How do you calculate tree height iteratively vs recursively?',
      'Explain Lowest Common Ancestor (LCA) in a BST.',
      'What makes an AVL tree or Red-Black tree balanced?',
    ],
  },
  'graphs': {
    notes: 'Non-linear collection of vertices and edges. Can be directed/undirected, cyclic/acyclic, weighted/unweighted.',
    formulas: [
      { label: "Dijkstra's Shortest Path", code: 'pq = [(0, start)]\nwhile pq:\n  dist, u = heapq.heappop(pq)\n  for v, weight in adj[u]: ...' },
      { label: 'Topological Sort (Kahn Alg)', code: 'in_degree = {u: 0 for u in adj}\nqueue = deque([u for u in in_degree if in_degree[u] == 0])' },
    ],
    questions: [
      'How to detect a cycle in a directed vs undirected graph?',
      'Explain Dijkstra vs Bellman-Ford algorithm tradeoffs.',
      'Show an adjacency list representation with edge weights.',
      'What is Topological Sort and when can it fail?',
    ],
  },
  'dynamic': {
    notes: 'Optimization technique breaking problems into overlapping subproblems with optimal substructure. Memoization (top-down) vs Tabulation (bottom-up).',
    formulas: [
      { label: '0/1 Knapsack Tabulation', code: 'dp = [[0]*(W+1) for _ in range(n+1)]\nfor i in range(1, n+1):\n  for w in range(W+1):\n    dp[i][w] = max(dp[i-1][w], ...)' },
      { label: '1D Fibonacci Space Opt', code: 'prev2, prev1 = 0, 1\nfor _ in range(2, n + 1):\n  curr = prev1 + prev2\n  prev2, prev1 = prev1, curr' },
    ],
    questions: [
      'How do I identify if a problem can be solved with DP?',
      'Demonstrate Longest Common Subsequence state transition.',
      'Explain space optimization from 2D DP matrix to 1D array.',
      'What is the difference between Memoization and Tabulation?',
    ],
  },
};

const GENERAL_QUESTIONS = [
  'Explain time and space complexity with Big-O notation.',
  'What is the difference between a Hash Table and a Binary Search Tree?',
  'Give me a step-by-step example of Binary Search.',
  'Help me design an adaptive study plan for technical interviews.',
];

export default function TutorPanel({
  aiModel = 'gemini-2.5-flash',
  setAiModel = () => {},
  tutorMode = 'socratic',
  setTutorMode = () => {},
  chatMessages = [],
  chatInput = '',
  setChatInput = () => {},
  handleSendChat = () => {},
  tutorThinking = false,
  topics = [],
  tutorTopicId = null,
  setTutorTopicId = () => {},
  onClearHistory = () => {},
}) {

  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView?.({ behavior: 'smooth' });
  }, [chatMessages, tutorThinking]);

  // Determine currently active topic & contextual reference
  const activeTopic = useMemo(() => {
    if (!tutorTopicId) return null;
    return topics.find((t) => t.id === tutorTopicId) || null;
  }, [topics, tutorTopicId]);

  const activeTopicRef = useMemo(() => {
    if (!activeTopic) {
      return {
        notes: 'Select a syllabus topic to bind curriculum context, formulas, and tailored diagnostic prompts.',
        formulas: [
          { label: 'Time Complexity Hierarchy', code: 'O(1) < O(log n) < O(n) < O(n log n) < O(n²) < O(2ⁿ) < O(n!)' },
          { label: 'Binary Search Invariant', code: 'low, high = 0, len(arr) - 1\nwhile low <= high:\n  mid = low + (high - low) // 2' },
        ],
        questions: GENERAL_QUESTIONS,
      };
    }

    const name = activeTopic.name.toLowerCase();
    for (const [key, val] of Object.entries(DEFAULT_TOPIC_REFS)) {
      if (name.includes(key)) {
        return {
          notes: activeTopic.description || val.notes,
          formulas: val.formulas,
          questions: val.questions,
        };
      }
    }

    return {
      notes: activeTopic.description || `Curriculum unit covering core algorithmic paradigms, edge cases, and standard problems in ${activeTopic.name}.`,
      formulas: [
        { label: `${activeTopic.name} Implementation Skeleton`, code: `def solve_${activeTopic.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}(data):\n  # Grounded in ${activeTopic.name}\n  pass` },
      ],
      questions: [
        `What are the most common interview questions on ${activeTopic.name}?`,
        `Walk me through an optimal approach for ${activeTopic.name}.`,
        `Explain the primary time and space tradeoffs in ${activeTopic.name}.`,
      ],
    };
  }, [activeTopic]);

  const handleCopyCode = (code, id) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(code);
      setCopiedSnippet(id);
      setTimeout(() => setCopiedSnippet(null), 2000);
    }
  };

  const handleSelectQuestion = (q) => {
    setChatInput(q);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (chatInput.trim() && !tutorThinking) {
        handleSendChat(e);
      }
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        width: '100%',
        height: 'calc(100dvh - 56px)',
        overflow: 'hidden',
        background: 'var(--bg-canvas, #121214)',
        color: 'var(--text-primary, #F3F4F6)',
        boxSizing: 'border-box',
      }}
    >
      {/* Panel 1: Left workspace / topics / history (260px collapsible) */}
      <aside
        style={{
          width: leftCollapsed ? '0px' : '260px',
          minWidth: leftCollapsed ? '0px' : '260px',
          borderRight: leftCollapsed ? 'none' : '1px solid var(--border-stroke, #2D2D35)',
          background: 'var(--bg-shell, #161618)',
          display: 'flex',
          flexDirection: 'column',
          transition: 'width 0.22s cubic-bezier(0.4, 0, 0.2, 1), min-width 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        <div style={{ width: '260px', display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Header */}
          <div
            style={{
              padding: '14px 16px',
              borderBottom: '1px solid var(--border-stroke, #2D2D35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '7px',
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Bot size={16} color="#fff" />
              </div>
              <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#F3F4F6' }}>
                Tutor Workspace
              </span>
            </div>

            <button
              type="button"
              onClick={() => setLeftCollapsed(true)}
              title="Collapse left panel"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary, #9CA3AF)',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <PanelLeftClose size={16} />
            </button>
          </div>

          {/* New Chat Button */}
          <div style={{ padding: '12px 16px 8px' }}>
            <button
              type="button"
              onClick={() => {
                setChatInput('');
                if (setTutorTopicId) setTutorTopicId(null);
                if (onClearHistory) onClearHistory();
                if (inputRef.current) inputRef.current.focus();
              }}

              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '8px 12px',
                borderRadius: '8px',
                background: 'rgba(99, 102, 241, 0.1)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                color: '#c7d2fe',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(99, 102, 241, 0.18)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)';
              }}
            >
              <Plus size={15} />
              <span>New Conversation</span>
            </button>
          </div>

          {/* Scrollable Topics & Session History */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '8px 12px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            {/* Curriculum Topics Picker */}
            <div>
              <div
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  color: 'var(--text-tertiary, #6B7280)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  padding: '4px 6px',
                  marginBottom: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                <Compass size={12} color="#6366F1" />
                <span>Syllabus Grounding</span>
              </div>

              {/* General Context (no specific topic) */}
              <button
                type="button"
                onClick={() => setTutorTopicId(null)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '7px 10px',
                  borderRadius: '6px',
                  border: tutorTopicId === null ? '1px solid #6366f1' : '1px solid transparent',
                  background: tutorTopicId === null ? 'rgba(99, 102, 241, 0.14)' : 'transparent',
                  color: tutorTopicId === null ? '#fff' : 'var(--text-secondary, #9CA3AF)',
                  fontSize: '0.78rem',
                  fontWeight: tutorTopicId === null ? 700 : 500,
                  cursor: 'pointer',
                  marginBottom: '2px',
                }}
              >
                <Sparkles size={13} color={tutorTopicId === null ? '#818cf8' : 'var(--text-tertiary, #6B7280)'} />
                <span>General Tutor Context</span>
              </button>

              {/* Individual Topics List */}
              {topics.map((t) => {
                const isSelected = tutorTopicId === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTutorTopicId(t.id)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px',
                      padding: '7px 10px',
                      borderRadius: '6px',
                      border: isSelected ? '1px solid #6366f1' : '1px solid transparent',
                      background: isSelected ? 'rgba(99, 102, 241, 0.14)' : 'transparent',
                      color: isSelected ? '#fff' : 'var(--text-secondary, #9CA3AF)',
                      fontSize: '0.78rem',
                      fontWeight: isSelected ? 700 : 500,
                      cursor: 'pointer',
                      transition: 'all 0.12s ease',
                      marginBottom: '2px',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = 'var(--bg-surface, #1E1E22)';
                        e.currentTarget.style.color = '#F3F4F6';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = 'var(--text-secondary, #9CA3AF)';
                      }
                    }}
                  >
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {t.name}
                    </span>
                    {isSelected && (
                      <span
                        style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          background: '#6366F1',
                          flexShrink: 0,
                        }}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Recent Practice / Tutoring Sessions */}
            <div>
              <div
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  color: 'var(--text-tertiary, #6B7280)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  padding: '4px 6px',
                  marginBottom: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                <MessageSquare size={12} color="#818CF8" />
                <span>Recent Inquiries</span>
              </div>

              {[
                { label: 'Two Sum vs Sliding Window', time: 'Today' },
                { label: 'BST Inorder traversal proofs', time: 'Yesterday' },
                { label: 'Dynamic Programming Memoization', time: '3d ago' },
              ].map((sess, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '6px',
                    fontSize: '0.76rem',
                    color: 'var(--text-secondary, #9CA3AF)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                    transition: 'background 0.12s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--bg-surface, #1E1E22)';
                    e.currentTarget.style.color = '#F3F4F6';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'var(--text-secondary, #9CA3AF)';
                  }}
                  onClick={() => setChatInput(`Can you explain ${sess.label}?`)}
                >
                  <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {sess.label}
                  </span>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-tertiary, #6B7280)' }}>
                    {sess.time}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* Panel 2: Center chat stream & sticky input bar (flex-1) */}
      <main
        style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          overflow: 'hidden',
          background: 'var(--bg-canvas, #121214)',
        }}
      >
        {/* Top Slim Workspace Bar */}
        <div
          style={{
            height: '48px',
            padding: '0 16px',
            borderBottom: '1px solid var(--border-stroke, #2D2D35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-shell, #161618)',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {leftCollapsed && (
              <button
                type="button"
                onClick={() => setLeftCollapsed(false)}
                title="Expand left topics panel"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary, #9CA3AF)',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <PanelLeftOpen size={17} />
              </button>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: '6px',
                  background: 'rgba(99, 102, 241, 0.12)',
                  color: '#818CF8',
                  border: '1px solid rgba(99, 102, 241, 0.25)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Compass size={12} />
                {activeTopic ? activeTopic.name : 'General Context'}
              </span>

              <span style={{ fontSize: '0.74rem', color: 'var(--text-tertiary, #6B7280)' }}>
                {chatMessages.length} message{chatMessages.length === 1 ? '' : 's'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Pedagogical Tutoring Mode Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <select
                aria-label="Pedagogical Learning Mode"
                value={tutorMode}
                onChange={(e) => setTutorMode(e.target.value)}
                style={{
                  background: 'rgba(99, 102, 241, 0.1)',
                  border: '1px solid rgba(99, 102, 241, 0.35)',
                  color: '#a5b4fc',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  fontSize: '0.74rem',
                  outline: 'none',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <option value="socratic">🏛️ Socratic Guided Mode</option>
                <option value="direct">💡 Direct Instructor Mode</option>
                <option value="exam_prep">⚡ Exam & Drill Prep Mode</option>
              </select>
            </div>

            {/* AI Model Selector */}
            <select
              aria-label="AI Model"
              value={aiModel}
              onChange={(e) => setAiModel(e.target.value)}
              style={{
                background: 'var(--bg-canvas, #121214)',
                border: '1px solid var(--border-stroke, #2D2D35)',
                color: 'var(--text-primary, #F3F4F6)',
                borderRadius: '6px',
                padding: '4px 8px',
                fontSize: '0.74rem',
                outline: 'none',
                fontWeight: 600,
              }}
            >
              <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
              <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
            </select>

            {rightCollapsed && (
              <button
                type="button"
                onClick={() => setRightCollapsed(false)}
                title="Expand context & reference rail"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary, #9CA3AF)',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <PanelRightOpen size={17} />
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Message Thread */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px 32px',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
          }}
        >
          {chatMessages.length === 0 ? (
            /* Empty State: AI Tutor Welcome & Starter Prompts */
            <div
              style={{
                maxWidth: '720px',
                margin: '36px auto 0',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '16px',
              }}
            >
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 8px 24px rgba(99, 102, 241, 0.35)',
                }}
              >
                <Bot size={28} color="#ffffff" />
              </div>

              <div>
                <h3 style={{ margin: '0 0 6px', fontSize: '1.25rem', fontWeight: 800, color: '#F3F4F6' }}>
                  Cipherium AI Pedagogical Tutor
                </h3>
                <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--text-secondary, #9CA3AF)', lineHeight: 1.55 }}>
                  {activeTopic
                    ? `I am currently grounded in ${activeTopic.name}. Ask me about theoretical intuition, code implementations, or edge cases.`
                    : 'Grounded in your active curriculum and diagnostic gap analysis. Ask a conceptual question, request step-by-step algorithms, or practice edge cases.'}
                </p>
              </div>

              {/* Starter Question Cards */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '12px',
                  width: '100%',
                  marginTop: '12px',
                  textAlign: 'left',
                }}
              >
                {(activeTopicRef?.questions || GENERAL_QUESTIONS).slice(0, 4).map((prompt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectQuestion(prompt)}
                    style={{
                      background: 'var(--bg-surface, #1E1E22)',
                      border: '1px solid var(--border-stroke, #2D2D35)',
                      borderRadius: '10px',
                      padding: '14px 16px',
                      color: 'var(--text-secondary, #9CA3AF)',
                      fontSize: '0.8rem',
                      lineHeight: 1.45,
                      cursor: 'pointer',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#6366f1';
                      e.currentTarget.style.color = '#F3F4F6';
                      e.currentTarget.style.background = 'rgba(99, 102, 241, 0.08)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border-stroke, #2D2D35)';
                      e.currentTarget.style.color = 'var(--text-secondary, #9CA3AF)';
                      e.currentTarget.style.background = 'var(--bg-surface, #1E1E22)';
                    }}
                  >
                    <Lightbulb size={15} color="#818CF8" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span>{prompt}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Render Chat Stream */
            chatMessages.map((msg, idx) => {
              if (msg.role === 'user') {
                return (
                  <div
                    key={idx}
                    style={{
                      alignSelf: 'flex-end',
                      maxWidth: '80%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-end',
                      gap: '4px',
                    }}
                  >
                    <div
                      style={{
                        background: '#6366f1',
                        color: '#ffffff',
                        padding: '12px 18px',
                        borderRadius: '14px 14px 2px 14px',
                        fontSize: '0.86rem',
                        lineHeight: 1.5,
                        boxShadow: '0 2px 8px rgba(99, 102, 241, 0.25)',
                        wordBreak: 'break-word',
                      }}
                    >
                      {msg.text}
                    </div>
                  </div>
                );
              }

              // Custom step-by-step interactive card
              if (msg.isCustomCard) {
                return (
                  <div
                    key={idx}
                    style={{
                      alignSelf: 'flex-start',
                      width: '100%',
                      maxWidth: '850px',
                      background: 'var(--bg-surface, #1E1E22)',
                      border: '1px solid var(--border-stroke, #2D2D35)',
                      borderRadius: '14px',
                      padding: '18px 22px',
                      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                      <Brain size={18} color="#818cf8" />
                      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#818cf8' }}>
                        Step-by-step Algorithmic Walkthrough
                      </span>
                    </div>

                    <p style={{ margin: '0 0 14px', color: 'var(--text-primary, #F3F4F6)', fontSize: '0.86rem', lineHeight: 1.5 }}>
                      {msg.text}
                    </p>

                    {msg.array && (
                      <div
                        style={{
                          display: 'flex',
                          gap: '8px',
                          justifyContent: 'center',
                          margin: '18px 0',
                          padding: '12px',
                          background: 'var(--bg-shell, #161618)',
                          borderRadius: '8px',
                          border: '1px solid var(--border-stroke, #2D2D35)',
                        }}
                      >
                        {msg.array.map((num, i) => (
                          <div key={i} style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '0.64rem', color: 'var(--text-tertiary, #6B7280)', marginBottom: '3px' }}>
                              idx {i}
                            </div>
                            <div
                              style={{
                                width: '38px',
                                height: '38px',
                                borderRadius: '8px',
                                background: i === msg.highlightIndex ? '#6366f1' : 'var(--bg-canvas, #121214)',
                                color: '#ffffff',
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: `1px solid ${i === msg.highlightIndex ? '#818cf8' : 'var(--border-stroke, #2D2D35)'}`,
                                fontSize: '0.88rem',
                              }}
                            >
                              {num}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {msg.steps && (
                      <div
                        style={{
                          background: 'var(--bg-shell, #161618)',
                          padding: '12px 16px',
                          borderRadius: '8px',
                          border: '1px solid var(--border-stroke, #2D2D35)',
                          marginBottom: '14px',
                          fontSize: '0.8rem',
                          color: 'var(--text-secondary, #9CA3AF)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px',
                        }}
                      >
                        {msg.steps.map((st, i) => (
                          <div key={i} style={{ display: 'flex', gap: '8px' }}>
                            <span style={{ color: '#818CF8', fontWeight: 700 }}>{i + 1}.</span>
                            <span>{st}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {msg.timeComp && (
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          color: '#818cf8',
                          borderTop: '1px solid var(--border-stroke, #2D2D35)',
                          paddingTop: '10px',
                        }}
                      >
                        <span>Time Complexity: {msg.timeComp}</span>
                        <span>Space Complexity: {msg.spaceComp}</span>
                      </div>
                    )}
                  </div>
                );
              }

              // Standard Assistant Message
              return (
                <div
                  key={idx}
                  style={{
                    alignSelf: 'flex-start',
                    maxWidth: '850px',
                    width: '100%',
                    background: 'var(--bg-surface, #1E1E22)',
                    border: '1px solid var(--border-stroke, #2D2D35)',
                    borderRadius: '14px 14px 14px 2px',
                    padding: '16px 20px',
                    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.25)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '6px',
                          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Bot size={14} color="#fff" />
                      </div>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#c7d2fe' }}>
                        Cipherium Tutor
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {msg.streaming && (
                        <span
                          style={{
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '12px',
                            background: 'rgba(99, 102, 241, 0.2)',
                            color: '#818cf8',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <RefreshCw size={10} className="spin" />
                          Streaming...
                        </span>
                      )}
                      <span
                        style={{
                          fontSize: '0.66rem',
                          padding: '2px 8px',
                          borderRadius: '10px',
                          background:
                            msg.mode === 'exam_prep'
                              ? 'rgba(234, 179, 8, 0.15)'
                              : msg.mode === 'direct'
                              ? 'rgba(59, 130, 246, 0.15)'
                              : 'rgba(99, 102, 241, 0.15)',
                          color:
                            msg.mode === 'exam_prep'
                              ? '#facc15'
                              : msg.mode === 'direct'
                              ? '#60a5fa'
                              : '#a5b4fc',
                          border: '1px solid currentColor',
                          fontWeight: 600,
                        }}
                      >
                        {msg.mode === 'exam_prep'
                          ? 'Exam & Drill'
                          : msg.mode === 'direct'
                          ? 'Direct Instructor'
                          : 'Socratic Guided'}
                      </span>
                    </div>
                  </div>

                  <div
                    style={{
                      fontSize: '0.86rem',
                      lineHeight: 1.6,
                      color: 'var(--text-primary, #F3F4F6)',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}
                  >
                    {msg.text}
                    {msg.streaming && (
                      <span
                        style={{
                          display: 'inline-block',
                          width: '7px',
                          height: '14px',
                          background: '#818cf8',
                          marginLeft: '4px',
                          verticalAlign: 'text-bottom',
                        }}
                      />
                    )}
                  </div>

                  {/* Attached verified learning resources */}
                  {msg.suggested_resources && msg.suggested_resources.length > 0 && (
                    <div
                      style={{
                        marginTop: '6px',
                        paddingTop: '12px',
                        borderTop: '1px solid var(--border-stroke, #2D2D35)',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          color: '#818cf8',
                          marginBottom: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <BookOpen size={13} />
                        <span>Recommended Reinforcement Resources:</span>
                      </div>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {msg.suggested_resources.map((res) => (
                          <a
                            key={res.id}
                            href={res.url}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              fontSize: '0.76rem',
                              color: '#c7d2fe',
                              textDecoration: 'none',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              background: 'rgba(99, 102, 241, 0.1)',
                              padding: '6px 12px',
                              borderRadius: '8px',
                              border: '1px solid rgba(99, 102, 241, 0.25)',
                              transition: 'all 0.15s ease',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'rgba(99, 102, 241, 0.2)';
                              e.currentTarget.style.borderColor = '#6366f1';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)';
                              e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.25)';
                            }}
                          >
                            <span>{res.title}</span>
                            <ExternalLink size={12} />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* Thinking Indicator */}
          {tutorThinking && (
            <div
              style={{
                alignSelf: 'flex-start',
                background: 'var(--bg-surface, #1E1E22)',
                border: '1px solid var(--border-stroke, #2D2D35)',
                padding: '12px 18px',
                borderRadius: '12px',
                fontSize: '0.82rem',
                color: 'var(--text-secondary, #9CA3AF)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <RefreshCw size={15} className="spin" color="#6366f1" />
              <span>Grounding response in syllabus and algorithmic notes...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Bottom sticky input bar (centered & responsive) */}
        <div
          style={{
            padding: '14px 24px',
            borderTop: '1px solid var(--border-stroke, #2D2D35)',
            background: 'var(--bg-shell, #161618)',
            flexShrink: 0,
          }}
        >
          <form
            onSubmit={handleSendChat}
            style={{
              maxWidth: '850px',
              margin: '0 auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: 'var(--bg-canvas, #121214)',
                borderRadius: '12px',
                padding: '8px 14px',
                border: '1px solid var(--border-stroke, #2D2D35)',
                transition: 'border-color 0.15s ease',
              }}
              onFocus={() => {}}
            >
              <button
                type="button"
                title="Attach code snippet or log"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary, #9CA3AF)',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <Paperclip size={18} />
              </button>

              <input
                ref={inputRef}
                type="text"
                placeholder={
                  activeTopic
                    ? `Ask about ${activeTopic.name} (e.g. proof, implementation, edge cases)...`
                    : 'Ask anything about your syllabus or request an algorithmic walkthrough...'
                }
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={handleKeyDown}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: 'var(--text-primary, #F3F4F6)',
                  fontSize: '0.86rem',
                  lineHeight: 1.4,
                }}
              />

              <button
                type="submit"
                disabled={!chatInput.trim() || tutorThinking}
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '8px',
                  background: '#6366f1',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  opacity: !chatInput.trim() || tutorThinking ? 0.45 : 1,
                  transition: 'opacity 0.15s ease, transform 0.15s ease',
                  flexShrink: 0,
                }}
              >
                <Send size={15} color="#fff" />
              </button>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '0.7rem',
                color: 'var(--text-tertiary, #6B7280)',
                padding: '0 4px',
              }}
            >
              <span>Press <kbd style={{ padding: '1px 5px', borderRadius: '4px', background: 'var(--bg-surface, #1E1E22)', border: '1px solid var(--border-stroke, #2D2D35)' }}>Enter</kbd> to send · <kbd style={{ padding: '1px 5px', borderRadius: '4px', background: 'var(--bg-surface, #1E1E22)', border: '1px solid var(--border-stroke, #2D2D35)' }}>Shift + Enter</kbd> for newline</span>
              <span>Grounded in {activeTopic ? activeTopic.name : 'Syllabus Context'}</span>
            </div>
          </form>
        </div>
      </main>

      {/* Panel 3: Right context & reference rail (320px collapsible) */}
      <aside
        style={{
          width: rightCollapsed ? '0px' : '320px',
          minWidth: rightCollapsed ? '0px' : '320px',
          borderLeft: rightCollapsed ? 'none' : '1px solid var(--border-stroke, #2D2D35)',
          background: 'var(--bg-shell, #161618)',
          display: 'flex',
          flexDirection: 'column',
          transition: 'width 0.22s cubic-bezier(0.4, 0, 0.2, 1), min-width 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        <div style={{ width: '320px', display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Header */}
          <div
            style={{
              padding: '14px 16px',
              borderBottom: '1px solid var(--border-stroke, #2D2D35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Compass size={16} color="#6366F1" />
              <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#F3F4F6' }}>
                Context & Reference
              </span>
            </div>

            <button
              type="button"
              onClick={() => setRightCollapsed(true)}
              title="Collapse right rail"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary, #9CA3AF)',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <PanelRightClose size={16} />
            </button>
          </div>

          {/* Scrollable Context Modules */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
            }}
          >
            {/* Section 1: Active Topic Syllabus Notes */}
            <div>
              <div
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  color: 'var(--text-tertiary, #6B7280)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <BookOpen size={13} color="#818CF8" />
                <span>Syllabus Notes</span>
              </div>

              <div
                style={{
                  background: 'var(--bg-surface, #1E1E22)',
                  border: '1px solid var(--border-stroke, #2D2D35)',
                  borderRadius: '10px',
                  padding: '12px 14px',
                }}
              >
                <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#F3F4F6', marginBottom: '6px' }}>
                  {activeTopic ? activeTopic.name : 'Curriculum Grounding'}
                </div>
                <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary, #9CA3AF)', lineHeight: 1.5 }}>
                  {activeTopicRef?.notes}
                </p>
              </div>
            </div>

            {/* Section 2: Key Formulas & Code Snippets */}
            <div>
              <div
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  color: 'var(--text-tertiary, #6B7280)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Code2 size={13} color="#818CF8" />
                <span>Algorithmic Templates</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {activeTopicRef?.formulas?.map((f, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: 'var(--bg-surface, #1E1E22)',
                      border: '1px solid var(--border-stroke, #2D2D35)',
                      borderRadius: '8px',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        padding: '6px 10px',
                        background: 'var(--bg-shell, #161618)',
                        borderBottom: '1px solid var(--border-stroke, #2D2D35)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        color: '#c7d2fe',
                      }}
                    >
                      <span>{f.label}</span>
                      <button
                        type="button"
                        onClick={() => handleCopyCode(f.code, idx)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: copiedSnippet === idx ? '#10B981' : 'var(--text-tertiary, #6B7280)',
                          cursor: 'pointer',
                          padding: '2px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '0.68rem',
                        }}
                      >
                        {copiedSnippet === idx ? <Check size={12} /> : <Copy size={12} />}
                        <span>{copiedSnippet === idx ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>

                    <pre
                      style={{
                        margin: 0,
                        padding: '10px 12px',
                        fontSize: '0.72rem',
                        fontFamily: 'monospace',
                        color: 'var(--text-secondary, #9CA3AF)',
                        lineHeight: 1.45,
                        overflowX: 'auto',
                        background: 'var(--bg-canvas, #121214)',
                      }}
                    >
                      {f.code}
                    </pre>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 3: Suggested Follow-up Inquiries */}
            <div>
              <div
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  color: 'var(--text-tertiary, #6B7280)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Sparkles size={13} color="#818CF8" />
                <span>Suggested Inquiries</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {activeTopicRef?.questions?.map((q, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectQuestion(q)}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '8px',
                      background: 'var(--bg-surface, #1E1E22)',
                      border: '1px solid var(--border-stroke, #2D2D35)',
                      color: 'var(--text-secondary, #9CA3AF)',
                      fontSize: '0.76rem',
                      lineHeight: 1.4,
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'all 0.12s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#6366f1';
                      e.currentTarget.style.color = '#F3F4F6';
                      e.currentTarget.style.background = 'rgba(99, 102, 241, 0.08)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border-stroke, #2D2D35)';
                      e.currentTarget.style.color = 'var(--text-secondary, #9CA3AF)';
                      e.currentTarget.style.background = 'var(--bg-surface, #1E1E22)';
                    }}
                  >
                    <Hash size={13} color="#818CF8" style={{ flexShrink: 0 }} />
                    <span>{q}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
