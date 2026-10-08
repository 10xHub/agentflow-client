/**
 * Example: Dynamic Form Builder from State Schema
 *
 * This example demonstrates:
 * 1. Fetching agent state schema with graphStateSchema()
 * 2. Parsing field definitions and types
 * 3. Building dynamic form fields based on schema
 * 4. Validating form data against schema
 * 5. Submitting state to the agent
 *
 * To use this component:
 * 1. Wrap your app with <TenxGraphProvider>
 * 2. Use <DynamicFormBuilder /> to generate forms from your agent's schema
 * 3. Customize field renderers as needed
 */

'use client'; // For Next.js App Router

import React, { useState, useEffect, useMemo, createContext, useContext, ReactNode } from 'react';
import {
  TenxGraphClient,
  StateSchemaResponse,
  FieldSchema,
  InvokeResult,
  Message,
} from '10xgraph-client';

// ============================================
// Context Setup
// ============================================

interface TenxGraphContextType {
  client: TenxGraphClient;
}

const TenxGraphContext = createContext<TenxGraphContextType | null>(null);

interface TenxGraphProviderProps {
  baseUrl: string;
  authToken?: string;
  children: ReactNode;
}

export function TenxGraphProvider({ baseUrl, authToken, children }: TenxGraphProviderProps) {
  const client = useMemo(() => {
    return new TenxGraphClient({
      baseUrl,
      authToken,
      debug: true,
    });
  }, [baseUrl, authToken]);

  return <TenxGraphContext.Provider value={{ client }}>{children}</TenxGraphContext.Provider>;
}

function useTenxGraph() {
  const context = useContext(TenxGraphContext);
  if (!context) {
    throw new Error('useTenxGraph must be used within TenxGraphProvider');
  }
  return context.client;
}

// ============================================
// Form Builder Component
// ============================================

interface FormField {
  name: string;
  schema: FieldSchema;
}

export function DynamicFormBuilder() {
  const client = useTenxGraph();

  // State management
  const [fields, setFields] = useState<FormField[]>([]);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  /**
   * Fetch schema on mount
   */
  useEffect(() => {
    fetchSchema();
  }, []);

  const fetchSchema = async () => {
    setLoading(true);
    setError(null);

    try {
      const response: StateSchemaResponse = await client.graphStateSchema();

      // Convert schema fields to array
      const fieldArray: FormField[] = Object.entries(response.data.fields).map(
        ([name, schema]) => ({
          name,
          schema: schema as FieldSchema,
        })
      );

      setFields(fieldArray);

      // Initialize form data with defaults
      const initialData: Record<string, any> = {};
      fieldArray.forEach((field) => {
        if (field.schema.default !== undefined) {
          initialData[field.name] = field.schema.default;
        }
      });
      setFormData(initialData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch schema');
      console.error('Schema fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle field value change
   */
  const handleChange = (fieldName: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  /**
   * Validate form data against schema
   */
  const validateForm = (): string | null => {
    for (const field of fields) {
      const value = formData[field.name];

      // Check required fields
      if (field.schema.required && (value === undefined || value === null || value === '')) {
        return `${field.name} is required`;
      }

      // Type validation
      if (value !== undefined && value !== null && value !== '') {
        const type = field.schema.type;

        if (type === 'number' && isNaN(Number(value))) {
          return `${field.name} must be a number`;
        }

        if (type === 'boolean' && typeof value !== 'boolean') {
          return `${field.name} must be true or false`;
        }

        if (type === 'array' && !Array.isArray(value)) {
          return `${field.name} must be an array`;
        }
      }
    }

    return null;
  };

  /**
   * Submit form data to agent
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError(null);
    setResult(null);

    try {
      // Send form data to agent
      const response: InvokeResult = await client.invoke({
        messages: [
          Message.text_message(
            `Process this form data: ${JSON.stringify(formData, null, 2)}`,
            'user'
          ),
        ],
        config: {
          initial_state: formData,
        },
        granularity: 'full',
      });

      // Extract response
      const responseText = response.messages
        .map((m: any) => {
          return m.content
            .filter((block: any) => block.type === 'text')
            .map((block: any) => block.text)
            .join('');
        })
        .join('');

      setResult(responseText || 'Form submitted successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed');
      console.error('Submit error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Render field based on type
   */
  const renderField = (field: FormField) => {
    const { name, schema } = field;
    const value = formData[name] ?? '';
    const label = schema.description || name;

    switch (schema.type) {
      case 'string':
        if (schema.enum) {
          // Enum: render as select
          return (
            <div key={name} style={styles.field}>
              <label style={styles.label}>
                {label}
                {schema.required && <span style={styles.required}> *</span>}
              </label>
              <select
                value={value}
                onChange={(e) => handleChange(name, e.target.value)}
                style={styles.select}
                required={schema.required}
              >
                <option value="">-- Select --</option>
                {schema.enum.map((option: any) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          );
        } else {
          // Regular string: render as text input
          return (
            <div key={name} style={styles.field}>
              <label style={styles.label}>
                {label}
                {schema.required && <span style={styles.required}> *</span>}
              </label>
              <input
                type="text"
                value={value}
                onChange={(e) => handleChange(name, e.target.value)}
                style={styles.input}
                placeholder={`Enter ${name}`}
                required={schema.required}
              />
            </div>
          );
        }

      case 'number':
        return (
          <div key={name} style={styles.field}>
            <label style={styles.label}>
              {label}
              {schema.required && <span style={styles.required}> *</span>}
            </label>
            <input
              type="number"
              value={value}
              onChange={(e) => handleChange(name, parseFloat(e.target.value))}
              style={styles.input}
              placeholder={`Enter ${name}`}
              required={schema.required}
            />
          </div>
        );

      case 'boolean':
        return (
          <div key={name} style={styles.field}>
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={value === true}
                onChange={(e) => handleChange(name, e.target.checked)}
                style={styles.checkbox}
              />
              {label}
              {schema.required && <span style={styles.required}> *</span>}
            </label>
          </div>
        );

      case 'array':
        return (
          <div key={name} style={styles.field}>
            <label style={styles.label}>
              {label} (comma-separated)
              {schema.required && <span style={styles.required}> *</span>}
            </label>
            <input
              type="text"
              value={Array.isArray(value) ? value.join(', ') : value}
              onChange={(e) => {
                const arrayValue = e.target.value
                  .split(',')
                  .map((item: string) => item.trim())
                  .filter((item: string) => item !== '');
                handleChange(name, arrayValue);
              }}
              style={styles.input}
              placeholder="Enter items separated by commas"
              required={schema.required}
            />
          </div>
        );

      default:
        // Default: text input for unknown types
        return (
          <div key={name} style={styles.field}>
            <label style={styles.label}>
              {label} ({schema.type}){schema.required && <span style={styles.required}> *</span>}
            </label>
            <input
              type="text"
              value={value}
              onChange={(e) => handleChange(name, e.target.value)}
              style={styles.input}
              placeholder={`Enter ${name}`}
              required={schema.required}
            />
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>
          <div style={styles.spinner}></div>
          <p>Loading form schema...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Dynamic Form Builder</h2>
        <button onClick={fetchSchema} style={styles.refreshButton}>
          🔄 Refresh Schema
        </button>
      </div>

      {error && (
        <div style={styles.error}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {result && (
        <div style={styles.success}>
          <strong>Success!</strong>
          <pre style={styles.resultContent}>{result}</pre>
        </div>
      )}

      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.fieldsContainer}>
          {fields.length === 0 ? (
            <div style={styles.emptyState}>
              <p>No form fields available</p>
              <p style={styles.emptyHint}>Check your agent's state schema configuration</p>
            </div>
          ) : (
            fields.map((field) => renderField(field))
          )}
        </div>

        <div style={styles.actions}>
          <button
            type="button"
            onClick={() => {
              setFormData({});
              setError(null);
              setResult(null);
            }}
            style={styles.resetButton}
            disabled={submitting}
          >
            Reset
          </button>
          <button
            type="submit"
            style={{
              ...styles.submitButton,
              ...(submitting && styles.submitButtonDisabled),
            }}
            disabled={submitting || fields.length === 0}
          >
            {submitting ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </form>

      <div style={styles.preview}>
        <h3 style={styles.previewTitle}>Form Data Preview</h3>
        <pre style={styles.previewContent}>{JSON.stringify(formData, null, 2)}</pre>
      </div>
    </div>
  );
}

// ============================================
// Styles
// ============================================

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '20px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    paddingBottom: '16px',
    borderBottom: '2px solid #e0e0e0',
  },
  title: {
    margin: 0,
    fontSize: '24px',
    fontWeight: 600,
    color: '#333',
  },
  refreshButton: {
    padding: '8px 16px',
    backgroundColor: '#ffffff',
    border: '1px solid #ddd',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.2s',
  },
  loading: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#666',
  },
  spinner: {
    width: '40px',
    height: '40px',
    margin: '0 auto 16px',
    border: '4px solid #f3f3f3',
    borderTop: '4px solid #007bff',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  error: {
    padding: '12px 16px',
    marginBottom: '16px',
    backgroundColor: '#fee',
    border: '1px solid #fcc',
    borderRadius: '4px',
    color: '#c33',
    fontSize: '14px',
  },
  success: {
    padding: '12px 16px',
    marginBottom: '16px',
    backgroundColor: '#efe',
    border: '1px solid #cfc',
    borderRadius: '4px',
    color: '#363',
    fontSize: '14px',
  },
  resultContent: {
    marginTop: '8px',
    padding: '8px',
    backgroundColor: '#fff',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '12px',
    overflow: 'auto',
    maxHeight: '200px',
  },
  form: {
    backgroundColor: '#ffffff',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    padding: '24px',
    marginBottom: '24px',
  },
  fieldsContainer: {
    marginBottom: '24px',
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px 20px',
    color: '#999',
  },
  emptyHint: {
    fontSize: '14px',
    marginTop: '8px',
  },
  field: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontSize: '14px',
    fontWeight: 500,
    color: '#333',
  },
  required: {
    color: '#e03',
    fontWeight: 'bold',
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
  },
  select: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    outline: 'none',
    backgroundColor: '#ffffff',
    boxSizing: 'border-box',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '14px',
    color: '#333',
    cursor: 'pointer',
  },
  checkbox: {
    marginRight: '8px',
    width: '18px',
    height: '18px',
    cursor: 'pointer',
  },
  actions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
  },
  resetButton: {
    padding: '12px 24px',
    backgroundColor: '#ffffff',
    color: '#666',
    border: '1px solid #ddd',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
    transition: 'all 0.2s',
  },
  submitButton: {
    padding: '12px 32px',
    backgroundColor: '#007bff',
    color: '#ffffff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 600,
    transition: 'all 0.2s',
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
    cursor: 'not-allowed',
  },
  preview: {
    backgroundColor: '#f8f9fa',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    padding: '16px',
  },
  previewTitle: {
    margin: '0 0 12px 0',
    fontSize: '16px',
    fontWeight: 600,
    color: '#333',
  },
  previewContent: {
    margin: 0,
    padding: '12px',
    backgroundColor: '#ffffff',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '12px',
    fontFamily: 'monospace',
    overflow: 'auto',
    maxHeight: '300px',
  },
};

// ============================================
// Usage Example
// ============================================

/**
 * Example usage in your app:
 *
 * import { TenxGraphProvider, DynamicFormBuilder } from './examples/react-form-builder';
 *
 * function App() {
 *   return (
 *     <TenxGraphProvider
 *       baseUrl="http://localhost:8000"
 *       authToken="your-token"
 *     >
 *       <DynamicFormBuilder />
 *     </TenxGraphProvider>
 *   );
 * }
 */

export default DynamicFormBuilder;
