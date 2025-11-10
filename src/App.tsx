import React, { useEffect } from "react";
import { AuthProvider } from "./context/AuthContext";
import { initDB } from "./db/db";
import AppNavigator from "./navigation/AppNavigator";

export default function App() {
    useEffect(() => {
        initDB()
            .then(() => console.log("Database initialized successfully"))
            .catch((err) => console.error("DB Error:", err));
    }, []);

    return (
        <AuthProvider>
            <AppNavigator />
        </AuthProvider>
    );
}
