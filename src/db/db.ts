import { Platform } from "react-native";
import * as SQLite from "expo-sqlite";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {LoanApplication} from "../models/LoanApplication";

const isWeb = Platform.OS === "web";
// @ts-ignore
let db: SQLite.WebSQLDatabase | null = null;

// Initialize DB
export const initDB = async (): Promise<void> => {
    try {
        if (isWeb) {
            const existing = await AsyncStorage.getItem("applications");
            if (!existing) {
                await AsyncStorage.setItem("applications", JSON.stringify([]));
            }
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
                    paysheetUri TEXT,
                    submittedAt TEXT DEFAULT CURRENT_TIMESTAMP
                );
            `);
            console.log("✅ Mobile: SQLite DB initialized");
        }
    } catch (error) {
        console.error("❌ DB Init Error:", error);
        throw error;
    }
};

// @ts-ignore
export const getDB = async (): Promise<SQLite.WebSQLDatabase | null> => {
    if (isWeb) return null;
    if (!db) db = await SQLite.openDatabaseAsync("loanappDB");
    return db;
};

// Save Application
export const saveApplication = async (application: any) => {
    try {
        const timestamp = new Date().toISOString();

        if (isWeb) {
            const existing = JSON.parse((await AsyncStorage.getItem("applications")) || "[]");
            const newApp = {
                ...application,
                id: existing.length > 0 ? Math.max(...existing.map((a: any) => a.id || 0)) + 1 : 1,
                submittedAt: timestamp
            };
            existing.push(newApp);
            await AsyncStorage.setItem("applications", JSON.stringify(existing));
            console.log("✅ Saved to AsyncStorage:", newApp);
            return newApp;
        } else {
            const database = await getDB();
            if (!database) throw new Error("Database not initialized");

            const result = await database.runAsync(
                `INSERT INTO applications (name, email, tel, occupation, salary, paysheetUri, submittedAt)
                 VALUES (?, ?, ?, ?, ?, ?, ?);`,
                [
                    application.name,
                    application.email,
                    application.tel,
                    application.occupation,
                    application.salary,
                    application.paysheetUri || null,
                    timestamp
                ]
            );
            console.log("✅ Saved to SQLite, ID:", result.lastInsertRowId);
            return result;
        }
    } catch (error) {
        console.error("❌ Save Error:", error);
        throw error;
    }
};

// Get All Applications
export const getApplications = async () => {
    try {
        if (isWeb) {
            const data = await AsyncStorage.getItem("applications");
            const parsed = JSON.parse(data || "[]");
            console.log("✅ Loaded from AsyncStorage:", parsed.length, "items");
            console.log("Data:", parsed);
            return parsed;
        } else {
            const database = await getDB();
            if (!database) {
                console.log("❌ Database not initialized");
                return [];
            }

            const result = await database.getAllAsync("SELECT * FROM applications ORDER BY id DESC;");
            console.log("✅ Loaded from SQLite:", result?.length || 0, "items");
            console.log("Data:", result);
            return result || [];
        }
    } catch (error) {
        console.error("❌ Get Applications Error:", error);
        return [];
    }
};


// Update Application
export const updateApplication = async (id: number, application: any) => {
    try {
        if (isWeb) {
            const existing = JSON.parse((await AsyncStorage.getItem("applications")) || "[]");
            const updated = existing.map((app: any) =>
                app.id === id ? { ...app, ...application } : app
            );
            await AsyncStorage.setItem("applications", JSON.stringify(updated));
            console.log("✅ Updated in AsyncStorage, ID:", id);
            return true;
        } else {
            const database = await getDB();
            if (!database) throw new Error("Database not initialized");

            await database.runAsync(
                `UPDATE applications 
                 SET name = ?, email = ?, tel = ?, occupation = ?, salary = ?, paysheetUri = ?
                 WHERE id = ?;`,
                [
                    application.name,
                    application.email,
                    application.tel,
                    application.occupation,
                    application.salary,
                    application.paysheetUri || null,
                    id
                ]
            );
            console.log("✅ Updated in SQLite, ID:", id);
            return true;
        }
    } catch (error) {
        console.error("❌ Update Error:", error);
        throw error;
    }
};

// Get Single Application
export const getApplicationById = async (id: number) => {
    try {
        if (isWeb) {
            const existing = JSON.parse((await AsyncStorage.getItem("applications")) || "[]");
            const app = existing.find((app: any) => app.id === id) || null;
            console.log("✅ Found in AsyncStorage:", app);
            return app;
        } else {
            const database = await getDB();
            if (!database) return null;

            const result = await database.getFirstAsync(
                "SELECT * FROM applications WHERE id = ?;",
                [id]
            );
            console.log("✅ Found in SQLite:", result);
            return result || null;
        }
    } catch (error) {
        console.error("❌ Get By ID Error:", error);
        return null;
    }
};

// db/db.ts
export const deleteApplication = async (id: number): Promise<void> => {
    try {
        console.log(`Deleting application with ID: ${id}`);

        // Get current applications from AsyncStorage
        const storedData = await AsyncStorage.getItem('loanApplications');
        if (storedData) {
            const applications: LoanApplication[] = JSON.parse(storedData);
            // Filter out the application to delete
            const updatedApplications = applications.filter(app => app.id !== id);
            // Save back to AsyncStorage
            await AsyncStorage.setItem('loanApplications', JSON.stringify(updatedApplications));
            console.log(`Application ${id} deleted successfully`);
        }
    } catch (error) {
        console.error('Error deleting application:', error);
        throw error;
    }
};

export const deleteAllApplications = async (): Promise<void> => {
    try {
        await AsyncStorage.removeItem('loanApplications');
        console.log('All applications deleted');
    } catch (error) {
        console.error('Error deleting all applications:', error);
        throw error;
    }
};

export const deletePdfOnly = async (id: number): Promise<void> => {
    try {
        const storedData = await AsyncStorage.getItem('loanApplications');
        if (storedData) {
            const applications: LoanApplication[] = JSON.parse(storedData);
            const updatedApplications = applications.map(app =>
                app.id === id ? { ...app, paysheetUri: null } : app
            );
            await AsyncStorage.setItem('loanApplications', JSON.stringify(updatedApplications));
            console.log(`PDF removed for application ${id}`);
        }
    } catch (error) {
        console.error('Error deleting PDF:', error);
        throw error;
    }
};