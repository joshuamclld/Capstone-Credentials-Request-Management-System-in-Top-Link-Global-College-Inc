import React from 'react';
import { MessageSquare } from 'lucide-react';

export default function RegistrarRemarksCard({ remarks }) {
  if (!remarks) return null;

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-4 sm:p-6">
      <div className="flex items-center gap-2 mb-3">
        <MessageSquare className="w-4 h-4 text-primary" />
        <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">Registrar Remarks</h3>
      </div>
      <p className="text-body-md text-on-surface-variant leading-relaxed whitespace-pre-wrap">{remarks}</p>
    </div>
  );
}
