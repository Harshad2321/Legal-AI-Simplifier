import React from 'react';
import { RiskLevel } from '../types';
import { RISK_LEVELS } from '../config/constants';

interface RiskBadgeProps {
  level: RiskLevel;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const RiskBadge: React.FC<RiskBadgeProps> = ({ 
  level, 
  size = 'md', 
  showLabel = true, 
  className = '' 
}) => {
  const riskConfig = RISK_LEVELS[level];
  
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  return (
    <span
      className={`
        inline-flex items-center rounded-full font-medium
        ${riskConfig.bgColor} ${riskConfig.textColor}
        ${sizeClasses[size]}
        ${className}
      `}
    >
      {/* Risk level indicator dot */}
      <span
        className={`w-2 h-2 rounded-full mr-2 bg-${riskConfig.color}-500`}
        aria-hidden="true"
      />
      
      {showLabel && riskConfig.label}
      
      {!showLabel && (
        <span className="sr-only">{riskConfig.label}</span>
      )}
    </span>
  );
};

export default RiskBadge;