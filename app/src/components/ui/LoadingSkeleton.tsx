import React from 'react';

interface LoadingSkeletonProps {
  type?: 'dashboard' | 'table' | 'form' | 'postes';
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ type = 'table' }) => {
  if (type === 'dashboard') {
    return (
      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', padding: '2px' }}>
        {/* Header */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <div className="skeleton-shimmer" style={{ width: '250px', height: '32px' }} />
          <div className="skeleton-shimmer" style={{ width: '400px', height: '16px' }} />
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-4)' }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="card" style={{ height: '110px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 'var(--space-2)' }}>
              <div className="skeleton-shimmer" style={{ width: '60%', height: '14px' }} />
              <div className="skeleton-shimmer" style={{ width: '40%', height: '28px' }} />
            </div>
          ))}
        </div>

        {/* Dynamic content grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 'var(--space-6)' }} className="tarifs-grid">
          <div className="card" style={{ height: '350px', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div className="skeleton-shimmer" style={{ width: '30%', height: '20px' }} />
            <div className="skeleton-shimmer" style={{ width: '100%', height: '240px' }} />
          </div>
          <div className="card" style={{ height: '350px', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div className="skeleton-shimmer" style={{ width: '30%', height: '20px' }} />
            {[1, 2, 3, 4].map(i => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="skeleton-shimmer" style={{ width: '40%', height: '35px' }} />
                <div className="skeleton-shimmer" style={{ width: '20%', height: '20px' }} />
                <div className="skeleton-shimmer" style={{ width: '25%', height: '35px' }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (type === 'postes') {
    return (
      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', padding: '2px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <div className="skeleton-shimmer" style={{ width: '220px', height: '32px' }} />
            <div className="skeleton-shimmer" style={{ width: '350px', height: '16px' }} />
          </div>
          <div className="skeleton-shimmer" style={{ width: '150px', height: '40px' }} />
        </div>

        {/* Category headers & Grid */}
        {[1, 2].map(cat => (
          <div key={cat} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div className="skeleton-shimmer" style={{ width: '180px', height: '24px' }} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
              {[1, 2, 3].map(i => (
                <div key={i} className="card" style={{ height: '180px', padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div className="skeleton-shimmer" style={{ width: '120px', height: '18px' }} />
                    <div className="skeleton-shimmer" style={{ width: '60px', height: '18px' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', margin: 'var(--space-4) 0' }}>
                    <div className="skeleton-shimmer" style={{ width: '100%', height: '12px' }} />
                    <div className="skeleton-shimmer" style={{ width: '80%', height: '12px' }} />
                  </div>
                  <div className="skeleton-shimmer" style={{ width: '100%', height: '36px' }} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'form') {
    return (
      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', padding: '2px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <div className="skeleton-shimmer" style={{ width: '200px', height: '32px' }} />
          <div className="skeleton-shimmer" style={{ width: '300px', height: '16px' }} />
        </div>
        <div className="card" style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                <div className="skeleton-shimmer" style={{ width: '30%', height: '14px' }} />
                <div className="skeleton-shimmer" style={{ width: '100%', height: '42px' }} />
              </div>
            ))}
          </div>
          <div className="skeleton-shimmer" style={{ width: '150px', height: '40px', alignSelf: 'flex-start' }} />
        </div>
      </div>
    );
  }

  // default table loading
  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', padding: '2px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', width: '60%' }}>
          <div className="skeleton-shimmer" style={{ width: '250px', height: '32px' }} />
          <div className="skeleton-shimmer" style={{ width: '350px', height: '16px' }} />
        </div>
        <div className="skeleton-shimmer" style={{ width: '180px', height: '40px' }} />
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ padding: 'var(--space-4)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="skeleton-shimmer" style={{ width: '300px', height: '40px' }} />
        <div className="skeleton-shimmer" style={{ width: '120px', height: '18px' }} />
      </div>

      {/* Table Card */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: 'var(--space-4) var(--space-6)', borderBottom: '1px solid var(--neutral-100)', display: 'flex', gap: 'var(--space-4)' }}>
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="skeleton-shimmer" style={{ flex: 1, height: '16px' }} />
          ))}
        </div>
        {[1, 2, 3, 4, 5].map(row => (
          <div key={row} style={{ padding: 'var(--space-4) var(--space-6)', borderBottom: '1px solid var(--neutral-100)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
            <div className="skeleton-shimmer" style={{ flex: 1, height: '24px' }} />
            <div className="skeleton-shimmer" style={{ flex: 1, height: '18px' }} />
            <div className="skeleton-shimmer" style={{ flex: 1, height: '18px' }} />
            <div className="skeleton-shimmer" style={{ flex: 1, height: '24px' }} />
            <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <div className="skeleton-shimmer" style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-md)' }} />
              <div className="skeleton-shimmer" style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-md)' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
