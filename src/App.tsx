import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { initDB } from "./db/db";
import LoginScreen from "./screens/LoginScreen";
import LoanFormScreen from "./screens/LoanFormScreen";
import LoanListScreen from "./screens/ApplicationsListScreen";
import {AuthProvider} from "./context/ AuthContext";

const Stack = createNativeStackNavigator();

export default function App() {
    useEffect(() => {
        initDB()
            .then(() => console.log("DB Ready"))
            .catch((err) => console.log("DB Error:", err));
    }, []);

    return (
        <AuthProvider>
            <NavigationContainer>
                <Stack.Navigator initialRouteName="Login">
                    <Stack.Screen name="Login" component={LoginScreen} />
                    <Stack.Screen name="ApplicationForm" component={LoanFormScreen} />
                    <Stack.Screen name="LoanList" component={LoanListScreen} />
                </Stack.Navigator>
            </NavigationContainer>
        </AuthProvider>
    );
}
