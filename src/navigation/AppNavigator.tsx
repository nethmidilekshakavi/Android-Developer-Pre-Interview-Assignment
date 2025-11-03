import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import LoginScreen from "../screens/LoginScreen";

import LoanFormScreen from "../screens/LoanFormScreen";
import RegisterScreen from "../screens/LoanFormScreen";
import {useAuth} from "../context/ AuthContext";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
    // @ts-ignore
    const { user } = useAuth();

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {user ? (
                    <Stack.Screen name="LoanForm" component={LoanFormScreen} />
                ) : (
                    <>
                        <Stack.Screen name="Login" component={LoginScreen} />
                        <Stack.Screen name="Register" component={RegisterScreen} />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}
