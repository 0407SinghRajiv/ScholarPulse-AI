import React from 'react';
import { BookOpen, Layers, ShieldAlert, Compass, FileText } from 'lucide-react';

export default function TabNavigation({ activeTab, onTabChange }) {
  const tabs = [
    { id: 'summary', label: 'Executive Summary', icon: BookOpen },
    { id: 'methodology', label: 'Methodology Breakdown', icon: Layers },
    { id: 'gaps', label: 'Limitations & Gaps', icon: ShieldAlert },
    { id: 'future', label: 'Future Scope', icon: Compass },
    { id: 'references', label: 'Seminal References', icon: FileText },
  ];

  return (
    <div className="tabs-navigation">
      {tabs.map((tab) => {
        const IconComponent = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`tab-btn ${isActive ? 'active' : ''}`}
          >
            <IconComponent size={18} />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
