import React from 'react';
import { ArrowRight, Brain } from 'lucide-react';

export default function HeroBanner({ onContinueLearning, onViewStudyPlan }) {
  return (
    <div
      style={{
        position: 'relative',
        borderRadius: '20px',
        background: 'linear-gradient(135deg, #09122c 0%, #172554 45%, #1e1b4b 100%)',
        color: '#fff',
        padding: '36px 36px',
        marginBottom: '22px',
        overflow: 'hidden',
        boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.2)',
      }}
    >
      <div style={{ maxWidth: '440px', position: 'relative', zIndex: 2 }}>
        <h2 style={{ fontSize: '1.45rem', fontWeight: 800, lineHeight: 1.25, marginBottom: '10px', color: '#fff' }}>
          Your Personalized Learning Journey
        </h2>
        <p style={{ fontSize: '0.86rem', color: '#cbd5e1', lineHeight: 1.5, marginBottom: '22px' }}>
          AI-powered study plans, adaptive practice, and 24/7 tutoring to help you achieve your academic goals.
        </p>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={onContinueLearning}
            className="btn btn-primary"
            style={{ background: '#3b82f6', borderRadius: '12px', padding: '10px 20px', fontSize: '0.85rem' }}
          >
            Continue Learning <ArrowRight size={15} />
          </button>
          <button
            onClick={onViewStudyPlan}
            className="btn btn-ghost"
            style={{ borderRadius: '12px', padding: '10px 20px', fontSize: '0.85rem' }}
          >
            View Study Plan
          </button>
        </div>
      </div>

      {/* Glowing Illustration / AI Mind Graphic on right */}
      <div
        style={{
          position: 'absolute',
          right: '30px',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '380px',
          height: '180px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {/* Floating Action Badges */}
          <div
            style={{
              position: 'absolute',
              left: '10px',
              top: '30px',
              background: 'rgba(59, 130, 246, 0.3)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(147, 197, 253, 0.4)',
              padding: '4px 12px',
              borderRadius: '12px',
              fontSize: '0.72rem',
              color: '#bfdbfe',
            }}
          >
            Learn
          </div>
          <div
            style={{
              position: 'absolute',
              left: '110px',
              top: '10px',
              background: 'rgba(59, 130, 246, 0.3)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(147, 197, 253, 0.4)',
              padding: '4px 12px',
              borderRadius: '12px',
              fontSize: '0.72rem',
              color: '#bfdbfe',
            }}
          >
            Practice
          </div>
          <div
            style={{
              position: 'absolute',
              right: '30px',
              top: '20px',
              background: 'rgba(16, 185, 129, 0.3)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(110, 231, 183, 0.4)',
              padding: '4px 12px',
              borderRadius: '12px',
              fontSize: '0.72rem',
              color: '#a7f3d0',
            }}
          >
            Practice
          </div>
          <div
            style={{
              position: 'absolute',
              right: '50px',
              bottom: '40px',
              background: 'rgba(59, 130, 246, 0.3)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(147, 197, 253, 0.4)',
              padding: '4px 12px',
              borderRadius: '12px',
              fontSize: '0.72rem',
              color: '#bfdbfe',
            }}
          >
            Improve
          </div>
          <div
            style={{
              position: 'absolute',
              left: '70px',
              bottom: '25px',
              background: 'rgba(139, 92, 246, 0.3)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(196, 181, 253, 0.4)',
              padding: '4px 12px',
              borderRadius: '12px',
              fontSize: '0.72rem',
              color: '#ddd6fe',
            }}
          >
            Achieve
          </div>
          {/* Glowing Central Brain Icon */}
          <div
            style={{
              width: '85px',
              height: '85px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, #38bdf8 0%, #3b82f6 50%, #1e1b4b 100%)',
              filter: 'blur(1px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 35px #38bdf8',
            }}
          >
            <Brain size={42} color="#fff" />
          </div>
        </div>
      </div>
    </div>
  );
}
