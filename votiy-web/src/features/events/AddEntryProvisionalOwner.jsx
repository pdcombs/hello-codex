import { FormField, FormSurface } from '../../components/Form.jsx'

export default function AddEntryProvisionalOwner({ contact, onSelect, onCancel }) {
  const isEmail = contact.includes('@')
  function submit(event) {
    event.preventDefault()
    const displayName = new FormData(event.currentTarget).get('displayName')?.trim()
    if (!displayName) return
    onSelect({
      displayName,
      email: isEmail ? contact.trim().toLowerCase() : null,
      phone: isEmail ? null : normalizePhone(contact),
    })
  }
  return (
    <FormSurface className="add-entry-provisional" onSubmit={submit} noValidate>
      <p>No account found. Create a provisional participant for <strong>{contact}</strong>.</p>
      <FormField label="Display name" htmlFor="provisional-owner-name">
        <input id="provisional-owner-name" name="displayName" required autoFocus />
      </FormField>
      <div className="modal-actions">
        <button className="secondary-action" type="button" onClick={onCancel}>Cancel</button>
        <button className="primary-action" type="submit">Use new participant</button>
      </div>
    </FormSurface>
  )
}

function normalizePhone(value) {
  const source = value.trim()
  const digits = source.replace(/\D/g, '')
  if (digits.length === 10) return `+1${digits}`
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`
  return source.startsWith('+') ? `+${digits}` : source
}
