import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LoginScreen from "../screens/LoginScreen";
import LoanFormScreen from "../screens/LoanFormScreen";
import {useAuth} from "../context/ AuthContext";
import LoanListScreen from "../screens/ApplicationsListScreen";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
    const { isAuthenticated } = useAuth();

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {!isAuthenticated ? (
                    <>
                        <Stack.Screen name="Login" component={LoginScreen} />
                        <Stack.Screen name="ApplicationForm" component={LoanFormScreen} />
                    </>
                ) : (
                    <Stack.Screen name="LoanList" component={LoanListScreen} />
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}
