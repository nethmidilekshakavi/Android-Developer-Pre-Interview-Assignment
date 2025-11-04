// screens/ApplicationsListScreen.tsx
import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    Alert,
    RefreshControl,
    Modal,
    ScrollView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { useAuth } from "../context/AuthContext";
import {LoanApplication} from "../models/LoanApplication";

export default function LoanListScreen({ navigation }: any) {
    const [loans, setLoans] = useState<LoanApplication[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedPdf, setSelectedPdf] = useState<string | null>(null);
    const [pdfModalVisible, setPdfModalVisible] = useState(false);
    const { logout } = useAuth();

    const loadLoans = async () => {
        try {
            const data = await AsyncStorage.getItem("loanApplications");
            if (data) {
                const parsedData: LoanApplication[] = JSON.parse(data);
                // Ensure all loans have proper IDs
                const loansWithIds = parsedData.map((loan, index) => ({
                    ...loan,
                    id: loan.id || index + 1,
                    submittedAt: loan.submittedAt || new Date().toISOString()
                }));
                setLoans(loansWithIds);
                console.log("Loaded loans:", loansWithIds.length);
            } else {
                setLoans([]);
            }
        } catch (error) {
            console.error("Error loading loans:", error);
            Alert.alert("Error", "Failed to load loan applications");
        }
    };

    useEffect(() => {
        loadLoans();

        // Reload loans when screen comes into focus
        const unsubscribe = navigation.addListener('focus', () => {
            loadLoans();
        });

        return unsubscribe;
    }, [navigation]);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadLoans();
        setRefreshing(false);
    };

    const handleLogout = () => {
        Alert.alert("Logout", "Are you sure you want to logout?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Logout",
                onPress: () => {
                    logout();
                    navigation.navigate("Login");
                },
            },
        ]);
    };

    const clearAllData = () => {
        Alert.alert("Clear All Data", "This will delete all loan applications. Continue?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete All",
                style: "destructive",
                onPress: async () => {
                    try {
                        await AsyncStorage.removeItem("loanApplications");
                        setLoans([]);
                        Alert.alert("Success", "All data cleared");
                    } catch (error) {
                        Alert.alert("Error", "Failed to clear data");
                    }
                },
            },
        ]);
    };

    const handleViewPdf = async (paysheetUri: string | null | undefined, applicantName: string) => {
        try {
            if (!paysheetUri) {
                Alert.alert("No File", "Paysheet not available for this application");
                return;
            }

            // Check if file exists
            const fileInfo = await FileSystem.getInfoAsync(paysheetUri);

            if (!fileInfo.exists) {
                Alert.alert("Error", "Paysheet file not found or has been deleted");
                return;
            }

            // Set the PDF URI for modal view
            setSelectedPdf(paysheetUri);
            setPdfModalVisible(true);

        } catch (error) {
            console.error("PDF view error:", error);
            Alert.alert("Error", "Failed to open paysheet file");
        }
    };

    const handleDownloadPdf = async (paysheetUri: string | null | undefined, applicantName: string) => {
        try {
            if (!paysheetUri) {
                Alert.alert("No File", "Paysheet not available for download");
                return;
            }

            const fileInfo = await FileSystem.getInfoAsync(paysheetUri);

            if (!fileInfo.exists) {
                Alert.alert("Error", "Paysheet file not found");
                return;
            }

            // Share the file
            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(paysheetUri, {
                    mimeType: 'application/pdf',
                    dialogTitle: `${applicantName}'s Paysheet`,
                    UTI: 'com.adobe.pdf'
                });
            } else {
                Alert.alert("Error", "Sharing is not available on this device");
            }
        } catch (error) {
            console.error("Download error:", error);
            Alert.alert("Error", "Failed to download paysheet");
        }
    };

    const handleDeletePdf = async (loanId: number | undefined, applicantName: string) => {
        if (!loanId) {
            Alert.alert("Error", "Invalid application ID");
            return;
        }

        Alert.alert(
            "Delete Paysheet",
            `Are you sure you want to delete ${applicantName}'s paysheet?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            const updatedLoans = loans.map(loan =>
                                loan.id === loanId
                                    ? { ...loan, paysheetUri: null }
                                    : loan
                            );

                            setLoans(updatedLoans);
                            await AsyncStorage.setItem(
                                "loanApplications",
                                JSON.stringify(updatedLoans)
                            );

                            Alert.alert("Success", "Paysheet deleted successfully");
                        } catch (error) {
                            console.error(error);
                            Alert.alert("Error", "Failed to delete paysheet");
                        }
                    },
                },
            ]
        );
    };

    const handleEdit = (loan: LoanApplication) => {
        navigation.navigate("ApplicationForm", {
            editMode: true,
            loanData: loan
        });
    };

    const handleDeleteApplication = (id: number | undefined, name: string) => {
        if (!id) {
            Alert.alert("Error", "Invalid application ID");
            return;
        }

        Alert.alert(
            "Delete Application",
            `Are you sure you want to delete ${name}'s loan application?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            const updatedLoans = loans.filter((loan) => loan.id !== id);
                            setLoans(updatedLoans);
                            await AsyncStorage.setItem(
                                "loanApplications",
                                JSON.stringify(updatedLoans)
                            );
                            Alert.alert("Success", "Loan application deleted successfully");
                        } catch (error) {
                            console.error(error);
                            Alert.alert("Error", "Failed to delete loan application");
                        }
                    },
                },
            ]
        );
    };

    const renderLoanItem = ({ item }: { item: LoanApplication }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{item.name}</Text>
                    <Text style={styles.loanId}>ID: {item.id}</Text>
                </View>
                <View style={styles.actionButtons}>
                    <TouchableOpacity
                        onPress={() => handleEdit(item)}
                        style={styles.actionButton}
                    >
                        <Icon name="pencil" size={20} color="#667eea" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => handleDeleteApplication(item.id, item.name)}
                        style={styles.actionButton}
                    >
                        <Icon name="delete" size={20} color="#ef4444" />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.details}>
                <View style={styles.detailRow}>
                    <Icon name="email" size={16} color="#666" />
                    <Text style={styles.detailText}>{item.email}</Text>
                </View>

                <View style={styles.detailRow}>
                    <Icon name="phone" size={16} color="#666" />
                    <Text style={styles.detailText}>{item.tel}</Text>
                </View>

                <View style={styles.detailRow}>
                    <Icon name="briefcase" size={16} color="#666" />
                    <Text style={styles.detailText}>{item.occupation}</Text>
                </View>

                <View style={styles.detailRow}>
                    <Icon name="cash" size={16} color="#666" />
                    <Text style={styles.detailText}>
                        LKR {Number(item.salary).toLocaleString()}
                    </Text>
                </View>

                <View style={styles.detailRow}>
                    <Icon name="calendar" size={16} color="#666" />
                    <Text style={styles.detailText}>
                        {item.submittedAt ? new Date(item.submittedAt).toLocaleString() : 'N/A'}
                    </Text>
                </View>

                {/* PDF Actions */}
                <View style={styles.pdfActions}>
                    {item.paysheetUri ? (
                        <>
                            <TouchableOpacity
                                style={[styles.pdfButton, styles.viewButton]}
                                onPress={() => handleViewPdf(item.paysheetUri, item.name)}
                            >
                                <Icon name="eye" size={18} color="#fff" />
                                <Text style={styles.pdfButtonText}>View PDF</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.pdfButton, styles.downloadButton]}
                                onPress={() => handleDownloadPdf(item.paysheetUri, item.name)}
                            >
                                <Icon name="download" size={18} color="#fff" />
                                <Text style={styles.pdfButtonText}>Download</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.pdfButton, styles.deleteButton]}
                                onPress={() => handleDeletePdf(item.id, item.name)}
                            >
                                <Icon name="delete" size={18} color="#fff" />
                                <Text style={styles.pdfButtonText}>Delete PDF</Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <View style={styles.noPdfContainer}>
                            <Icon name="file-remove" size={18} color="#a0aec0" />
                            <Text style={styles.noPdfText}>No PDF attached</Text>
                        </View>
                    )}
                </View>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>Loan Applications</Text>
                    <Text style={styles.subtitle}>Manager Dashboard</Text>
                </View>
                <View style={styles.headerButtons}>
                    <TouchableOpacity style={styles.iconButton} onPress={onRefresh}>
                        <Icon name="refresh" size={24} color="#667eea" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconButton} onPress={clearAllData}>
                        <Icon name="delete-sweep" size={24} color="#e53e3e" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconButton} onPress={handleLogout}>
                        <Icon name="logout" size={24} color="#667eea" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Stats */}
            <View style={styles.statsContainer}>
                <View style={styles.statCard}>
                    <Icon name="file-document-multiple" size={32} color="#667eea" />
                    <Text style={styles.statNumber}>{loans.length}</Text>
                    <Text style={styles.statLabel}>Total Applications</Text>
                </View>
                <View style={styles.statCard}>
                    <Icon name="file-pdf-box" size={32} color="#10b981" />
                    <Text style={styles.statNumber}>
                        {loans.filter(loan => loan.paysheetUri).length}
                    </Text>
                    <Text style={styles.statLabel}>With PDF</Text>
                </View>
            </View>

            {/* Loan List */}
            {loans.length === 0 ? (
                <View style={styles.emptyState}>
                    <Icon name="file-remove" size={80} color="#ccc" />
                    <Text style={styles.emptyText}>No loan applications found</Text>
                    <Text style={styles.emptySubtext}>
                        Applications will appear here once submitted
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={loans}
                    keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
                    renderItem={renderLoanItem}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            )}

            {/* PDF View Modal */}
            <Modal
                visible={pdfModalVisible}
                animationType="slide"
                presentationStyle="pageSheet"
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Paysheet PDF</Text>
                        <TouchableOpacity
                            onPress={() => setPdfModalVisible(false)}
                            style={styles.closeButton}
                        >
                            <Icon name="close" size={24} color="#374151" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.modalContent}>
                        {selectedPdf ? (
                            <View style={styles.pdfInfo}>
                                <Icon name="file-pdf-box" size={60} color="#e53e3e" />
                                <Text style={styles.pdfInfoText}>
                                    PDF is available for viewing
                                </Text>
                                <Text style={styles.pdfInfoSubtext}>
                                    Use the download button to save or share the PDF file
                                </Text>

                                <TouchableOpacity
                                    style={[styles.pdfButton, styles.downloadButton, { marginTop: 16 }]}
                                    onPress={() => {
                                        if (selectedPdf) {
                                            const applicantName = loans.find(loan =>
                                                loan.paysheetUri === selectedPdf
                                            )?.name || 'Applicant';
                                            handleDownloadPdf(selectedPdf, applicantName);
                                        }
                                    }}
                                >
                                    <Icon name="download" size={20} color="#fff" />
                                    <Text style={styles.pdfButtonText}>Download PDF</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View style={styles.pdfInfo}>
                                <Icon name="file-remove" size={60} color="#a0aec0" />
                                <Text style={styles.pdfInfoText}>No PDF available</Text>
                            </View>
                        )}
                    </ScrollView>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f8fafc",
        padding: 16,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
        marginTop: 10,
    },
    title: {
        fontSize: 28,
        fontWeight: "bold",
        color: "#1a202c",
    },
    subtitle: {
        fontSize: 14,
        color: "#718096",
        marginTop: 2,
    },
    headerButtons: {
        flexDirection: "row",
        gap: 12,
    },
    iconButton: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: "#fff",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    statsContainer: {
        flexDirection: "row",
        gap: 12,
        marginBottom: 20,
    },
    statCard: {
        flex: 1,
        backgroundColor: "#fff",
        padding: 16,
        borderRadius: 12,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    statNumber: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#667eea",
        marginTop: 8,
    },
    statLabel: {
        fontSize: 12,
        color: "#718096",
        marginTop: 4,
    },
    listContent: {
        paddingBottom: 20,
    },
    card: {
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 12,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#e2e8f0",
    },
    name: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#2d3748",
    },
    loanId: {
        fontSize: 12,
        color: "#a0aec0",
        marginTop: 2,
    },
    actionButtons: {
        flexDirection: "row",
        gap: 8,
    },
    actionButton: {
        padding: 8,
        borderRadius: 6,
        backgroundColor: "#f7fafc",
    },
    details: {
        gap: 10,
    },
    detailRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    detailText: {
        fontSize: 14,
        color: "#4a5568",
        flex: 1,
    },
    pdfActions: {
        flexDirection: "row",
        gap: 8,
        marginTop: 12,
        flexWrap: "wrap",
    },
    pdfButton: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 6,
        gap: 6,
    },
    viewButton: {
        backgroundColor: "#667eea",
    },
    downloadButton: {
        backgroundColor: "#10b981",
    },
    deleteButton: {
        backgroundColor: "#ef4444",
    },
    pdfButtonText: {
        color: "#fff",
        fontSize: 12,
        fontWeight: "600",
    },
    noPdfContainer: {
        flexDirection: "row",
        alignItems: "center",
        padding: 12,
        backgroundColor: "#f7fafc",
        borderRadius: 8,
        gap: 8,
    },
    noPdfText: {
        color: "#a0aec0",
        fontSize: 14,
    },
    emptyState: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 18,
        color: "#a0aec0",
        marginTop: 16,
        fontWeight: "600",
    },
    emptySubtext: {
        fontSize: 14,
        color: "#cbd5e0",
        marginTop: 8,
        textAlign: "center",
    },
    modalContainer: {
        flex: 1,
        backgroundColor: "#fff",
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#e2e8f0",
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#1a202c",
    },
    closeButton: {
        padding: 4,
    },
    modalContent: {
        flex: 1,
        padding: 16,
    },
    pdfInfo: {
        alignItems: "center",
        paddingVertical: 40,
    },
    pdfInfoText: {
        fontSize: 18,
        fontWeight: "600",
        color: "#374151",
        marginTop: 16,
        textAlign: "center",
    },
    pdfInfoSubtext: {
        fontSize: 14,
        color: "#6b7280",
        marginTop: 8,
        textAlign: "center",
    },
});