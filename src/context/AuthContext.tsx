// context/AuthContext.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useState, useContext, useEffect, ReactNode } from "react";

interface AuthContextType {
    isAuthenticated: boolean;
    login: (username: string, password: string) => Promise<boolean>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        const checkLogin = async () => {
            try {
                const stored = await AsyncStorage.getItem("loggedIn");
                if (stored === "true") {
                    setIsAuthenticated(true);
                }
            } catch (error) {
                console.error("Check login error:", error);
            }
        };
        checkLogin();
    }, []);

    const login = async (username: string, password: string): Promise<boolean> => {
        try {
            // username: "manager", password: "mgr2025"
            if (username.trim() === "manager" && password.trim() === "mgr2025") {
                setIsAuthenticated(true);
                await AsyncStorage.setItem("loggedIn", "true");
                await AsyncStorage.setItem("username", username);
                return true;
            }

            return false;
        } catch (error) {
            console.error("Login error:", error);
            return false;
        }
    };

    const logout = async () => {
        try {
            setIsAuthenticated(false);
            await AsyncStorage.removeItem("loggedIn");
            await AsyncStorage.removeItem("username");
        } catch (error) {
            console.error("Logout error:", error);
        }
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within an AuthProvider");
    return context;
};