import React from 'react';

interface EllipseProps {
  position: 'left' | 'right' | 'top' | 'bottom' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  color: string;
  size?: 'sm' | 'md' | 'lg';
  blur?: 'sm' | 'md' | 'lg';
  opacity?: number;
  className?: string;
}

const Ellipse: React.FC<EllipseProps> = ({
  position,
  color,
  size = 'md',
  blur = 'md',
  opacity = 0.5,
  className = '',
}) => {
  // Size mapping
  const sizeMap = {
    sm: 'w-32 h-32',
    md: 'w-64 h-64',
    lg: 'w-96 h-96',
  };

  // Blur mapping
  const blurMap = {
    sm: 'blur-xl',
    md: 'blur-2xl',
    lg: 'blur-3xl',
  };

  // Position mapping
  const positionMap = {
    'left': '-left-32 top-1/2 -translate-y-1/2',
    'right': '-right-32 top-1/2 -translate-y-1/2',
    'top': 'left-1/2 -top-32 -translate-x-1/2',
    'bottom': 'left-1/2 -bottom-32 -translate-x-1/2',
    'top-left': '-left-16 -top-16',
    'top-right': '-right-16 -top-16',
    'bottom-left': '-left-16 -bottom-16',
    'bottom-right': '-right-16 -bottom-16',
  };

  return (
    <div
      className={`absolute rounded-full ${sizeMap[size]} ${blurMap[blur]} ${positionMap[position]} ${className}`}
      style={{
        background: color,
        opacity,
        filter: `blur(${blur === 'sm' ? '40px' : blur === 'md' ? '80px' : '120px'})`,
        zIndex: 0,
      }}
    />
  );
};

export default Ellipse; 