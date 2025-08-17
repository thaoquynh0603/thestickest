import React from 'react';

interface HowDidYouHearProps {
  value: string[];
  onChange: (values: string[]) => void;
}

const OPTIONS = [
  'Facebook',
  'Instagram',
  'Tiktok',
  'Google',
  'Friend/Family',
  'Other social media',
  'Other',
];

export default function HowDidYouHear({ value = [], onChange }: HowDidYouHearProps) {
  const selected = Array.isArray(value) ? value : [];

  const toggle = (opt: string) => {
    if (selected.includes(opt)) {
      onChange(selected.filter((s) => s !== opt));
    } else {
      onChange([...selected, opt]);
    }
  };

  return (
    <div className="step-container">
      <h2 className="step-title">How did you hear about us?</h2>
      <p className="step-description">Please select at least one option.</p>

      <div className="checkbox-grid">
        {OPTIONS.map((opt) => (
          <label
            key={opt}
            className={`checkbox-item ${selected.includes(opt) ? 'checked' : ''}`}
          >
            <input
              type="checkbox"
              aria-label={opt}
              checked={selected.includes(opt)}
              onChange={() => toggle(opt)}
            />
            <span>{opt}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
