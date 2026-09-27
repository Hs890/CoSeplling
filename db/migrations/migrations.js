// Bundles drizzle-kit output for expo-sqlite's migrate(). Add an import + entry here for every new migration
// (and keep meta/_journal.json in sync by generating it with `npx drizzle-kit generate`).
import journal from './meta/_journal.json';
import m0000 from './0000_init.sql';

export default {
  journal,
  migrations: {
    m0000,
  },
};
