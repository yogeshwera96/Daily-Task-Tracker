import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glass?: boolean;
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  glass = true,
  hoverable = false,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`rounded-xl p-5 border
        ${glass ? 'glass-panel' : 'bg-slate-900 border-slate-800'}
        ${hoverable ? 'glass-panel-hover' : ''}
        ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
export default Card;
