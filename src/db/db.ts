import { Platform } from "react-native";
import * as SQLite from "expo-sqlite";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LoanApplication } from "../models/LoanApplication";

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
export const saveApplication = async (application: Omit<LoanApplication, 'id'>) => {
    try {
        const timestamp = new Date().toISOString();

        if (isWeb) {
            const existing = JSON.parse((await AsyncStorage.getItem("applications")) || "[]");
            const newApp: LoanApplication = {
                ...application,
                id: existing.length > 0 ? Math.max(...existing.map((a: LoanApplication) => a.id || 0)) + 1 : 1,
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

            const newApp: LoanApplication = {
                ...application,
                id: result.lastInsertRowId as number,
                submittedAt: timestamp
            };

            console.log("✅ Saved to SQLite, ID:", result.lastInsertRowId);
            return newApp;
        }
    } catch (error) {
        console.error("❌ Save Error:", error);
        throw error;
    }
};

// Get All Applications
export const getApplications = async (): Promise<LoanApplication[]> => {
    try {
        if (isWeb) {
            const data = await AsyncStorage.getItem("applications");
            const parsed: LoanApplication[] = JSON.parse(data || "[]");
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
            const applications: LoanApplication[] = (result || []).map((row: any) => ({
                id: row.id,
                name: row.name,
                email: row.email,
                tel: row.tel,
                occupation: row.occupation,
                salary: row.salary,
                paysheetUri: row.paysheetUri,
                submittedAt: row.submittedAt
            }));

            console.log("✅ Loaded from SQLite:", applications.length, "items");
            console.log("Data:", applications);
            return applications;
        }
    } catch (error) {
        console.error("❌ Get Applications Error:", error);
        return [];
    }
};

// Delete PDF Only (keep application) by ID
export const deletePdfOnly = async (id: number): Promise<boolean> => {
    try {
        if (isWeb) {
            const existing: LoanApplication[] = JSON.parse((await AsyncStorage.getItem("applications")) || "[]");
            const updated = existing.map((app: LoanApplication) =>
                app.id === id ? { ...app, paysheetUri: null } : app
            );
            await AsyncStorage.setItem("applications", JSON.stringify(updated));
            console.log("✅ PDF deleted from AsyncStorage, ID:", id);
            return true;
        } else {
            const database = await getDB();
            if (!database) throw new Error("Database not initialized");

            await database.runAsync("UPDATE applications SET paysheetUri = NULL WHERE id = ?;", [id]);
            console.log("✅ PDF deleted from SQLite, ID:", id);
            return true;
        }
    } catch (error) {
        console.error("❌ Delete PDF Error:", error);
        throw error;
    }
};

// Delete All Applications
export const deleteAllApplications = async (): Promise<boolean> => {
    try {
        if (isWeb) {
            await AsyncStorage.setItem("applications", JSON.stringify([]));
            console.log("✅ All data cleared from AsyncStorage");
            return true;
        } else {
            const database = await getDB();
            if (!database) throw new Error("Database not initialized");

            await database.runAsync("DELETE FROM applications;");
            console.log("✅ All data cleared from SQLite");
            return true;
        }
    } catch (error) {
        console.error("❌ Clear All Error:", error);
        throw error;
    }
};

// Update Application by ID
export const updateApplication = async (id: number, application: Partial<LoanApplication>): Promise<boolean> => {
    try {
        if (isWeb) {
            const existing: LoanApplication[] = JSON.parse((await AsyncStorage.getItem("applications")) || "[]");
            const updated = existing.map((app: LoanApplication) =>
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

// Get Single Application by ID
export const getApplicationById = async (id: number): Promise<LoanApplication | null> => {
    try {
        if (isWeb) {
            const existing: LoanApplication[] = JSON.parse((await AsyncStorage.getItem("applications")) || "[]");
            const app = existing.find((app: LoanApplication) => app.id === id) || null;
            console.log("✅ Found in AsyncStorage:", app);
            return app;
        } else {
            const database = await getDB();
            if (!database) return null;

            const result = await database.getFirstAsync(
                "SELECT * FROM applications WHERE id = ?;",
                [id]
            );

            if (!result) {
                console.log("❌ Application not found, ID:", id);
                return null;
            }

            const app: LoanApplication = {
                id: result.id,
                name: result.name,
                email: result.email,
                tel: result.tel,
                occupation: result.occupation,
                salary: result.salary,
                paysheetUri: result.paysheetUri,
                submittedAt: result.submittedAt
            };

            console.log("✅ Found in SQLite:", app);
            return app;
        }
    } catch (error) {
        console.error("❌ Get By ID Error:", error);
        return null;
    }
};

export const deleteApplication = async (id: number): Promise<boolean> => {
    try {
        if (isWeb) {
            // 🔹 Use consistent key for web storage
            const existingData = await AsyncStorage.getItem("loanApplications");
            const existing: LoanApplication[] = existingData ? JSON.parse(existingData) : [];

            // Remove matching application by ID
            const filtered = existing.filter((app: LoanApplication) => app.id !== id);

            // Save updated list
            await AsyncStorage.setItem("loanApplications", JSON.stringify(filtered));
            console.log("✅ Deleted from AsyncStorage, ID:", id);
            return true;
        } else {
            // 🔹 Mobile: SQLite
            const database = await getDB();
            if (!database) throw new Error("Database not initialized");

            await database.runAsync("DELETE FROM applications WHERE id = ?;", [id]);
            console.log("✅ Deleted from SQLite, ID:", id);
            return true;
        }
    } catch (error) {
        console.error("❌ Delete Error:", error);
        throw error;
    }
};
