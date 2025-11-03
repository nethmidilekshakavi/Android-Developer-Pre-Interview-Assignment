// screens/LoginScreen.tsx
import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    Alert,
    StyleSheet,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import {useAuth} from "../context/ AuthContext";

export default function LoginScreen({ navigation }: any) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();

    const handleLogin = async () => {
        if (!username.trim()) {
            Alert.alert("Error", "Please enter username");
            return;
        }
        if (!password.trim()) {
            Alert.alert("Error", "Please enter password");
            return;
        }

        setIsLoading(true);
        try {
            const success = await login(username, password);

            if (success) {
                Alert.alert("Success", "Login Successful!", [
                    {
                        text: "OK",
                        onPress: () => navigation.navigate("LoanList")
                    },
                ]);
            } else {
                Alert.alert("Login Failed", "Invalid username or password");
            }
        } catch (error) {
            Alert.alert("Error", "Login failed. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <LinearGradient
            colors={["#667eea", "#764ba2", "#f093fb"]}
            style={styles.gradient}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.container}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Tabs */}
                    <View style={styles.tabContainer}>
                        <TouchableOpacity
                            style={styles.tab}
                            onPress={() => navigation.navigate("ApplicationForm")}
                            activeOpacity={0.7}
                        >
                            <Icon name="file-document-edit" size={20} color="#fff" />
                            <Text style={styles.tabText}>Application Form</Text>
                        </TouchableOpacity>

                        <View style={[styles.tab, styles.activeTab]}>
                            <Icon name="shield-account" size={20} color="#667eea" />
                            <Text style={[styles.tabText, styles.activeTabText]}>
                                Manager Login
                            </Text>
                        </View>
                    </View>

                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.iconContainer}>
                            <Icon name="account-circle" size={80} color="#fff" />
                        </View>
                        <Text style={styles.title}>Manager Login</Text>
                        <Text style={styles.subtitle}>
                            Sign in to manage loan applications
                        </Text>
                    </View>

                    {/* Login Form */}
                    <View style={styles.card}>
                        {/* Username */}
                        <View style={styles.inputWrapper}>
                            <Text style={styles.label}>Username</Text>
                            <View style={styles.inputContainer}>
                                <Icon
                                    name="account"
                                    size={20}
                                    color="#9CA3AF"
                                    style={styles.inputIcon}
                                />
                                <TextInput
                                    placeholder="admin@gmail.com"
                                    placeholderTextColor="#9CA3AF"
                                    style={styles.input}
                                    value={username}
                                    onChangeText={setUsername}
                                    autoCapitalize="none"
                                    editable={!isLoading}
                                    keyboardType="email-address"
                                />
                            </View>
                        </View>

                        {/* Password */}
                        <View style={styles.inputWrapper}>
                            <Text style={styles.label}>Password</Text>
                            <View style={styles.inputContainer}>
                                <Icon
                                    name="lock"
                                    size={20}
                                    color="#9CA3AF"
                                    style={styles.inputIcon}
                                />
                                <TextInput
                                    placeholder="admin123"
                                    placeholderTextColor="#9CA3AF"
                                    style={[styles.input, { flex: 1 }]}
                                    secureTextEntry={!showPassword}
                                    value={password}
                                    onChangeText={setPassword}
                                    editable={!isLoading}
                                />
                                <TouchableOpacity
                                    onPress={() => setShowPassword(!showPassword)}
                                    style={styles.eyeIcon}
                                >
                                    <Icon
                                        name={showPassword ? "eye-off" : "eye"}
                                        size={20}
                                        color="#9CA3AF"
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Button */}
                        <TouchableOpacity
                            style={[
                                styles.loginButton,
                                isLoading && styles.loginButtonDisabled,
                            ]}
                            onPress={handleLogin}
                            disabled={isLoading}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={["#667eea", "#764ba2"]}
                                style={styles.buttonGradient}
                            >
                                {isLoading ? (
                                    <>
                                        <ActivityIndicator color="#fff" size="small" />
                                        <Text style={[styles.buttonText, { marginLeft: 8 }]}>Signing in...</Text>
                                    </>
                                ) : (
                                    <>
                                        <Icon
                                            name="login"
                                            size={20}
                                            color="#fff"
                                            style={{ marginRight: 8 }}
                                        />
                                        <Text style={styles.buttonText}>Sign In</Text>
                                    </>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>

                        <View style={styles.helpContainer}>
                            <Icon name="information" size={16} color="#6B7280" />
                            <Text style={styles.helpText}>
                                Use: admin@gmail.com / admin123
                            </Text>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    gradient: { flex: 1 },
    container: { flex: 1 },
    scrollContent: { flexGrow: 1, justifyContent: "center", padding: 24 },
    tabContainer: {
        flexDirection: "row",
        backgroundColor: "rgba(255, 255, 255, 0.15)",
        borderRadius: 16,
        padding: 6,
        marginBottom: 24,
        gap: 8,
    },
    tab: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 12,
        borderRadius: 12,
        gap: 8,
    },
    activeTab: { backgroundColor: "#fff" },
    tabText: { fontSize: 14, fontWeight: "600", color: "#fff" },
    activeTabText: { color: "#667eea" },
    header: { alignItems: "center", marginBottom: 32 },
    iconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: "rgba(255,255,255,0.2)",
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
    loginButton: {
        borderRadius: 12,
        overflow: "hidden",
        marginTop: 8,
    },
    loginButtonDisabled: { opacity: 0.7 },
    buttonGradient: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 16,
    },
    buttonText: { fontSize: 16, fontWeight: "bold", color: "#fff" },
    helpContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginTop: 20,
        padding: 12,
        backgroundColor: "#F3F4F6",
        borderRadius: 8,
    },
    helpText: { fontSize: 13, color: "#6B7280", marginLeft: 6 },
});