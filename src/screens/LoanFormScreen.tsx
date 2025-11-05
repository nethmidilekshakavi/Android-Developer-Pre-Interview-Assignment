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
    Alert,
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

    // Load data if in edit mode (run only when route.params changes)
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [route?.params]);

    const validateEmail = (email: string) => /\S+@\S+\.\S+/.test(email);

    const pickDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: "application/pdf",
                copyToCacheDirectory: true,
            });
            // @ts-ignore
            if (result.type === "success") {
                // Some versions return assets array, but standard expo gives result with uri/name
                // Normalize to single object for our state
                const file = (result as any).assets && (result as any).assets.length > 0
                    ? (result as any).assets[0]
                    : result;
                setPdfFile(file);
                Toast.show({ type: "success", text1: `Selected: ${file.name || "document"}` });
            } else {
                // user cancelled - do nothing
            }
        } catch (err) {
            console.error("Document pick error:", err);
            Toast.show({ type: "error", text1: "Failed to pick document" });
        }
    };

    const handleSubmit = async () => {
        if (!name.trim()) {
            Toast.show({ type: "error", text1: "Enter your name" });
            return;
        }
        if (!email.trim()) {
            Toast.show({ type: "error", text1: "Enter your email" });
            return;
        }
        if (!validateEmail(email)) {
            Toast.show({ type: "error", text1: "Invalid email format" });
            return;
        }
        if (!tel.trim()) {
            Toast.show({ type: "error", text1: "Enter your telephone number" });
            return;
        }
        if (!occupation.trim()) {
            Toast.show({ type: "error", text1: "Enter your occupation" });
            return;
        }
        if (!salary.trim()) {
            Toast.show({ type: "error", text1: "Enter your monthly salary" });
            return;
        }
        if (isNaN(Number(salary)) || Number(salary) <= 0) {
            Toast.show({ type: "error", text1: "Monthly salary must be a valid number" });
            return;
        }

        if (!isEditMode) {
            if (!password.trim()) {
                Toast.show({ type: "error", text1: "Enter password" });
                return;
            }
            if (password.length < 4) {
                Toast.show({ type: "error", text1: "Password must be at least 4 characters" });
                return;
            }
        }

        if (!pdfFile && !isEditMode) {
            Toast.show({ type: "error", text1: "Upload your paysheet PDF" });
            return;
        }

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

                Toast.show({
                    type: "success",
                    text1: "Application updated successfully!",
                });

                setTimeout(() => {
                    navigation.navigate("ApplicationsList");
                }, 800);
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

                Toast.show({
                    type: "success",
                    text1: "Application submitted successfully!",
                });

                // clear form
                setName("");
                setEmail("");
                setTel("");
                setOccupation("");
                setSalary("");
                setPassword("");
                setPdfFile(null);

                setTimeout(() => {
                    navigation.navigate("Login");
                }, 1000);
            }
        } catch (error) {
            console.error("Save error:", error);
            Toast.show({
                type: "error",
                text1: `Failed to ${isEditMode ? "update" : "save"} application`,
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancelEdit = () => {
        Alert.alert("Cancel Edit", "Are you sure you want to cancel editing? Your changes will be lost.", [
            { text: "Continue Editing", style: "cancel" },
            {
                text: "Cancel",
                style: "destructive",
                onPress: () => navigation.navigate("ApplicationsList"),
            },
        ]);
    };

    const clearForm = () => {
        Alert.alert("Clear Form", "Are you sure you want to clear all fields?", [
            { text: "No", style: "cancel" },
            {
                text: "Yes",
                style: "destructive",
                onPress: () => {
                    setName("");
                    setEmail("");
                    setTel("");
                    setOccupation("");
                    setSalary("");
                    setPassword("");
                    setPdfFile(null);
                    Toast.show({ type: "success", text1: "Form cleared" });
                },
            },
        ]);
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor="#047857" />
            <View style={styles.headerBar}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} activeOpacity={0.7}>
                    <Icon name="arrow-left" size={24} color="#fff" />
                </TouchableOpacity>
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>{isEditMode ? "Edit Application" : "New Application"}</Text>
                    <Text style={styles.headerSubtitle}>{isEditMode ? "Update loan details" : "Personal Loan Application"}</Text>
                </View>
                <View style={styles.headerRight} />
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.container}>
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    nestedScrollEnabled={true}
                >
                    {/* Professional Card Container */}
                    <View style={styles.formCard}>
                        {/* Progress Indicator */}
                        <View style={styles.progressSection}>
                            <View style={styles.progressBar}>
                                <View style={[styles.progressFill, { width: "33%" }]} />
                            </View>
                            <Text style={styles.progressText}>Step 1 of 3 - Personal Information</Text>
                        </View>

                        {/* Section: Personal Details */}
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Icon name="account-circle" size={24} color="#047857" />
                                <Text style={styles.sectionTitle}>Personal Details</Text>
                            </View>

                            <InputField icon="account" label="Full Name" value={name} onChange={setName} placeholder="Enter your full name" required />
                            <InputField icon="email" label="Email Address" value={email} onChange={setEmail} placeholder="your.email@example.com" keyboardType="email-address" required />
                            <InputField icon="phone" label="Phone Number" value={tel} onChange={setTel} placeholder="+94 77 123 4567" keyboardType="phone-pad" required />
                        </View>

                        {/* Divider */}
                        <View style={styles.divider} />

                        {/* Section: Employment Details */}
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Icon name="briefcase" size={24} color="#047857" />
                                <Text style={styles.sectionTitle}>Employment Details</Text>
                            </View>

                            <InputField icon="briefcase-outline" label="Occupation" value={occupation} onChange={setOccupation} placeholder="e.g., Software Engineer" required />
                            <InputField icon="currency-usd" label="Monthly Salary" value={salary} onChange={setSalary} placeholder="150,000" keyboardType="numeric" required prefix="LKR" />
                        </View>

                        {/* Divider */}
                        <View style={styles.divider} />

                        {/* Section: Security */}
                        {!isEditMode && (
                            <>
                                <View style={styles.section}>
                                    <View style={styles.sectionHeader}>
                                        <Icon name="shield-lock" size={24} color="#047857" />
                                        <Text style={styles.sectionTitle}>Security</Text>
                                    </View>

                                    <PasswordField label="Create Password" value={password} onChange={setPassword} show={showPassword} toggleShow={() => setShowPassword(!showPassword)} />
                                    <Text style={styles.passwordHint}>
                                        <Icon name="information" size={14} color="#6b7280" />{" "}
                                        Minimum 4 characters required
                                    </Text>
                                </View>
                                <View style={styles.divider} />
                            </>
                        )}

                        {/* Section: Document Upload */}
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Icon name="file-document" size={24} color="#047857" />
                                <Text style={styles.sectionTitle}>Supporting Documents</Text>
                            </View>

                            <Text style={styles.uploadLabel}>
                                Paysheet Document {!isEditMode && <Text style={styles.required}>*</Text>}
                            </Text>

                            <TouchableOpacity style={[styles.uploadBox, pdfFile && styles.uploadBoxActive]} onPress={pickDocument} disabled={isLoading} activeOpacity={0.7}>
                                <View style={[styles.uploadIcon, pdfFile && styles.uploadIconActive]}>
                                    <Icon name={pdfFile ? "check-circle" : "cloud-upload"} size={32} color={pdfFile ? "#047857" : "#9CA3AF"} />
                                </View>
                                <Text style={pdfFile ? styles.uploadedText : styles.uploadPrompt}>{pdfFile ? pdfFile.name : "Click to upload PDF document"}</Text>
                                <Text style={styles.uploadHint}>{isEditMode ? "Upload a new file to replace existing document" : "PDF format only • Max 10MB"}</Text>
                            </TouchableOpacity>

                            {isEditMode && !pdfFile && (
                                <View style={styles.infoBox}>
                                    <Icon name="information" size={16} color="#0369a1" />
                                    <Text style={styles.infoText}>Your current document will be retained if no new file is selected</Text>
                                </View>
                            )}
                        </View>
                    </View>

                    {/* Action Buttons - Fixed at bottom */}
                    <View style={styles.actionSection}>
                        <View style={styles.buttonContainer}>
                            {isEditMode && (
                                <TouchableOpacity style={[styles.actionButton, styles.cancelBtn]} onPress={handleCancelEdit} disabled={isLoading} activeOpacity={0.8}>
                                    <Icon name="close-circle-outline" size={20} color="#dc2626" />
                                    <Text style={styles.cancelBtnText}>Cancel</Text>
                                </TouchableOpacity>
                            )}

                            <TouchableOpacity style={[styles.actionButton, styles.clearBtn]} onPress={clearForm} disabled={isLoading} activeOpacity={0.8}>
                                <Icon name="refresh" size={20} color="#4b5563" />
                                <Text style={styles.clearBtnText}>Reset</Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity style={[styles.submitBtn, isLoading && styles.submitBtnDisabled]} onPress={handleSubmit} disabled={isLoading} activeOpacity={0.9}>
                            <LinearGradient colors={["#059669", "#047857", "#065f46"]} style={styles.submitGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                                {isLoading ? <ActivityIndicator color="#fff" size="small" /> : <>
                                    <Icon name={isEditMode ? "check-bold" : "send"} size={22} color="#fff" />
                                    <Text style={styles.submitBtnText}>{isEditMode ? "Update Application" : "Submit Application"}</Text>
                                </>}
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            <Toast />
        </SafeAreaView>
    );
}

/** Input Components **/
function InputField({ icon, label, value, onChange, placeholder, keyboardType, required, prefix }: any) {
    const [isFocused, setIsFocused] = useState(false);

    return (
        <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>
                {label} {required && <Text style={styles.required}>*</Text>}
            </Text>
            <View style={[styles.inputContainer, isFocused && styles.inputContainerFocused]}>
                <View style={styles.inputIconWrapper}>
                    <Icon name={icon} size={20} color={isFocused ? "#047857" : "#9CA3AF"} />
                </View>
                {prefix && <Text style={styles.inputPrefix}>{prefix}</Text>}
                <TextInput placeholder={placeholder} placeholderTextColor="#9CA3AF" style={styles.textInput} value={value} onChangeText={onChange} keyboardType={keyboardType || "default"} onFocus={() => setIsFocused(true)} onBlur={() => setIsFocused(false)} />
            </View>
        </View>
    );
}

function PasswordField({ label, value, onChange, show, toggleShow }: any) {
    const [isFocused, setIsFocused] = useState(false);

    return (
        <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>
                {label} <Text style={styles.required}>*</Text>
            </Text>
            <View style={[styles.inputContainer, isFocused && styles.inputContainerFocused]}>
                <View style={styles.inputIconWrapper}>
                    <Icon name="lock-outline" size={20} color={isFocused ? "#047857" : "#9CA3AF"} />
                </View>
                <TextInput placeholder="Enter password" placeholderTextColor="#9CA3AF" style={[styles.textInput, { flex: 1 }]} secureTextEntry={!show} value={value} onChangeText={onChange} onFocus={() => setIsFocused(true)} onBlur={() => setIsFocused(false)} />
                <TouchableOpacity onPress={toggleShow} style={styles.eyeButton}>
                    <Icon name={show ? "eye-off-outline" : "eye-outline"} size={20} color="#6B7280" />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        top:15,
        flex: 1,
        backgroundColor: "#f3f4f6",
    },
    mainContainer: {
        flex: 1,
        backgroundColor: "#f3f4f6",
    },
    headerBar: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "#047857",
        paddingTop: Platform.OS === "ios" ? 12 : 20,
        paddingBottom: 12,
        paddingHorizontal: 16,
        elevation: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "rgba(255,255,255,0.15)",
        justifyContent: "center",
        alignItems: "center",
    },
    headerContent: {
        flex: 1,
        marginLeft: 12,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: "#fff",
        letterSpacing: 0.3,
    },
    headerSubtitle: {
        fontSize: 13,
        color: "rgba(255,255,255,0.85)",
        marginTop: 2,
    },
    headerRight: {
        width: 40,
    },
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 24,
    },
    formCard: {
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
    },
    progressSection: {
        marginBottom: 24,
    },
    progressBar: {
        height: 4,
        backgroundColor: "#e5e7eb",
        borderRadius: 2,
        overflow: "hidden",
        marginBottom: 8,
    },
    progressFill: {
        height: "100%",
        backgroundColor: "#047857",
    },
    progressText: {
        fontSize: 12,
        color: "#6b7280",
        fontWeight: "500",
    },
    section: {
        marginBottom: 4,
    },
    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#1f2937",
        marginLeft: 10,
        letterSpacing: 0.2,
    },
    divider: {
        height: 1,
        backgroundColor: "#e5e7eb",
        marginVertical: 24,
    },
    inputWrapper: {
        marginBottom: 18,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: "600",
        color: "#374151",
        marginBottom: 8,
        letterSpacing: 0.2,
    },
    required: {
        color: "#dc2626",
        fontSize: 14,
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#f9fafb",
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: "#e5e7eb",
        paddingHorizontal: 14,
        height: 52,
    },
    inputContainerFocused: {
        backgroundColor: "#fff",
        borderColor: "#047857",
        elevation: 1,
        shadowColor: "#047857",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    inputIconWrapper: {
        marginRight: 10,
    },
    inputPrefix: {
        fontSize: 15,
        color: "#6b7280",
        fontWeight: "600",
        marginRight: 8,
    },
    textInput: {
        flex: 1,
        fontSize: 15,
        color: "#1f2937",
        fontWeight: "500",
    },
    eyeButton: {
        padding: 8,
        marginLeft: 4,
    },
    passwordHint: {
        fontSize: 12,
        color: "#6b7280",
        marginTop: 6,
        marginLeft: 2,
    },
    uploadLabel: {
        fontSize: 14,
        fontWeight: "600",
        color: "#374151",
        marginBottom: 12,
        letterSpacing: 0.2,
    },
    uploadBox: {
        borderWidth: 2,
        borderStyle: "dashed",
        borderColor: "#d1d5db",
        borderRadius: 12,
        padding: 24,
        alignItems: "center",
        backgroundColor: "#fafafa",
    },
    uploadBoxActive: {
        borderColor: "#10b981",
        backgroundColor: "#f0fdf4",
        borderStyle: "solid",
    },
    uploadIcon: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: "#f3f4f6",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 12,
    },
    uploadIconActive: {
        backgroundColor: "#d1fae5",
    },
    uploadPrompt: {
        fontSize: 15,
        fontWeight: "600",
        color: "#4b5563",
        marginBottom: 4,
    },
    uploadedText: {
        fontSize: 15,
        fontWeight: "600",
        color: "#047857",
        marginBottom: 4,
    },
    uploadHint: {
        fontSize: 12,
        color: "#9ca3af",
        textAlign: "center",
    },
    infoBox: {
        flexDirection: "row",
        backgroundColor: "#e0f2fe",
        padding: 12,
        borderRadius: 8,
        marginTop: 12,
        alignItems: "center",
    },
    infoText: {
        fontSize: 12,
        color: "#0369a1",
        marginLeft: 8,
        flex: 1,
        lineHeight: 16,
    },
    actionSection: {
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 16,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
    },
    buttonContainer: {
        flexDirection: "row",
        gap: 12,
        marginBottom: 12,
    },
    actionButton: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 14,
        borderRadius: 10,
        gap: 8,
    },
    cancelBtn: {
        backgroundColor: "#fef2f2",
        borderWidth: 1.5,
        borderColor: "#fecaca",
    },
    clearBtn: {
        backgroundColor: "#f9fafb",
        borderWidth: 1.5,
        borderColor: "#e5e7eb",
    },
    cancelBtnText: {
        fontSize: 15,
        fontWeight: "700",
        color: "#dc2626",
        letterSpacing: 0.3,
    },
    clearBtnText: {
        fontSize: 15,
        fontWeight: "700",
        color: "#4b5563",
        letterSpacing: 0.3,
    },
    submitBtn: {
        borderRadius: 12,
        overflow: "hidden",
        elevation: 3,
        shadowColor: "#047857",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    submitBtnDisabled: {
        opacity: 0.6,
    },
    submitGradient: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 16,
        gap: 10,
    },
    submitBtnText: {
        fontSize: 16,
        fontWeight: "800",
        color: "#fff",
        letterSpacing: 0.5,
        textTransform: "uppercase",
    },
});
