import React from 'react';
import { getRequestStatusConfig, getPaymentStatusConfig, getBooleanStatusConfig } from '../../utils/statusConfig';

const baseClassByType = {
  request: 'inline-block px-2.5 py-1 text-xs font-semibold rounded-full border',
  payment: 'inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded',
  boolean: 'inline-block px-2.5 py-1 text-xs font-semibold rounded-full border',
};

const statusConfigByType = {
  request: getRequestStatusConfig,
  payment: getPaymentStatusConfig,
  boolean: getBooleanStatusConfig,
};

export default function StatusBadge({ status, type = 'request' }) {
  const getConfig = statusConfigByType[type] || getRequestStatusConfig;
  const config = getConfig(status);
  const baseClass = baseClassByType[type] || baseClassByType.request;

  return (
    <span className={`${baseClass} ${config.className}`}>
      {config.label}
    </span>
  );
}
