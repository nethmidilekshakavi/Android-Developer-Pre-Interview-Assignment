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
            <LinearGradient
                colors={["#0F828C", "#047857"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradient}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={styles.container}
                >
                    <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                        {/* Logo/Header block */}
                        <View style={styles.header}>
                            <LinearGradient
                                colors={["#0F828C", "#047857"]}
                                style={styles.iconCircle}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            >
                                <Icon name="account-lock" size={70} color="#fff" />
                            </LinearGradient>
                            <Text style={styles.title}>Welcome Back!</Text>
                            <Text style={styles.subtitle}>Secure Sign-in to Continue</Text>
                        </View>

                        <View style={styles.cardContainer}>
                            <View style={styles.cardShadow} />
                            <View style={styles.card}>
                                {/* Username */}
                                <View style={styles.inputWrapper}>
                                    <Text style={styles.label}>Username *</Text>
                                    <View style={styles.inputContainer}>
                                        <Icon name="account" size={22} color="#047857" style={styles.inputIcon} />
                                        <TextInput
                                            placeholder="Username"
                                            placeholderTextColor="#9ca3af"
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
                                        <Icon name="lock" size={22} color="#047857" style={styles.inputIcon} />
                                        <TextInput
                                            placeholder="Your Password"
                                            placeholderTextColor="#9ca3af"
                                            style={[styles.input, { flex: 1 }]}
                                            secureTextEntry={!showPassword}
                                            value={password}
                                            onChangeText={setPassword}
                                        />
                                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                                            <Icon name={showPassword ? "eye-off" : "eye"} size={22} color="#047857" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                                {/* Button */}
                                <TouchableOpacity
                                    style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
                                    onPress={handleLogin}
                                    disabled={isLoading}
                                    activeOpacity={0.85}
                                >
                                    <LinearGradient
                                        colors={["#0F828C", "#047857"]}
                                        style={styles.buttonGradient}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                    >
                                        {isLoading ? (
                                            <ActivityIndicator color="#fff" />
                                        ) : (
                                            <>
                                                <Icon name="login" size={22} color="#fff" style={{ marginRight: 8 }} />
                                                <Text style={styles.buttonText}>Login</Text>
                                            </>
                                        )}
                                    </LinearGradient>
                                </TouchableOpacity>
                                {/* Divider/Or */}
                                <View style={styles.dividerRow}>
                                    <View style={styles.divider} />
                                    <Text style={styles.or}>or</Text>
                                    <View style={styles.divider} />
                                </View>
                                {/* Application Form - Link */}
                                <TouchableOpacity
                                    onPress={() => navigation.navigate("ApplicationForm")}
                                    style={styles.linkContainer}
                                >
                                    <Icon name="account-plus" size={18} color="#fff" />
                                    <Text style={styles.linkText}>Fill Application Form</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </LinearGradient>
            <Toast />
        </>
    );
}

const styles = StyleSheet.create({
    gradient: {
        flex: 1,
        minHeight: "100%",
        justifyContent: "center"
    },
    container: { flex: 1 },
    scrollContent: { flexGrow: 1, justifyContent: "center", padding: 0 },
    header: {
        alignItems: "center",
        marginBottom: 32,
        marginTop: 50,
    },
    iconCircle: {
        width: 90,
        height: 90,
        borderRadius: 45,
        marginBottom: 18,
        justifyContent: "center",
        alignItems: "center",
        elevation: 4,
        shadowColor: "#0F828C",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.17,
        shadowRadius: 10,
    },
    title: {
        fontSize: 30,
        fontWeight: "bold",
        color: "#fff",
        letterSpacing: 0.6,
        marginBottom: 5,
    },
    subtitle: {
        fontSize: 16,
        color: "#d1fae5",
        marginBottom: 8,
        fontWeight: "500",
    },
    cardContainer: {
        marginHorizontal: 14,
        position: "relative",
        alignSelf: "center",
    },
    cardShadow: {
        position: "absolute",
        top: 20,
        left: 10,
        right: 10,
        bottom: -10,
        borderRadius: 28,
        backgroundColor: "#d1fae5",
        opacity: 0.5,
        zIndex: 0,
    },
    card: {
        backgroundColor: "#fff",
        borderRadius: 28,
        padding: 28,
        minWidth: "85%",
        elevation: 8,
        shadowColor: "#0F828C",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.13,
        shadowRadius: 14,
        zIndex: 1,
    },
    inputWrapper: { marginBottom: 22 },
    label: {
        fontSize: 15,
        fontWeight: "600",
        color: "#0F828C",
        marginBottom: 7,
        marginLeft: 2,
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#f0fdf4",
        borderRadius: 14,
        borderWidth: 2,
        borderColor: "#0F828C",
        paddingHorizontal: 13,
        paddingVertical: 4,
        shadowColor: "#0F828C",
        shadowOpacity: 0.08,
        shadowRadius: 8,
    },
    inputIcon: { marginRight: 8 },
    input: {
        flex: 1,
        height: 50,
        fontSize: 16,
        color: "#1f2937",
        fontWeight: "500",
        letterSpacing: 0.3,
    },
    eyeIcon: { padding: 8 },
    submitButton: {
        borderRadius: 14,
        overflow: "hidden",
        marginTop: 8,
        marginBottom: 8,
        shadowColor: "#0F828C",
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.13,
        shadowRadius: 8,
        elevation: 2,
    },
    submitButtonDisabled: { opacity: 0.6 },
    buttonGradient: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 15,
        backgroundColor: "#0F828C",
    },
    buttonText: {
        fontSize: 17,
        fontWeight: "bold",
        color: "#fff",
        letterSpacing: 0.7,
        marginLeft: 2,
    },
    dividerRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 14,
        marginBottom: 2,
    },
    divider: {
        flex: 1,
        height: 1.2,
        backgroundColor: "#e5e7eb",
        borderRadius: 2,
    },
    or: {
        marginHorizontal: 10,
        color: "#0F828C",
        fontWeight: "600",
    },
    linkContainer: {
        marginTop: 10,
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "center",
        paddingHorizontal: 12,
        paddingVertical: 9,
        borderRadius: 10,
        backgroundColor: "#0F828C",
        shadowColor: "#047857",
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 2,
    },
    linkText: {
        fontSize: 15,
        fontWeight: "700",
        color: "#fff",
        marginLeft: 7,
        letterSpacing: 0.3,
    },
});