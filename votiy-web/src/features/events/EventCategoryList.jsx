import EventEntryRow from './EventEntryRow.jsx'

export default function EventCategoryList({ categories = [] }) {
  if (categories.length === 0) return <p>No categories available.</p>
  return (
    <div className="event-category-grid" aria-label="Event categories">
      {categories.map((category) => (
        <section className="section-card event-category-card" key={category.id} aria-labelledby={`category-${category.id}`}>
          <div className="section-card-head"><h2 id={`category-${category.id}`}>{category.title}</h2></div>
          <div className="section-card-body">
            {(category.entries ?? []).length === 0
              ? <p>No entries in this category.</p>
              : <ul className="record-list" aria-label={`${category.title} entries`}>
                  {category.entries.map((entry) => <EventEntryRow key={entry.id} entry={entry} />)}
                </ul>}
          </div>
        </section>
      ))}
    </div>
  )
}
