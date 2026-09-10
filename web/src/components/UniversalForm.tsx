import React, { useState } from 'react';
import type { TrackerField } from '../types';

interface UniversalFormProps {
  fields: TrackerField[];
  onSubmit: (data: any) => void;
  isLoading?: boolean;
}

export const UniversalForm: React.FC<UniversalFormProps> = ({ fields, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState<Record<string, any>>({});

  const handleChange = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="grid">
      {fields.map(field => (
        <div key={field.fieldKey} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{ fontWeight: 500 }}>{field.label} {field.required && <span style={{color: 'var(--danger-color)'}}>*</span>}</label>
          
          {field.type === 'text' && (
            <input 
              type="text" 
              required={field.required}
              onChange={(e) => handleChange(field.fieldKey, e.target.value)} 
            />
          )}

          {field.type === 'number' && (
            <input 
              type="number" 
              required={field.required}
              onChange={(e) => handleChange(field.fieldKey, parseFloat(e.target.value))} 
            />
          )}

          {field.type === 'boolean' && (
            <input 
              type="checkbox" 
              style={{ width: 'auto', alignSelf: 'flex-start' }}
              onChange={(e) => handleChange(field.fieldKey, e.target.checked)} 
            />
          )}

          {field.type === 'date' && (
            <input 
              type="date" 
              required={field.required}
              onChange={(e) => handleChange(field.fieldKey, e.target.value)} 
            />
          )}
          
          {field.type === 'select' && field.options && (
            <select required={field.required} onChange={(e) => handleChange(field.fieldKey, e.target.value)}>
              <option value="">Select...</option>
              {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          )}

        </div>
      ))}
      
      <button type="submit" className="btn btn-primary mt-4" disabled={isLoading}>
        {isLoading ? 'Saving...' : 'Submit Entry'}
      </button>
    </form>
  );
};
