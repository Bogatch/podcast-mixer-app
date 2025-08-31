import React, { useState } from 'react';
import { InformationCircleIcon } from './icons';

interface InfoTooltipProps {
  text: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export const InfoTooltip: React.FC<InfoTooltipProps> = ({ text, position = 'right' }) => {
  const [show, setShow] = useState(false);

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div 
      className="relative flex items-center"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onFocus={() => setShow(true)}
      onBlur={() => setShow(false)}
      tabIndex={0} // Make it focusable
      role="tooltip"
      aria-describedby="tooltip-content"
    >
      <InformationCircleIcon className="w-5 h-5 text-gray-500 hover:text-gray-300 cursor-help transition-colors" />
      <div 
        id="tooltip-content"
        className={`absolute z-20 p-3 text-sm text-gray-200 bg-gray-900 border border-gray-600 rounded-lg shadow-xl w-64 ${positionClasses[position]} transition-opacity duration-200 ${show ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      >
        {text}
      </div>
    </div>
  );
};
