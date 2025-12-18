const { Database } = require('arangojs');

// Configuration
// Ensure you have arangojs installed: npm install arangojs
const host = process.env.ARANGO_url || 'http://localhost:8529';
const password = process.env.ARANGO_ROOT_PASSWORD || 'password';
const dbName = 'aeroliths_db';
const graphName = 'example_graph';

async function main() {
  // 1. Connect to ArangoDB (_system database)
  const systemDb = new Database({
    url: host,
    auth: { username: 'root', password: password },
    databaseName: '_system'
  });

  try {
    // 2. Create a new database
    const dbExists = await systemDb.database(dbName).exists();
    if (!dbExists) {
      await systemDb.createDatabase(dbName);
      console.log(`Database '${dbName}' created.`);
    } else {
      console.log(`Database '${dbName}' already exists.`);
    }

    // Connect to the new database
    const db = new Database({
      url: host,
      auth: { username: 'root', password: password },
      databaseName: dbName
    });

    // 3. Create an example graph
    const graph = db.graph(graphName);
    const graphExists = await graph.exists();

    if (!graphExists) {
      // Create graph and definitions
      // This automatically creates the collections if they don't exist
      await graph.create({
        edgeDefinitions: [
          {
            collection: 'visited',
            from: ['users'],
            to: ['locations']
          }
        ]
      });
      console.log(`Graph '${graphName}' created.`);

      // Add sample data
      const users = db.collection('users');
      const locations = db.collection('locations');
      const visited = db.collection('visited');

      const u1 = await users.save({ name: 'John Doe', active: true });
      const l1 = await locations.save({ name: 'Paris', country: 'France' });

      await visited.save({
        _from: u1._id,
        _to: l1._id,
        year: 2023
      });
      console.log("Sample graph data inserted.");
    } else {
      console.log(`Graph '${graphName}' already exists.`);
    }

  } catch (e) {
    console.error(`An error occurred: ${e.message}`);
  }
}

main();