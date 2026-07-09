export default function SectionCard({ title, children, actions = null, eyebrow = null }) {
  return (
    <section className="section-card">
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <div className="section-card-head">
        <h2>{title}</h2>
        {actions}
      </div>
      <div className="section-card-body">{children}</div>
    </section>
  )
}
