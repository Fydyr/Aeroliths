import { Database } from 'arangojs'

let db: Database | null = null

export const getArangoDb = (): Database => {
  if (!db) {
    const url = process.env.ARANGO_URL || 'http://localhost:8529'
    const database = process.env.ARANGO_DB || '_system'
    const username = process.env.ARANGO_USER || 'root'
    const password = process.env.ARANGO_PASSWORD || ''

    if (!password) {
      console.warn('ARANGO_PASSWORD not set in environment variables')
    }

    db = new Database({
      url,
      databaseName: database,
      auth: { username, password },
    })
  }

  return db
}

// Helper to close the connection
export const closeArangoDb = async (): Promise<void> => {
  if (db) {
    await db.close()
    db = null
  }
}

// Export database instance for direct use
export default getArangoDb()
