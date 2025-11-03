import { Platform } from "react-native";
import * as SQLite from "expo-sqlite";
import AsyncStorage from "@react-native-async-storage/async-storage";

const isWeb = Platform.OS === "web";

let db: SQLite.WebSQLDatabase | null = null;

// Initialize DB
export const initDB = async (): Promise<void> => {
    if (isWeb) {
        // Web fallback: no table needed, just ensure key exists
        const existing = await AsyncStorage.getItem("applications");
        if (!existing) await AsyncStorage.setItem("applications", JSON.stringify([]));
        console.log("✅ Web: AsyncStorage initialized");
    } else {
        db = await SQLite.openDatabaseAsync("loanappDB");
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
        console.log("✅ Mobile: SQLite DB initialized");
    }
};

// Get DB instance (Mobile only)
export const getDB = async (): Promise<SQLite.WebSQLDatabase | null> => {
    if (isWeb) return null; // Web uses AsyncStorage
    if (!db) db = await SQLite.openDatabaseAsync("loanappDB");
    return db;
};

// Insert application
export const saveApplication = async (application: any) => {
    if (isWeb) {
        const existing = JSON.parse(
            (await AsyncStorage.getItem("applications")) || "[]"
        );
        existing.push(application);
        await AsyncStorage.setItem("applications", JSON.stringify(existing));
    } else {
        const database = await getDB();
        await database?.execAsync(
            `INSERT INTO applications (name, email, tel, occupation, salary, paysheetUri) VALUES (?, ?, ?, ?, ?, ?);`,
            [
                application.name,
                application.email,
                application.tel,
                application.occupation,
                application.salary,
                application.paysheetUri,
            ]
        );
    }
};

// Fetch all applications
export const getApplications = async () => {
    if (isWeb) {
        return JSON.parse((await AsyncStorage.getItem("applications")) || "[]");
    } else {
        const database = await getDB();
        const result = await database?.execAsync("SELECT * FROM applications;");
        return result?.[0]?.rows?._array || [];
    }
};
