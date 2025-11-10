// navigation/AppNavigator.tsx
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import WelcomeScreen from "../screens/WelcomeScreen";
import LoginScreen from "../screens/LoginScreen";
import LoanFormScreen from "../screens/LoanFormScreen";
import { useAuth } from "../context/AuthContext";
import LoanListScreen from "../screens/ApplicationsListScreen";
import UserLoanSearchScreen from "../screens/UserLoanSearchScreen";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
    const { isAuthenticated } = useAuth();

    return (
        <NavigationContainer>
            <Stack.Navigator
                screenOptions={{ headerShown: false }}
                initialRouteName="Welcome"
            >
                <Stack.Screen name="Welcome" component={WelcomeScreen} />
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="ApplicationForm" component={LoanFormScreen} />
                <Stack.Screen name="LoanList" component={LoanListScreen} />
                <Stack.Screen
                    name="UserLoanSearch"
                    component={UserLoanSearchScreen}
                    options={{ title: 'Find Application' }}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
}