import { cloneElement, isValidElement } from 'react'

export function FormSurface({ as: Component = 'form', className = '', children, ...props }) {
  const classes = ['app-form', className].filter(Boolean).join(' ')
  return (
    <Component className={classes} {...props}>
      {children}
    </Component>
  )
}

export function FormField({ label, htmlFor, stacked = false, optional = false, error = null, children }) {
  const errorId = `${htmlFor}-error`
  const control = isValidElement(children)
    ? cloneElement(children, {
        'aria-label': children.props['aria-label'] ?? label,
        'aria-invalid': error ? 'true' : undefined,
        'aria-describedby': error ? errorId : children.props['aria-describedby'],
      })
    : children

  return (
    <div className={`form-row${stacked ? ' form-row-stacked' : ''}${error ? ' form-row-invalid' : ''}`}>
      <label htmlFor={htmlFor}>
        <span>{label}</span>
        {optional && <span className="form-optional" aria-hidden="true">Optional</span>}
      </label>
      {control}
      {error && <p className="form-field-error" id={errorId}>{error}</p>}
    </div>
  )
}
