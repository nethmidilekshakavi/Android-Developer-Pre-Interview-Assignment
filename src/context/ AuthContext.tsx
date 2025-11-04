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
            const stored = await AsyncStorage.getItem("loggedIn");
            if (stored === "true") setIsAuthenticated(true);
        };
        checkLogin();
    }, []);

    const login = async (username: string, password: string): Promise<boolean> => {
        if (username === "admin@gmail.com" && password === "admin123") {
            setIsAuthenticated(true);
            await AsyncStorage.setItem("loggedIn", "true");
            return true;
        }
        return false;
    };

    const logout = async () => {
        setIsAuthenticated(false);
        await AsyncStorage.removeItem("loggedIn");
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
