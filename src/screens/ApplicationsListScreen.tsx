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
    Linking,
    Platform,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { useAuth } from "../context/AuthContext";
import {
    getApplications,
    deleteApplication,
    deletePdfOnly,
    deleteAllApplications,
    initDB,
} from "../db/db";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {LoanApplication} from "../models/LoanApplication";

export default function LoanListScreen({ navigation }: any) {
    const [loans, setLoans] = useState<LoanApplication[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedPdf, setSelectedPdf] = useState<string | null>(null);
    const [pdfModalVisible, setPdfModalVisible] = useState(false);
    const { logout } = useAuth();

    // 🔹 Load loans - FIXED VERSION
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

    // 🔹 Navigate to Add Application
    const handleAddNew = () => {
        navigation.navigate("ApplicationForm");
    };

    // 🔹 Logout
    const handleLogout = () => {
        Alert.alert("Logout", "Are you sure you want to logout?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Logout",
                style: "destructive",
                onPress: () => {
                    logout();
                    navigation.replace("Login");
                },
            },
        ]);
    };

    // 🔹 Clear all applications - FIXED
    const clearAllData = () => {
        if (loans.length === 0) {
            Alert.alert("No Data", "There are no applications to delete");
            return;
        }

        Alert.alert(
            "Delete All Applications",
            `This will permanently delete all ${loans.length} loan applications. This action cannot be undone.`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete All",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await deleteAllApplications();
                            await loadLoans(); // Reload the list after deletion
                            Alert.alert("Success", "All applications deleted successfully");
                        } catch (error) {
                            console.error("Clear all error:", error);
                            Alert.alert("Error", "Failed to delete applications");
                        }
                    },
                },
            ]
        );
    };

    // 🔹 SIMPLE PDF VIEWER - FIXED VERSION
    const handleViewPdf = async (paysheetUri: string | null, applicantName: string) => {
        try {
            if (!paysheetUri) {
                Alert.alert("No File", "No paysheet available for this application");
                return;
            }

            console.log("📄 Opening PDF for viewing:", paysheetUri);

            if (Platform.OS === "web") {
                // WEB SOLUTION - Open in new tab for viewing only
                handleViewPdfWeb(paysheetUri, applicantName);
            } else {
                // MOBILE SOLUTION - Navigate to PDF view screen
                handleViewPdfMobile(paysheetUri, applicantName);
            }
        } catch (error) {
            console.error("Error viewing PDF:", error);
            Alert.alert("Error", "Unable to open PDF file");
        }
    };

    // 🔹 WEB PDF VIEWER - FIXED (ONLY VIEW, NO DOWNLOAD)
    const handleViewPdfWeb = (uri: string, applicantName: string) => {
        console.log("🌐 Web PDF Viewer - URI:", uri);

        // Handle blob URLs - Open in new tab for viewing
        if (uri.startsWith('blob:')) {
            console.log("🔧 Opening blob URL in new tab for viewing");

            // Simply open in new tab without download attributes
            const newWindow = window.open(uri, '_blank');
            if (!newWindow) {
                Alert.alert("Pop-up Blocked", "Please allow pop-ups for this site to view PDF files.");
            } else {
                Alert.alert("PDF Opened", `${applicantName}'s PDF opened in new tab for viewing.`);
            }
            return;
        }

        // Handle file URLs - Show helpful message
        if (uri.startsWith('file://')) {
            Alert.alert(
                "Local File",
                "This is a local file. On web, please use the download option to save and view the PDF.",
                [
                    { text: "OK" },
                    {
                        text: "Download",
                        onPress: () => handleDownloadPdfWeb(uri, applicantName)
                    }
                ]
            );
            return;
        }

        // For other URLs, try direct opening in new tab
        try {
            console.log("🔗 Opening URL directly in new tab:", uri);
            const newWindow = window.open(uri, '_blank');
            if (!newWindow) {
                Alert.alert("Pop-up Blocked", "Please allow pop-ups for this site to view PDF files.");
            } else {
                Alert.alert("PDF Opened", `${applicantName}'s PDF opened in new tab for viewing.`);
            }
        } catch (error) {
            console.error("Window open failed:", error);
            Alert.alert("Error", "Could not open PDF. Try downloading instead.");
        }
    };

    // 🔹 MOBILE PDF VIEWER - FIXED
    const handleViewPdfMobile = async (uri: string, applicantName: string) => {
        try {
            console.log("📱 Mobile PDF Viewer - URI:", uri);

            let fixedUri = uri;

            // Fix URI format for various cases
            if (!uri.startsWith('file://') && !uri.startsWith('http') && !uri.startsWith('content://') && !uri.startsWith('data:')) {
                fixedUri = `file://${uri}`;
            }

            console.log("📱 Fixed URI for mobile:", fixedUri);

            // Navigate to PDF View Screen with the fixed URI
            navigation.navigate("PdfView", {
                pdfUri: fixedUri,
                applicantName: applicantName,
            });

        } catch (error) {
            console.error("Mobile PDF error:", error);
            Alert.alert("Error", "Unable to open PDF file");
        }
    };

    // 🔹 PDF DOWNLOAD - SEPARATE FUNCTION FOR DOWNLOADING
    const handleDownloadPdf = async (paysheetUri: string | null, applicantName: string) => {
        try {
            if (!paysheetUri) {
                Alert.alert("No File", "No paysheet available for download");
                return;
            }

            console.log("💾 Downloading PDF:", paysheetUri);

            if (Platform.OS === "web") {
                handleDownloadPdfWeb(paysheetUri, applicantName);
            } else {
                // Mobile - use sharing as download
                if (await Sharing.isAvailableAsync()) {
                    await Sharing.shareAsync(paysheetUri, {
                        mimeType: "application/pdf",
                        dialogTitle: `Download ${applicantName}'s Paysheet`,
                        UTI: "com.adobe.pdf"
                    });
                } else {
                    Alert.alert("Download Unavailable", "File download is not available on this device");
                }
            }
        } catch (error) {
            console.error("Download error:", error);
            Alert.alert("Error", "Failed to download PDF");
        }
    };

    // 🔹 WEB DOWNLOAD HANDLER - SEPARATE FROM VIEW
    const handleDownloadPdfWeb = (uri: string, applicantName: string) => {
        try {
            console.log("🌐 Web PDF Download - URI:", uri);

            // Handle blob URLs
            if (uri.startsWith('blob:')) {
                console.log("🔧 Downloading blob URL");
                const link = document.createElement('a');
                link.href = uri;
                link.download = `${applicantName.replace(/\s+/g, '_')}_paysheet.pdf`;
                link.target = '_blank';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                Alert.alert("Download Started", "PDF download has been initiated.");
                return;
            }

            // Handle data URLs (base64)
            if (uri.startsWith('data:')) {
                console.log("🔧 Downloading data URL");
                const link = document.createElement('a');
                link.href = uri;
                link.download = `${applicantName.replace(/\s+/g, '_')}_paysheet.pdf`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                Alert.alert("Download Started", "PDF download has been initiated.");
                return;
            }

            // Handle file URLs
            if (uri.startsWith('file://')) {
                console.log("🔧 Handling file URL download");
                // For file URLs, we need to fetch and create a blob
                fetch(uri)
                    .then(response => response.blob())
                    .then(blob => {
                        const blobUrl = URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.href = blobUrl;
                        link.download = `${applicantName.replace(/\s+/g, '_')}_paysheet.pdf`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        URL.revokeObjectURL(blobUrl);
                        Alert.alert("Download Started", "PDF download has been initiated.");
                    })
                    .catch(error => {
                        console.error("File URL download error:", error);
                        Alert.alert("Download Failed", "Unable to download this file type.");
                    });
                return;
            }

            // For other URLs (HTTP/HTTPS)
            const link = document.createElement('a');
            link.href = uri;
            link.download = `${applicantName.replace(/\s+/g, '_')}_paysheet.pdf`;
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            Alert.alert("Download Started", "PDF download has been initiated.");

        } catch (error) {
            console.error("Web download error:", error);
            Alert.alert("Download Failed", "Unable to download PDF file");
        }
    };

    // 🔹 Delete PDF only - FIXED
    const handleDeletePdf = async (loanId: number, applicantName: string) => {
        Alert.alert(
            "Delete Paysheet",
            `Remove ${applicantName}'s paysheet document?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete PDF",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await deletePdfOnly(loanId);
                            await loadLoans(); // Reload the list after deletion
                            Alert.alert("Success", "Paysheet removed successfully");
                        } catch (error) {
                            console.error("Delete PDF error:", error);
                            Alert.alert("Error", "Failed to delete paysheet");
                        }
                    },
                },
            ]
        );
    };

    // 🔹 Edit Application
    const handleEdit = (loan: LoanApplication) => {
        navigation.navigate("ApplicationForm", { editMode: true, loanData: loan });
    };

    const handleDeleteApplication = (id: number, name: string) => {
        Alert.alert(
            "Delete Application",
            `Are you sure you want to permanently delete ${name}'s application?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            console.log("🗑️ Deleting application ID:", id);
                            await deleteApplication(id);
                            await loadLoans(); // refresh list
                            Alert.alert("Success", `${name}'s application has been deleted`);
                        } catch (error) {
                            console.error("❌ Delete Error:", error);
                            Alert.alert("Error", "Failed to delete the application");
                        }
                    },
                },
            ]
        );
    };

    // 🔹 Render individual loan card
    // @ts-ignore
    const renderLoanItem = ({ item }: { item: LoanApplication }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.headerLeft}>
                    <Text style={styles.name}>{item.name}</Text>
                    <View style={styles.idBadge}>
                        <Icon name="pound" size={12} color="#667eea" />
                        <Text style={styles.loanId}>{item.id}</Text>
                    </View>
                </View>
                <View style={styles.actionButtons}>
                    <TouchableOpacity onPress={() => handleEdit(item)} style={styles.editButton}>
                        <Icon name="pencil" size={18} color="#667eea" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => handleDeleteApplication(item.id!, item.name)}
                        style={styles.deleteButton}
                    >
                        <Icon name="delete" size={18} color="#ef4444" />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.details}>
                <View style={styles.detailRow}>
                    <View style={styles.iconCircle}>
                        <Icon name="email" size={14} color="#667eea" />
                    </View>
                    <Text style={styles.detailText}>{item.email}</Text>
                </View>

                <View style={styles.detailRow}>
                    <View style={styles.iconCircle}>
                        <Icon name="phone" size={14} color="#10b981" />
                    </View>
                    <Text style={styles.detailText}>{item.tel}</Text>
                </View>

                <View style={styles.detailRow}>
                    <View style={styles.iconCircle}>
                        <Icon name="briefcase" size={14} color="#f59e0b" />
                    </View>
                    <Text style={styles.detailText}>{item.occupation}</Text>
                </View>

                <View style={styles.detailRow}>
                    <View style={styles.iconCircle}>
                        <Icon name="cash" size={14} color="#8b5cf6" />
                    </View>
                    <Text style={[styles.detailText, styles.salaryText]}>
                        LKR {Number(item.salary).toLocaleString()}
                    </Text>
                </View>

                <View style={styles.detailRow}>
                    <View style={styles.iconCircle}>
                        <Icon name="calendar-clock" size={14} color="#6b7280" />
                    </View>
                    <Text style={styles.detailText}>
                        {item.submittedAt ? new Date(item.submittedAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                        }) : "Not available"}
                    </Text>
                </View>
            </View>

            {/* PDF Section */}
            <View style={styles.pdfSection}>
                <View style={styles.pdfHeader}>
                    <Icon name="file-pdf-box" size={18} color="#e53e3e" />
                    <Text style={styles.pdfHeaderText}>Paysheet Document</Text>
                </View>

                {item.paysheetUri ? (
                    <View style={styles.pdfActions}>
                        {/* VIEW PDF BUTTON - ONLY FOR VIEWING */}
                        <TouchableOpacity
                            style={[styles.pdfButton, styles.viewButton]}
                            // @ts-ignore
                            onPress={() => handleViewPdf(item.paysheetUri, item.name)}
                        >
                            <Icon name="eye" size={16} color="#fff" />
                            <Text style={styles.pdfButtonText}>
                                {Platform.OS === "web" ? "View PDF" : "View PDF"}
                            </Text>
                        </TouchableOpacity>

                        {/* DOWNLOAD PDF BUTTON - ONLY FOR DOWNLOADING */}
                        <TouchableOpacity
                            style={[styles.pdfButton, styles.downloadButton]}
                            // @ts-ignore
                            onPress={() => handleDownloadPdf(item.paysheetUri, item.name)}
                        >
                            <Icon name="download" size={16} color="#fff" />
                            <Text style={styles.pdfButtonText}>Download</Text>
                        </TouchableOpacity>

                    </View>
                ) : (
                    <View style={styles.noPdfContainer}>
                        <Icon name="file-cancel-outline" size={20} color="#9ca3af" />
                        <Text style={styles.noPdfText}>No document attached</Text>
                    </View>
                )}
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.headerGradient}>
                <View style={styles.header}>
                    <View>
                        <Text style={styles.title}>Loan Manager</Text>
                        <Text style={styles.subtitle}>Dashboard & Applications</Text>
                    </View>
                    <View style={styles.headerButtons}>
                        <TouchableOpacity style={styles.headerButton} onPress={onRefresh}>
                            <Icon name="refresh" size={20} color="#667eea" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.headerButton} onPress={clearAllData}>
                            <Icon name="delete-sweep" size={20} color="#ef4444" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.headerButton} onPress={handleLogout}>
                            <Icon name="logout" size={20} color="#667eea" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Stats Cards */}
                <View style={styles.statsContainer}>
                    <View style={[styles.statCard, styles.statCardPrimary]}>
                        <Icon name="file-document-multiple" size={24} color="#667eea" />
                        <Text style={styles.statNumber}>{loans.length}</Text>
                        <Text style={styles.statLabel}>Total</Text>
                    </View>
                    <View style={[styles.statCard, styles.statCardSuccess]}>
                        <Icon name="file-pdf-box" size={24} color="#10b981" />
                        <Text style={styles.statNumber}>
                            {loans.filter((loan) => loan.paysheetUri).length}
                        </Text>
                        <Text style={styles.statLabel}>With PDF</Text>
                    </View>
                    <View style={[styles.statCard, styles.statCardWarning]}>
                        <Icon name="cash-multiple" size={24} color="#f59e0b" />
                        <Text style={styles.statNumber}>
                            {loans.filter((loan) => loan.salary >= 50000).length}
                        </Text>
                        <Text style={styles.statLabel}>High Income</Text>
                    </View>
                </View>
            </View>

            {/* Add New Button */}
            <TouchableOpacity style={styles.addButton} onPress={handleAddNew}>
                <Icon name="plus-circle" size={22} color="#fff" />
                <Text style={styles.addButtonText}>New Application</Text>
            </TouchableOpacity>

            {/* Loan List */}
            {loans.length === 0 ? (
                <View style={styles.emptyState}>
                    <View style={styles.emptyIcon}>
                        <Icon name="file-document-outline" size={64} color="#cbd5e0" />
                    </View>
                    <Text style={styles.emptyTitle}>No Applications Yet</Text>
                    <Text style={styles.emptyText}>
                        Start by adding a new loan application
                    </Text>
                    <TouchableOpacity style={styles.emptyButton} onPress={handleAddNew}>
                        <Icon name="plus" size={20} color="#667eea" />
                        <Text style={styles.emptyButtonText}>Add First Application</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={loans}
                    keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
                    renderItem={renderLoanItem}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            )}

            {/* PDF Modal */}
            <Modal
                visible={pdfModalVisible}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setPdfModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Paysheet Document</Text>
                        <TouchableOpacity
                            onPress={() => setPdfModalVisible(false)}
                            style={styles.closeButton}
                        >
                            <Icon name="close-circle" size={28} color="#ef4444" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.modalContent}>
                        {selectedPdf ? (
                            <View style={styles.pdfInfo}>
                                <Icon name="file-pdf-box" size={80} color="#e53e3e" />
                                <Text style={styles.pdfInfoTitle}>PDF Ready</Text>
                                <Text style={styles.pdfInfoText}>
                                    {selectedPdf.split("/").pop()}
                                </Text>

                                <TouchableOpacity
                                    style={styles.modalShareButton}
                                    onPress={() => {
                                        const applicantName = loans.find((loan) => loan.paysheetUri === selectedPdf)?.name || "Applicant";
                                        handleDownloadPdf(selectedPdf, applicantName);
                                    }}
                                >
                                    <Icon name="share-variant" size={20} color="#fff" />
                                    <Text style={styles.modalShareButtonText}>Share Document</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View style={styles.pdfInfo}>
                                <Icon name="file-remove" size={80} color="#9ca3af" />
                                <Text style={styles.pdfInfoTitle}>No PDF Available</Text>
                                <Text style={styles.pdfInfoText}>
                                    The document may have been removed
                                </Text>
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
    },
    headerGradient: {
        backgroundColor: "#fff",
        paddingTop: Platform.OS === "ios" ? 50 : 20,
        paddingBottom: 20,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    title: {
        fontSize: 26,
        fontWeight: "bold",
        color: "#1e293b", // Professional dark blue
    },
    subtitle: {
        fontSize: 13,
        color: "#64748b", // Professional gray
        marginTop: 2,
    },
    headerButtons: {
        flexDirection: "row",
        gap: 8,
    },
    headerButton: {
        padding: 10,
        borderRadius: 10,
        backgroundColor: "#f1f5f9", // Light professional gray
    },
    statsContainer: {
        flexDirection: "row",
        gap: 10,
        paddingHorizontal: 16,
    },
    statCard: {
        flex: 1,
        padding: 12,
        borderRadius: 12,
        alignItems: "center",
    },
    statCardPrimary: {
        backgroundColor: "#e0f2fe", // Professional light blue
    },
    statCardSuccess: {
        backgroundColor: "#f0fdf4", // Professional light green
    },
    statCardWarning: {
        backgroundColor: "#fffbeb", // Professional light amber
    },
    statNumber: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#1e293b",
        marginTop: 4,
    },
    statLabel: {
        fontSize: 11,
        color: "#64748b",
        marginTop: 2,
    },
    addButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#2563eb", // Professional blue
        margin: 16,
        padding: 14,
        borderRadius: 12,
        shadowColor: "#2563eb",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    addButtonText: {
        color: "#fff",
        fontSize: 15,
        fontWeight: "bold",
        marginLeft: 8,
    },
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 20,
    },
    card: {
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 12,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#f1f5f9",
    },
    headerLeft: {
        flex: 1,
    },
    name: {
        fontSize: 17,
        fontWeight: "bold",
        color: "#1e293b",
        marginBottom: 6,
    },
    idBadge: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#e0f2fe", // Professional light blue
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: "flex-start",
        gap: 4,
    },
    loanId: {
        fontSize: 12,
        color: "#0369a1", // Professional dark blue
        fontWeight: "600",
    },
    actionButtons: {
        flexDirection: "row",
        gap: 8,
    },
    editButton: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: "#e0f2fe", // Professional light blue
    },
    deleteButton: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: "#fef2f2", // Professional light red
    },
    details: {
        gap: 10,
        marginBottom: 12,
    },
    detailRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    iconCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: "#f8fafc", // Light gray
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#e2e8f0",
    },
    detailText: {
        fontSize: 14,
        color: "#475569",
        flex: 1,
    },
    salaryText: {
        fontWeight: "600",
        color: "#059669", // Professional green
    },
    pdfSection: {
        marginTop: 12,
        padding: 12,
        backgroundColor: "#f8fafc",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#e2e8f0",
    },
    pdfHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 10,
    },
    pdfHeaderText: {
        fontSize: 13,
        fontWeight: "600",
        color: "#475569",
    },
    pdfActions: {
        flexDirection: "row",
        gap: 8,
    },
    pdfButton: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 8,
        borderRadius: 8,
        gap: 4,
    },
    viewButton: {
        backgroundColor: "#2563eb", // Professional blue
    },
    downloadButton: {
        backgroundColor: "#059669", // Professional green
    },
    pdfButtonText: {
        color: "#fff",
        fontSize: 12,
        fontWeight: "600",
    },
    noPdfContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        padding: 10,
        backgroundColor: "#f8fafc",
        borderRadius: 8,
        gap: 8,
    },
    noPdfText: {
        color: "#94a3b8",
        fontSize: 13,
        fontStyle: "italic",
    },
    emptyState: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingVertical: 60,
        paddingHorizontal: 32,
    },
    emptyIcon: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: "#f1f5f9",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 20,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#334155",
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 14,
        color: "#64748b",
        textAlign: "center",
        marginBottom: 24,
    },
    emptyButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: "#2563eb", // Professional blue
        gap: 8,
    },
    emptyButtonText: {
        color: "#2563eb", // Professional blue
        fontSize: 15,
        fontWeight: "600",
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
        borderBottomColor: "#f1f5f9",
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#1e293b",
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
        paddingVertical: 60,
    },
    pdfInfoTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#1e293b",
        marginTop: 20,
    },
    pdfInfoText: {
        fontSize: 14,
        color: "#64748b",
        marginTop: 8,
        textAlign: "center",
    },
    modalShareButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#2563eb",
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 12,
        marginTop: 32,
        gap: 8,
        shadowColor: "#2563eb",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    modalShareButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
    },
});
