export default function EventSetupTabs({ activeTab, onChange, setup, participants }) {
  return (
    <>
      <div role="tablist" aria-label="Event management">
        <button id="setup-tab" role="tab" aria-selected={activeTab === 'setup'} aria-controls="setup-panel"
          onClick={() => onChange('setup')}>Setup</button>
        <button id="participants-tab" role="tab" aria-selected={activeTab === 'participants'} aria-controls="participants-panel"
          onClick={() => onChange('participants')}>Participants</button>
      </div>
      <div id={`${activeTab}-panel`} role="tabpanel" aria-labelledby={`${activeTab}-tab`}>
        {activeTab === 'setup' ? setup : participants}
      </div>
    </>
  )
}
