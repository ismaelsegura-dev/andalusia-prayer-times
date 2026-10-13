import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

export function getDb() {
  if (!uri) throw new Error('MONGODB_URI no configurada');
  if (!global._mongoClientPromise) {
    global._mongoClientPromise = new MongoClient(uri).connect();
  }
  return global._mongoClientPromise.then((client) =>
    client.db(process.env.MONGODB_DB || 'falak-qayran')
  );
}
