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

export default function HowDidYouHear({ value, onChange }: HowDidYouHearProps) {
  // Ensure selected is always an array, even if value is null/undefined
  const selected = Array.isArray(value) ? value : [];
  
  // Add console logging to debug null values
  if (!Array.isArray(value)) {
    console.warn('HowDidYouHear: Received non-array value:', value, 'Fixing to empty array');
  }

  const toggle = (opt: string) => {
    // Safety check to ensure selected is an array
    if (!Array.isArray(selected)) {
      console.error('HowDidYouHear: selected is not an array in toggle function:', selected);
      return;
    }
    
    // Safety check for the option parameter
    if (!opt || typeof opt !== 'string') {
      console.error('HowDidYouHear: Invalid option in toggle function:', opt);
      return;
    }
    
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
            className={`checkbox-item ${Array.isArray(selected) && selected.includes(opt) ? 'checked' : ''}`}
          >
            <input
              type="checkbox"
              aria-label={opt}
              checked={Array.isArray(selected) && selected.includes(opt)}
              onChange={() => toggle(opt)}
            />
            <span>{opt}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
