import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import Toast from "react-native-toast-message";
import { useAuth } from "../context/AuthContext";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

type Props = {
    navigation: NativeStackNavigationProp<any>;
};

export default function LoginScreen({ navigation }: Props) {
    const { login } = useAuth();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = async () => {
        if (!username.trim() || !password.trim()) {
            Toast.show({ type: "error", text1: "Please fill in all fields" });
            return;
        }

        try {
            setIsLoading(true);
            const success = await login(username, password);

            if (success) {
                Toast.show({ type: "success", text1: "Login successful!" });
                setTimeout(() => {
                    navigation.navigate("LoanList");
                }, 1000);
            } else {
                Toast.show({ type: "error", text1: "Invalid username or password" });
            }
        } catch (error) {
            Toast.show({ type: "error", text1: "Login failed. Try again." });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <LinearGradient colors={["#2563eb", "#2563eb", "#2563eb"]} style={styles.gradient}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={styles.container}
                >
                    <ScrollView contentContainerStyle={styles.scrollContent}>
                        <View style={styles.header}>
                            <View style={styles.iconContainer}>
                                <Icon name="account-lock" size={80} color="#fff" />
                            </View>
                            <Text style={styles.title}>Welcome Back</Text>
                            <Text style={styles.subtitle}>Login to continue</Text>
                        </View>

                        <View style={styles.card}>
                            {/* Username */}
                            <View style={styles.inputWrapper}>
                                <Text style={styles.label}>Username *</Text>
                                <View style={styles.inputContainer}>
                                    <Icon name="account" size={20} color="#9CA3AF" style={styles.inputIcon} />
                                    <TextInput
                                        placeholder="manager"
                                        placeholderTextColor="#9CA3AF"
                                        style={styles.input}
                                        value={username}
                                        onChangeText={setUsername}
                                        autoCapitalize="none"
                                    />
                                </View>
                            </View>

                            {/* Password */}
                            <View style={styles.inputWrapper}>
                                <Text style={styles.label}>Password *</Text>
                                <View style={styles.inputContainer}>
                                    <Icon name="lock" size={20} color="#9CA3AF" style={styles.inputIcon} />
                                    <TextInput
                                        placeholder="••••••••"
                                        placeholderTextColor="#9CA3AF"
                                        style={[styles.input, { flex: 1 }]}
                                        secureTextEntry={!showPassword}
                                        value={password}
                                        onChangeText={setPassword}
                                    />
                                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                                        <Icon name={showPassword ? "eye-off" : "eye"} size={20} color="#9CA3AF" />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Submit Button */}
                            <TouchableOpacity
                                style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
                                onPress={handleLogin}
                                disabled={isLoading}
                            >
                                <LinearGradient colors={["#2563eb", "#2563eb"]} style={styles.buttonGradient}>
                                    {isLoading ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <>
                                            <Icon name="login" size={20} color="#fff" style={{ marginRight: 8 }} />
                                            <Text style={styles.buttonText}>Login</Text>
                                        </>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>

                            {/* Register navigation (optional) */}
                            <TouchableOpacity
                                onPress={() => navigation.navigate("ApplicationForm")}
                                style={styles.linkContainer}
                            >
                                <Text style={styles.linkText}>New user? Fill Application Form</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </LinearGradient>

            <Toast />
        </>
    );
}

const styles = StyleSheet.create({
    gradient: { flex: 1 },
    container: { flex: 1 },
    scrollContent: { flexGrow: 1, justifyContent: "center", padding: 24 },
    header: { alignItems: "center", marginBottom: 32 },
    iconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: "rgba(59, 130, 246, 0.2)", // Blue with opacity
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 16,
    },
    title: { fontSize: 32, fontWeight: "bold", color: "#fff" },
    subtitle: { fontSize: 16, color: "rgba(255,255,255,0.9)" },
    card: { backgroundColor: "#fff", borderRadius: 24, padding: 24 },
    inputWrapper: { marginBottom: 20 },
    label: { fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 8 },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F9FAFB",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#E5E7EB",
        paddingHorizontal: 12,
    },
    inputIcon: { marginRight: 8 },
    input: { flex: 1, height: 50, fontSize: 16, color: "#1F2937" },
    eyeIcon: { padding: 8 },
    submitButton: { borderRadius: 12, overflow: "hidden", marginTop: 8 },
    submitButtonDisabled: { opacity: 0.7 },
    buttonGradient: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 16,
        backgroundColor: "#2563eb", // Professional blue
    },
    buttonText: { fontSize: 16, fontWeight: "bold", color: "#fff" },
    linkContainer: { marginTop: 16, alignItems: "center" },
    linkText: { color: "#2563eb", fontWeight: "600" }, // Changed to blue
});