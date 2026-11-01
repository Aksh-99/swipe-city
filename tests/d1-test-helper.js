import {createSQLiteStore} from '../server/sqlite-store.mjs';
export const createTestDatabase=options=>createSQLiteStore(':memory:',options);
