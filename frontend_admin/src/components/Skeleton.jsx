const S = ({ className = '' }) => (
  <div style={{ backgroundColor: '#d1d5db', borderRadius: '6px', animation: 'pulse 1.5s ease-in-out infinite' }} className={className}>
    <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }`}</style>
  </div>
);

export default S;
