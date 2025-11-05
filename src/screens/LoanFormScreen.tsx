import React, { useState, useEffect } from "react";
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
    StatusBar,
    SafeAreaView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as DocumentPicker from "expo-document-picker";
import Toast from "react-native-toast-message";
import { LoanApplication } from "../models/LoanApplication";

type Props = {
    navigation: NativeStackNavigationProp<any>;
    route?: any;
};

export default function LoanFormScreen({ navigation, route }: Props) {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [tel, setTel] = useState("");
    const [occupation, setOccupation] = useState("");
    const [salary, setSalary] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [pdfFile, setPdfFile] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editId, setEditId] = useState<number | undefined>();

    useEffect(() => {
        const params = route?.params;
        if (params?.editMode && params?.loanData) {
            const loanData: LoanApplication = params.loanData;
            setIsEditMode(true);
            setEditId(loanData.id);
            setName(loanData.name || "");
            setEmail(loanData.email || "");
            setTel(loanData.tel || "");
            setOccupation(loanData.occupation || "");
            setSalary(loanData.salary?.toString() || "");
            setPassword("");
            if (loanData.paysheetUri) {
                setPdfFile({
                    name: "Existing PDF File",
                    uri: loanData.paysheetUri,
                });
            }
        }
    }, [route?.params]);

    // ================= VALIDATIONS ==================
    const validateEmail = (email: string) => {
        const regex = /\S+@\S+\.\S+/;
        return regex.test(email);
    };

    const validateTelephone = (tel: string): { isValid: boolean; message: string } => {
        const cleanedTel = tel.replace(/\s+/g, "");

        if (!cleanedTel) {
            return { isValid: false, message: "Telephone number is required" };
        }

        if (!/^\d+$/.test(cleanedTel)) {
            return { isValid: false, message: "Telephone number must contain only digits" };
        }

        if (cleanedTel.length !== 10) {
            return { isValid: false, message: "Telephone number must be exactly 10 digits" };
        }

        if (!/^(0|94)/.test(cleanedTel)) {
            return { isValid: false, message: "Telephone number must start with 0 or 94" };
        }

        return { isValid: true, message: "" };
    };

    const validateSalary = (salary: string): { isValid: boolean; message: string } => {
        if (!salary.trim()) {
            return { isValid: false, message: "Monthly salary is required" };
        }
        const num = Number(salary);
        if (isNaN(num) || num <= 0) {
            return { isValid: false, message: "Salary must be a valid number greater than 0" };
        }
        return { isValid: true, message: "" };
    };

    // =================================================

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
            }
        } catch (err) {
            Toast.show({ type: "error", text1: "Failed to pick document" });
        }
    };

    const handleSubmit = async () => {
        if (!name.trim()) return Toast.show({ type: "error", text1: "Enter your full name" });
        if (!email.trim()) return Toast.show({ type: "error", text1: "Enter your email" });
        if (!validateEmail(email)) return Toast.show({ type: "error", text1: "Invalid email format" });

        const telCheck = validateTelephone(tel);
        if (!telCheck.isValid) return Toast.show({ type: "error", text1: telCheck.message });

        if (!occupation.trim()) return Toast.show({ type: "error", text1: "Enter your occupation" });

        const salaryCheck = validateSalary(salary);
        if (!salaryCheck.isValid) return Toast.show({ type: "error", text1: salaryCheck.message });

        if (!isEditMode) {
            if (!password.trim()) return Toast.show({ type: "error", text1: "Enter password" });
            if (password.length < 4)
                return Toast.show({ type: "error", text1: "Password must be at least 4 characters" });
        }

        if (!pdfFile && !isEditMode)
            return Toast.show({ type: "error", text1: "Upload your paysheet PDF" });

        try {
            setIsLoading(true);
            const existingLoansJson = await AsyncStorage.getItem("loanApplications");
            const existingLoans: LoanApplication[] = existingLoansJson ? JSON.parse(existingLoansJson) : [];

            if (isEditMode && editId) {
                const updatedLoans = existingLoans.map((loan) =>
                    loan.id === editId
                        ? {
                            ...loan,
                            name,
                            email,
                            tel,
                            occupation,
                            salary: Number(salary),
                            paysheetUri: pdfFile?.uri || loan.paysheetUri,
                        }
                        : loan
                );
                await AsyncStorage.setItem("loanApplications", JSON.stringify(updatedLoans));
                Toast.show({ type: "success", text1: "Application updated successfully!" });
                setTimeout(() => navigation.navigate("ApplicationsList"), 800);
            } else {
                const newLoan: LoanApplication = {
                    id: Date.now(),
                    name,
                    email,
                    tel,
                    occupation,
                    salary: Number(salary),
                    paysheetUri: pdfFile?.uri || null,
                    submittedAt: new Date().toISOString(),
                };
                existingLoans.push(newLoan);
                await AsyncStorage.setItem("loanApplications", JSON.stringify(existingLoans));
                Toast.show({ type: "success", text1: "Application submitted successfully!" });
                setTimeout(() => navigation.navigate("Login"), 1000);
            }
        } catch (error) {
            Toast.show({ type: "error", text1: "Failed to save application" });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor="#047857" />
            <View style={styles.headerBar}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Icon name="arrow-left" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>
                    {isEditMode ? "Edit Application" : "New Application"}
                </Text>
                <View style={{ width: 40 }} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                style={styles.container}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.formCard}>
                        <Text style={styles.sectionTitle}>Personal Details</Text>

                        <InputField icon="account" label="Full Name" value={name} onChange={setName} placeholder="Enter your full name" required />
                        <InputField icon="email" label="Email" value={email} onChange={setEmail} placeholder="your.email@example.com" keyboardType="email-address" required />
                        <InputField icon="phone" label="Phone" value={tel} onChange={setTel} placeholder="0771234567" keyboardType="phone-pad" required />
                        <InputField icon="briefcase" label="Occupation" value={occupation} onChange={setOccupation} placeholder="e.g., Software Engineer" required />
                        <InputField icon="currency-usd" label="Monthly Salary" value={salary} onChange={setSalary} placeholder="150000" keyboardType="numeric" required prefix="LKR" />

                        {!isEditMode && (
                            <PasswordField
                                label="Password"
                                value={password}
                                onChange={setPassword}
                                show={showPassword}
                                toggleShow={() => setShowPassword(!showPassword)}
                            />
                        )}

                        <TouchableOpacity style={styles.uploadBox} onPress={pickDocument}>
                            <Icon name="cloud-upload" size={30} color="#047857" />
                            <Text style={{ marginTop: 6 }}>
                                {pdfFile ? pdfFile.name : "Upload paysheet (PDF)"}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={isLoading}>
                            <LinearGradient colors={["#059669", "#047857"]} style={styles.submitGradient}>
                                {isLoading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.submitBtnText}>
                                        {isEditMode ? "Update" : "Submit"}
                                    </Text>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
            <Toast />
        </SafeAreaView>
    );
}

function InputField({ icon, label, value, onChange, placeholder, keyboardType, required, prefix }: any) {
    const [focused, setFocused] = useState(false);
    return (
        <View style={{ marginBottom: 16 }}>
            <Text style={styles.inputLabel}>{label}{required && <Text style={styles.required}> *</Text>}</Text>
            <View style={[styles.inputContainer, focused && styles.focused]}>
                <Icon name={icon} size={20} color={focused ? "#047857" : "#9CA3AF"} style={{ marginRight: 8 }} />
                {prefix && <Text style={styles.prefix}>{prefix}</Text>}
                <TextInput
                    style={{ flex: 1, fontSize: 15 }}
                    placeholder={placeholder}
                    placeholderTextColor="#9CA3AF"
                    value={value}
                    onChangeText={onChange}
                    keyboardType={keyboardType}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                />
            </View>
        </View>
    );
}

function PasswordField({ label, value, onChange, show, toggleShow }: any) {
    const [focused, setFocused] = useState(false);
    return (
        <View style={{ marginBottom: 16 }}>
            <Text style={styles.inputLabel}>{label}<Text style={styles.required}> *</Text></Text>
            <View style={[styles.inputContainer, focused && styles.focused]}>
                <Icon name="lock-outline" size={20} color={focused ? "#047857" : "#9CA3AF"} style={{ marginRight: 8 }} />
                <TextInput
                    style={{ flex: 1, fontSize: 15 }}
                    placeholder="Enter password"
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry={!show}
                    value={value}
                    onChangeText={onChange}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                />
                <TouchableOpacity onPress={toggleShow}>
                    <Icon name={show ? "eye-off-outline" : "eye-outline"} size={20} color="#6B7280" />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: "#f3f4f6", top: 15 },
    headerBar: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "#047857",
        padding: 16,
    },
    headerTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
    container: { flex: 1 },
    scrollContent: { padding: 16 },
    formCard: {
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 20,
        elevation: 2,
    },
    sectionTitle: { fontSize: 18, fontWeight: "700", color: "#1f2937", marginBottom: 12 },
    inputLabel: { fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 6 },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1.5,
        borderColor: "#e5e7eb",
        borderRadius: 10,
        paddingHorizontal: 12,
        height: 48,
        backgroundColor: "#f9fafb",
    },
    focused: {
        borderColor: "#047857",
        backgroundColor: "#fff",
    },
    required: { color: "#dc2626" },
    prefix: { marginRight: 6, color: "#6b7280" },
    uploadBox: {
        borderWidth: 1.5,
        borderColor: "#d1d5db",
        borderStyle: "dashed",
        borderRadius: 10,
        padding: 20,
        alignItems: "center",
        marginTop: 10,
    },
    submitBtn: { borderRadius: 10, overflow: "hidden", marginTop: 20 },
    submitGradient: { paddingVertical: 14, alignItems: "center", justifyContent: "center" },
    submitBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "rgba(255,255,255,0.15)",
        justifyContent: "center",
        alignItems: "center",
    },
});
