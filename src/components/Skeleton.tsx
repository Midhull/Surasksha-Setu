import React from 'react';

interface SkeletonProps {
  className?: string;
  height?: string;
  opacity?: number;
}

export const Skeleton = ({ className, height, opacity }: SkeletonProps) => (
  <div 
    className={`glass-skeleton ${className}`} 
    style={{ 
      height: height || '1rem',
      '--shimmer-opacity': opacity !== undefined ? opacity : 0.2
    } as React.CSSProperties} 
  />
);
