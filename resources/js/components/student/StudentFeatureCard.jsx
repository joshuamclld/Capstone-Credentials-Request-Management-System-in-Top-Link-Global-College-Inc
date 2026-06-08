import React from 'react';

export default function StudentFeatureCard({ icon, title, description }) {
  return (
    <div className="group relative p-10 bg-surface-container-lowest border border-outline-variant rounded-2xl hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300">
      <div className="mb-8 w-14 h-14 rounded-xl bg-secondary-container flex items-center justify-center text-on-secondary-container group-hover:scale-110 group-hover:bg-primary group-hover:text-on-primary transition-all duration-500">
        <span className="material-symbols-outlined text-3xl">{icon}</span>
      </div>
      <h3 className="font-headline-sm text-xl text-on-background mb-4">{title}</h3>
      <p className="text-on-surface-variant text-body-md leading-relaxed">{description}</p>
    </div>
  );
}
