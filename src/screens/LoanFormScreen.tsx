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
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as DocumentPicker from "expo-document-picker";
import Toast from "react-native-toast-message";
import {LoanApplication} from "../models/LoanApplication";

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

    // Load data if in edit mode
    useEffect(() => {
        if (route.params?.editMode && route.params?.loanData) {
            const loanData: LoanApplication = route.params.loanData;
            setIsEditMode(true);
            setEditId(loanData.id);
            setName(loanData.name || "");
            setEmail(loanData.email || "");
            setTel(loanData.tel || "");
            setOccupation(loanData.occupation || "");
            setSalary(loanData.salary?.toString() || "");

            // Note: Password is not stored for security reasons in edit mode
            // You might want to handle this differently
            setPassword(""); // Reset password field

            if (loanData.paysheetUri) {
                setPdfFile({
                    name: "Existing PDF File",
                    uri: loanData.paysheetUri
                });
            }
        }
    }, [route.params]);

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
                // @ts-ignore
            } else if (result.type === "success") {
                setPdfFile(result);
                // @ts-ignore
                Toast.show({ type: "success", text1: `Selected: ${result.name}` });
            }
        } catch (err) {
            Toast.show({ type: "error", text1: "Failed to pick document" });
        }
    };

    const handleSubmit = async () => {
        // Validation
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

        // Password validation only for new applications
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
                // Update existing application
                const updatedLoans = existingLoans.map(loan =>
                    loan.id === editId
                        ? {
                            ...loan,
                            name,
                            email,
                            tel,
                            occupation,
                            salary: Number(salary),
                            paysheetUri: pdfFile?.uri || loan.paysheetUri,
                            // Note: Password is not updated in edit mode for security
                        }
                        : loan
                );

                await AsyncStorage.setItem("loanApplications", JSON.stringify(updatedLoans));

                Toast.show({
                    type: "success",
                    text1: "Application updated successfully!",
                });

                // Navigate back to loan list after 1.5 seconds
                setTimeout(() => {
                    navigation.navigate("ApplicationsList");
                }, 1500);
            } else {
                // Create new application
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

                // Reset form
                setName("");
                setEmail("");
                setTel("");
                setOccupation("");
                setSalary("");
                setPassword("");
                setPdfFile(null);

                // Navigate to Login after 2 seconds
                setTimeout(() => {
                    navigation.navigate("Login");
                }, 2000);
            }
        } catch (error) {
            console.error(error);
            Toast.show({
                type: "error",
                text1: `Failed to ${isEditMode ? 'update' : 'save'} application`
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancelEdit = () => {
        Alert.alert(
            "Cancel Edit",
            "Are you sure you want to cancel editing? Your changes will be lost.",
            [
                { text: "Continue Editing", style: "cancel" },
                {
                    text: "Cancel",
                    style: "destructive",
                    onPress: () => navigation.navigate("ApplicationsList")
                }
            ]
        );
    };

    const clearForm = () => {
        Alert.alert(
            "Clear Form",
            "Are you sure you want to clear all fields?",
            [
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
                    }
                }
            ]
        );
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
                                <Icon
                                    name={isEditMode ? "file-document-edit" : "file-document-plus"}
                                    size={80}
                                    color="#fff"
                                />
                            </View>
                            <Text style={styles.title}>
                                {isEditMode ? "Edit Application" : "Loan Application"}
                            </Text>
                            <Text style={styles.subtitle}>
                                {isEditMode ? "Update your loan application details" : "Fill in your details to apply for a loan"}
                            </Text>
                        </View>

                        {/* Form */}
                        <View style={styles.card}>
                            <InputField
                                icon="account"
                                label="Full Name *"
                                value={name}
                                onChange={setName}
                                placeholder="John Doe"
                            />
                            <InputField
                                icon="email"
                                label="Email *"
                                value={email}
                                onChange={setEmail}
                                placeholder="john@example.com"
                                keyboardType="email-address"
                            />
                            <InputField
                                icon="phone"
                                label="Telephone *"
                                value={tel}
                                onChange={setTel}
                                placeholder="+94771234567"
                                keyboardType="phone-pad"
                            />
                            <InputField
                                icon="briefcase"
                                label="Occupation *"
                                value={occupation}
                                onChange={setOccupation}
                                placeholder="Software Engineer"
                            />
                            <InputField
                                icon="cash"
                                label="Monthly Salary (LKR) *"
                                value={salary}
                                onChange={setSalary}
                                placeholder="150000"
                                keyboardType="numeric"
                            />

                            {/* Password field only for new applications */}
                            {!isEditMode && (
                                <PasswordField
                                    label="Password *"
                                    value={password}
                                    onChange={setPassword}
                                    show={showPassword}
                                    toggleShow={() => setShowPassword(!showPassword)}
                                />
                            )}

                            {/* PDF Upload */}
                            <View style={styles.inputWrapper}>
                                <Text style={styles.label}>
                                    Upload Paysheet (PDF) {!isEditMode && "*"}
                                </Text>
                                <TouchableOpacity
                                    style={styles.uploadContainer}
                                    onPress={pickDocument}
                                    disabled={isLoading}
                                >
                                    <Icon
                                        name={pdfFile ? "file-check" : "file-upload"}
                                        size={40}
                                        color={pdfFile ? "#10b981" : "#9CA3AF"}
                                    />
                                    <View style={styles.uploadTextContainer}>
                                        <Text style={pdfFile ? styles.uploadTextSuccess : styles.uploadText}>
                                            {pdfFile ? pdfFile.name : "Click to upload PDF"}
                                        </Text>
                                        <Text style={styles.uploadSubtext}>
                                            {isEditMode ? "Select new file to replace existing PDF" : "Required for new applications"}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                                {isEditMode && !pdfFile && (
                                    <Text style={styles.helpText}>
                                        Current PDF will be kept if no new file is selected
                                    </Text>
                                )}
                            </View>

                            {/* Action Buttons */}
                            <View style={styles.buttonRow}>
                                {isEditMode && (
                                    <TouchableOpacity
                                        style={[styles.button, styles.cancelButton]}
                                        onPress={handleCancelEdit}
                                        disabled={isLoading}
                                    >
                                        <Icon name="close" size={20} color="#ef4444" />
                                        <Text style={styles.cancelButtonText}>Cancel</Text>
                                    </TouchableOpacity>
                                )}

                                <TouchableOpacity
                                    style={[styles.button, styles.clearButton]}
                                    onPress={clearForm}
                                    disabled={isLoading}
                                >
                                    <Icon name="broom" size={20} color="#6b7280" />
                                    <Text style={styles.clearButtonText}>Clear</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[
                                        styles.button,
                                        styles.submitButton,
                                        isLoading && styles.submitButtonDisabled
                                    ]}
                                    onPress={handleSubmit}
                                    disabled={isLoading}
                                >
                                    <LinearGradient
                                        colors={["#10b981", "#059669"]}
                                        style={styles.buttonGradient}
                                    >
                                        {isLoading ? (
                                            <ActivityIndicator color="#fff" />
                                        ) : (
                                            <>
                                                <Icon
                                                    name={isEditMode ? "check-circle" : "send"}
                                                    size={20}
                                                    color="#fff"
                                                    style={{ marginRight: 8 }}
                                                />
                                                <Text style={styles.buttonText}>
                                                    {isEditMode ? "Update Application" : "Submit Application"}
                                                </Text>
                                            </>
                                        )}
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
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
    iconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: "rgba(255,255,255,0.2)",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 16
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
        paddingHorizontal: 12
    },
    inputIcon: { marginRight: 8 },
    input: { flex: 1, height: 50, fontSize: 16, color: "#1F2937" },
    eyeIcon: { padding: 8 },
    uploadContainer: {
        borderWidth: 2,
        borderStyle: "dashed",
        borderColor: "#E5E7EB",
        borderRadius: 12,
        padding: 24,
        alignItems: "center",
        backgroundColor: "#F9FAFB"
    },
    uploadTextContainer: { alignItems: "center", marginTop: 12 },
    uploadText: { fontSize: 14, color: "#6B7280", fontWeight: "500" },
    uploadTextSuccess: { fontSize: 14, color: "#16a34a", fontWeight: "600" },
    uploadSubtext: { fontSize: 12, color: "#9CA3AF", marginTop: 4 },
    helpText: { fontSize: 12, color: "#6b7280", marginTop: 8, fontStyle: "italic" },
    buttonRow: {
        flexDirection: "row",
        gap: 12,
        marginTop: 8,
    },
    button: {
        flex: 1,
        borderRadius: 12,
        overflow: "hidden",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 16,
    },
    submitButton: {
        flex: 2,
    },
    submitButtonDisabled: { opacity: 0.7 },
    buttonGradient: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 16,
        width: '100%',
        height: '100%',
    },
    cancelButton: {
        backgroundColor: "#fef2f2",
        borderWidth: 1,
        borderColor: "#fecaca",
    },
    clearButton: {
        backgroundColor: "#f3f4f6",
        borderWidth: 1,
        borderColor: "#e5e7eb",
    },
    buttonText: { fontSize: 16, fontWeight: "bold", color: "#fff" },
    cancelButtonText: { fontSize: 16, fontWeight: "600", color: "#ef4444", marginLeft: 8 },
    clearButtonText: { fontSize: 16, fontWeight: "600", color: "#6b7280", marginLeft: 8 },
});