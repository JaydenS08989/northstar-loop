import { MongoClient, type Collection, type Document } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME ?? "northstar_loop";
let clientPromise: Promise<MongoClient> | null = null;
let indexesPromise: Promise<void> | null = null;

const getClient = () => {
  if (!uri) throw new Error("MONGODB_URI is not configured.");
  if (!clientPromise) clientPromise = new MongoClient(uri).connect();
  return clientPromise;
};

export const getDatabase = async () => (await getClient()).db(dbName);

export const ensureDatabaseIndexes = async (): Promise<void> => {
  if (indexesPromise) return indexesPromise;
  indexesPromise = (async () => {
    const database = await getDatabase();
    await Promise.all([
      database.collection("users").createIndex({ clerkUserId: 1 }, { unique: true }),
      database.collection("goals").createIndex({ userId: 1, status: 1, targetDate: 1 }),
      database.collection("milestones").createIndex({ userId: 1, goalId: 1, order: 1 }),
      database.collection("tasks").createIndex({ userId: 1, status: 1, dueDate: 1 }),
      database.collection("tasks").createIndex({ userId: 1, goalId: 1, plannedDate: 1 }),
      database.collection("focusSessions").createIndex({ userId: 1, startedAt: -1 }),
      database.collection("rateLimits").createIndex({ resetAt: 1 }, { expireAfterSeconds: 0 }),
    ]);
  })();
  return indexesPromise;
};

export const getCollection = async <T extends Document>(name: string): Promise<Collection<T>> => {
  await ensureDatabaseIndexes();
  return (await getDatabase()).collection<T>(name);
};
