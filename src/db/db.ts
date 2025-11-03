import * as SQLite from 'expo-sqlite';
import { LoanApplication } from '../models/LoanApplication';

// Use async open (returns Promise<SQLiteDatabase>)
let db: SQLite.SQLiteDatabase | null = null;

// Initialize the DB
export const initDB = async (): Promise<void> => {
    try {
        db = await SQLite.openDatabaseAsync('loanappDB');

        await db.execAsync(`
      CREATE TABLE IF NOT EXISTS applications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        tel TEXT NOT NULL,
        occupation TEXT NOT NULL,
        salary REAL NOT NULL,
        paysheetUri TEXT
      );
    `);

        console.log('✅ Database and table initialized successfully');
    } catch (error) {
        console.error('❌ Error creating table:', error);
        throw error;
    }
};

// Export db for reuse
export const getDB = async (): Promise<SQLite.SQLiteDatabase> => {
    if (!db) {
        db = await SQLite.openDatabaseAsync('loanappDB');
    }
    return db;
};
