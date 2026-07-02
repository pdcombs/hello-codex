import { useState } from 'react'
import './App.css'

function App() {
  const [message, setMessage] = useState('Hello, World!')
  const [isLoading, setIsLoading] = useState(false)

  async function getMessage() {
    setIsLoading(true)

    try {
      const response = await fetch('/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'hello-world',
        },
        body: JSON.stringify({ query: '{ message }' }),
      })
      const result = await response.json()

      if (!response.ok || result.errors) throw new Error('API request failed')
      setMessage(result.data.message)
    } catch {
      setMessage('Could not reach the back end.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main>
      <h1>{message}</h1>
      <button type="button" onClick={getMessage} disabled={isLoading}>
        {isLoading ? 'Loading…' : 'Click Me'}
      </button>
    </main>
  )
}

export default App
