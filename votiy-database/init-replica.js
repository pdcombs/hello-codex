const config = {
  _id: 'rs0',
  members: [{ _id: 0, host: '127.0.0.1:27017' }],
}

try {
  const status = rs.status()
  if (status.set !== config._id) throw new Error(`Unexpected replica set: ${status.set}`)
} catch (error) {
  if (error.codeName !== 'NotYetInitialized' && error.code !== 94) throw error
  rs.initiate(config)
}
