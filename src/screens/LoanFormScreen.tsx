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
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as DocumentPicker from "expo-document-picker";
import Toast from "react-native-toast-message";

type Props = {
    navigation: NativeStackNavigationProp<any>;
};

export default function LoanFormScreen({ navigation }: Props) {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [telephone, setTelephone] = useState("");
    const [occupation, setOccupation] = useState("");
    const [salary, setSalary] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [pdfFile, setPdfFile] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);

    const validateEmail = (email: string) => /\S+@\S+\.\S+/.test(email);

    const pickDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: "application/pdf",
                copyToCacheDirectory: true,
            });

            if (result.assets && result.assets.length > 0) {
                const file = result.assets[0];
                setPdfFile(file);
                Toast.show({ type: "success", text1: `Selected: ${file.name}` });
            } else if (result.type === "success") {
                setPdfFile(result);
                Toast.show({ type: "success", text1: `Selected: ${result.name}` });
            }
        } catch (err) {
            Toast.show({ type: "error", text1: "Failed to pick document" });
        }
    };

    const handleSubmit = async () => {
        if (!name.trim()) return Toast.show({ type: "error", text1: "Enter your name" });
        if (!email.trim()) return Toast.show({ type: "error", text1: "Enter your email" });
        if (!validateEmail(email))
            return Toast.show({ type: "error", text1: "Invalid email format" });
        if (!telephone.trim())
            return Toast.show({ type: "error", text1: "Enter your telephone number" });
        if (!occupation.trim())
            return Toast.show({ type: "error", text1: "Enter your occupation" });
        if (!salary.trim())
            return Toast.show({ type: "error", text1: "Enter your monthly salary" });
        if (isNaN(Number(salary)) || Number(salary) <= 0)
            return Toast.show({ type: "error", text1: "Monthly salary must be a valid number" });
        if (!password.trim()) return Toast.show({ type: "error", text1: "Enter password" });
        if (password.length < 4)
            return Toast.show({ type: "error", text1: "Password must be at least 4 characters" });
        if (!pdfFile) return Toast.show({ type: "error", text1: "Upload your paysheet PDF" });

        const newLoan = {
            id: Date.now(),
            name,
            email,
            telephone,
            occupation,
            salary: Number(salary),
            password,
            paysheet: pdfFile.name,
            paysheetUri: pdfFile.uri,
            submittedAt: new Date().toISOString(),
        };

        try {
            setIsLoading(true);

            const existingLoansJson = await AsyncStorage.getItem("loanApplications");
            const existingLoans = existingLoansJson ? JSON.parse(existingLoansJson) : [];
            existingLoans.push(newLoan);
            await AsyncStorage.setItem("loanApplications", JSON.stringify(existingLoans));

            // Show success toast
            Toast.show({
                type: "success",
                text1: "Application submitted successfully!",
            });

            // Reset form
            setName("");
            setEmail("");
            setTelephone("");
            setOccupation("");
            setSalary("");
            setPassword("");
            setPdfFile(null);

            // Navigate to Login after 2 seconds
            setTimeout(() => {
                navigation.navigate("Login");
            }, 2000);
        } catch (error) {
            console.error(error);
            Toast.show({ type: "error", text1: "Failed to save application" });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <LinearGradient colors={["#10b981", "#059669", "#047857"]} style={styles.gradient}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={styles.container}
                >
                    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                        {/* Header */}
                        <View style={styles.header}>
                            <View style={styles.iconContainer}>
                                <Icon name="file-document-edit" size={80} color="#fff" />
                            </View>
                            <Text style={styles.title}>Loan Application</Text>
                            <Text style={styles.subtitle}>Fill in your details to apply for a loan</Text>
                        </View>

                        {/* Form */}
                        <View style={styles.card}>
                            <InputField icon="account" label="Full Name *" value={name} onChange={setName} placeholder="John Doe" />
                            <InputField icon="email" label="Email *" value={email} onChange={setEmail} placeholder="john@example.com" keyboardType="email-address" />
                            <InputField icon="phone" label="Telephone *" value={telephone} onChange={setTelephone} placeholder="+94771234567" keyboardType="phone-pad" />
                            <InputField icon="briefcase" label="Occupation *" value={occupation} onChange={setOccupation} placeholder="Software Engineer" />
                            <InputField icon="cash" label="Monthly Salary (LKR) *" value={salary} onChange={setSalary} placeholder="150000" keyboardType="numeric" />
                            <PasswordField label="Password *" value={password} onChange={setPassword} show={showPassword} toggleShow={() => setShowPassword(!showPassword)} />

                            {/* PDF Upload */}
                            <View style={styles.inputWrapper}>
                                <Text style={styles.label}>Upload Paysheet (PDF) *</Text>
                                <TouchableOpacity style={styles.uploadContainer} onPress={pickDocument} disabled={isLoading}>
                                    <Icon name={pdfFile ? "file-check" : "file-upload"} size={40} color={pdfFile ? "#10b981" : "#9CA3AF"} />
                                    <View style={styles.uploadTextContainer}>
                                        <Text style={pdfFile ? styles.uploadTextSuccess : styles.uploadText}>
                                            {pdfFile ? pdfFile.name : "Click to upload PDF"}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            </View>

                            {/* Submit */}
                            <TouchableOpacity style={[styles.submitButton, isLoading && styles.submitButtonDisabled]} onPress={handleSubmit} disabled={isLoading}>
                                <LinearGradient colors={["#10b981", "#059669"]} style={styles.buttonGradient}>
                                    {isLoading ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <>
                                            <Icon name="check-circle" size={20} color="#fff" style={{ marginRight: 8 }} />
                                            <Text style={styles.buttonText}>Submit Application</Text>
                                        </>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </LinearGradient>

            {/* Toast Container */}
            <Toast />
        </>
    );
}

/** Input components **/
function InputField({ icon, label, value, onChange, placeholder, keyboardType }: any) {
    return (
        <View style={styles.inputWrapper}>
            <Text style={styles.label}>{label}</Text>
            <View style={styles.inputContainer}>
                <Icon name={icon} size={20} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                    placeholder={placeholder}
                    placeholderTextColor="#9CA3AF"
                    style={styles.input}
                    value={value}
                    onChangeText={onChange}
                    keyboardType={keyboardType || "default"}
                />
            </View>
        </View>
    );
}

function PasswordField({ label, value, onChange, show, toggleShow }: any) {
    return (
        <View style={styles.inputWrapper}>
            <Text style={styles.label}>{label}</Text>
            <View style={styles.inputContainer}>
                <Icon name="lock" size={20} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                    placeholder="••••••••"
                    placeholderTextColor="#9CA3AF"
                    style={[styles.input, { flex: 1 }]}
                    secureTextEntry={!show}
                    value={value}
                    onChangeText={onChange}
                />
                <TouchableOpacity onPress={toggleShow} style={styles.eyeIcon}>
                    <Icon name={show ? "eye-off" : "eye"} size={20} color="#9CA3AF" />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    gradient: { flex: 1 },
    container: { flex: 1 },
    scrollContent: { flexGrow: 1, justifyContent: "center", padding: 24 },
    header: { alignItems: "center", marginBottom: 32 },
    iconContainer: { width: 120, height: 120, borderRadius: 60, backgroundColor: "rgba(255,255,255,0.2)", justifyContent: "center", alignItems: "center", marginBottom: 16 },
    title: { fontSize: 32, fontWeight: "bold", color: "#fff" },
    subtitle: { fontSize: 16, color: "rgba(255,255,255,0.9)" },
    card: { backgroundColor: "#fff", borderRadius: 24, padding: 24 },
    inputWrapper: { marginBottom: 20 },
    label: { fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 8 },
    inputContainer: { flexDirection: "row", alignItems: "center", backgroundColor: "#F9FAFB", borderRadius: 12, borderWidth: 1, borderColor: "#E5E7EB", paddingHorizontal: 12 },
    inputIcon: { marginRight: 8 },
    input: { flex: 1, height: 50, fontSize: 16, color: "#1F2937" },
    eyeIcon: { padding: 8 },
    uploadContainer: { borderWidth: 2, borderStyle: "dashed", borderColor: "#E5E7EB", borderRadius: 12, padding: 24, alignItems: "center", backgroundColor: "#F9FAFB" },
    uploadTextContainer: { alignItems: "center", marginTop: 12 },
    uploadText: { fontSize: 14, color: "#6B7280" },
    uploadTextSuccess: { fontSize: 14, color: "#16a34a", fontWeight: "600" },
    submitButton: { borderRadius: 12, overflow: "hidden", marginTop: 8 },
    submitButtonDisabled: { opacity: 0.7 },
    buttonGradient: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 16 },
    buttonText: { fontSize: 16, fontWeight: "bold", color: "#fff" },
});
