import React, { useEffect, useState, useRef, useCallback } from "react";
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
    Platform,
    StatusBar,
    Animated,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import * as Sharing from "expo-sharing";
import { useAuth } from "../context/AuthContext";
import {
    deleteApplication,
    deletePdfOnly,
    deleteAllApplications,
} from "../db/db";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {LoanApplication} from "../models/LoanApplication";

export default function LoanListScreen({ navigation }: any) {
    const [loans, setLoans] = useState<LoanApplication[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedPdf, setSelectedPdf] = useState<string | null>(null);
    const [pdfModalVisible, setPdfModalVisible] = useState(false);
    const { logout } = useAuth();

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;

    // Load loans
    const loadLoans = useCallback(async () => {
        try {
            const data = await AsyncStorage.getItem("loanApplications");
            if (data) {
                const parsedData: LoanApplication[] = JSON.parse(data);
                const loansWithIds = parsedData.map((loan, index) => ({
                    ...loan,
                    id: loan.id || index + 1,
                    submittedAt: loan.submittedAt || new Date().toISOString()
                }));
                setLoans(loansWithIds);
            } else {
                setLoans([]);
            }
        } catch (error) {
            setLoans([]);
            Alert.alert("Error", "Failed to load loan applications");
        }
    }, []);

    useEffect(() => {
        loadLoans();
        const unsubscribe = navigation.addListener('focus', loadLoans);
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 600,
                useNativeDriver: true,
            }),
        ]).start();
        return unsubscribe;
    }, [navigation, loadLoans, fadeAnim, slideAnim]);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadLoans();
        setRefreshing(false);
    };

    const handleAddNew = () => navigation.navigate("ApplicationForm");

    const handleLogout = () => {
        Alert.alert("Logout", "Are you sure you want to logout?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Logout",
                style: "destructive",
                onPress: async () => {
                    try {
                        await logout();
                        // Use any to avoid TypeScript errors temporarily
                        (navigation as any).replace("Login");
                    } catch (error) {
                        console.error("Logout error:", error);
                    }
                },
            },
        ]);
    };
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
                            await loadLoans();
                            Alert.alert("Success", "All applications deleted successfully");
                        } catch {
                            Alert.alert("Error", "Failed to delete applications");
                        }
                    },
                },
            ]
        );
    };

    // --- PDF Actions (from your snippet, unchanged) ---
    const handleViewPdf = async (paysheetUri: string | null, applicantName: string) => {
        try {
            if (!paysheetUri) {
                Alert.alert("No File", "No paysheet available for this application");
                return;
            }
            if (Platform.OS === "web") {
                handleViewPdfWeb(paysheetUri, applicantName);
            } else {
                handleViewPdfMobile(paysheetUri, applicantName);
            }
        } catch {
            Alert.alert("Error", "Unable to open PDF file");
        }
    };

    const handleViewPdfWeb = (uri: string, applicantName: string) => {
        if (uri.startsWith('blob:') || uri.startsWith('http') || uri.startsWith('data:')) {
            const newWindow = window.open(uri, '_blank');
            if (!newWindow) {
                Alert.alert("Pop-up Blocked", "Please allow pop-ups for this site to view PDF files.");
            }
        } else if (uri.startsWith('file://')) {
            Alert.alert(
                "Local File",
                "This is a local file. On web, use download to save and view the PDF.",
                [
                    { text: "OK" },
                    {
                        text: "Download",
                        onPress: () => handleDownloadPdfWeb(uri, applicantName)
                    }
                ]
            );
        }
    };

    const handleViewPdfMobile = (uri: string, applicantName: string) => {
        let fixedUri = uri;
        if (!uri.startsWith('file://') && !uri.startsWith('http') && !uri.startsWith('content://') && !uri.startsWith('data:')) {
            fixedUri = `file://${uri}`;
        }
        navigation.navigate("PdfView", {
            pdfUri: fixedUri,
            applicantName,
        });
    };

    const handleDownloadPdf = async (paysheetUri: string | null, applicantName: string) => {
        try {
            if (!paysheetUri) {
                Alert.alert("No File", "No paysheet available for download");
                return;
            }
            if (Platform.OS === "web") {
                handleDownloadPdfWeb(paysheetUri, applicantName);
            } else {
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
        } catch {
            Alert.alert("Error", "Failed to download PDF");
        }
    };

    const handleDownloadPdfWeb = (uri: string, applicantName: string) => {
        let name = `${applicantName.replace(/\s+/g, '_')}_paysheet.pdf`;
        if (uri.startsWith('blob:') || uri.startsWith('data:') || uri.startsWith('http')) {
            const link = document.createElement('a');
            link.href = uri;
            link.download = name;
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            Alert.alert("Download Started", "PDF download has been initiated.");
        } else if (uri.startsWith('file://')) {
            fetch(uri)
                .then(response => response.blob())
                .then(blob => {
                    const blobUrl = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = blobUrl;
                    link.download = name;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(blobUrl);
                    Alert.alert("Download Started", "PDF download has been initiated.");
                })
                .catch(() => {
                    Alert.alert("Download Failed", "Unable to download this file type.");
                });
        }
    };

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
                            await loadLoans();
                            Alert.alert("Success", "Paysheet removed successfully");
                        } catch {
                            Alert.alert("Error", "Failed to delete paysheet");
                        }
                    },
                },
            ]
        );
    };

    const handleEdit = (loan: LoanApplication) => navigation.navigate("ApplicationForm", { editMode: true, loanData: loan });

    const handleDeleteApplication = (id: number, name: string) => {
        const updatedLoans = loans.filter(loan => loan.id !== id);
        AsyncStorage.setItem("loanApplications", JSON.stringify(updatedLoans))
            .then(() => {
                setLoans(updatedLoans);
                Alert.alert("Success", `${name}'s application has been deleted`);
            })
            .catch(() => {
                Alert.alert("Error", "Delete failed");
            });
        Alert.alert(
            "Delete Application",
            `Delete ${name}'s application?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await AsyncStorage.setItem("loanApplications", JSON.stringify(updatedLoans));
                            setLoans(updatedLoans);
                            Alert.alert("Success", "Application deleted");
                        } catch {
                            Alert.alert("Error", "Delete failed");
                        }
                    },
                },
            ]
        );
    };

    const renderLoanItem = ({ item, index }: { item: LoanApplication; index: number }) => (
        <LoanCard
            item={item}
            index={index}
            onEdit={handleEdit}
            onDelete={handleDeleteApplication}
            onViewPdf={handleViewPdf}
            onDownloadPdf={handleDownloadPdf}
        />
    );

    // --- UI ---
    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#047857" />
            <Animated.View style={{
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
            }}>
                {/* Header */}
                <View style={styles.headerContainer}>
                    <View style={styles.headerTop}>
                        <View>
                            <Text style={styles.headerTitle}>Loan Applications</Text>
                            <Text style={styles.headerSubtitle}>Manage your loan portfolio</Text>
                        </View>
                        <View style={styles.headerActions}>
                            <TouchableOpacity
                                style={styles.headerIconButton}
                                onPress={onRefresh}
                                activeOpacity={0.7}
                            >
                                <Icon name="refresh" size={22} color="#fff" />
                            </TouchableOpacity>
                            {/* Exit Button (Logout) */}
                            <TouchableOpacity
                                onPress={() => navigation.goBack()}
                                style={styles.backButton}
                                activeOpacity={0.7}
                            >
                                <Icon name="arrow-left" size={24} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </View>
                    {/* Stats */}
                    <View style={styles.statsContainer}>
                        <StatCard
                            icon="file-document-multiple-outline"
                            value={loans.length}
                            label="Total Applications"
                            color="#047857"
                            bgColor="#d1fae5"
                        />
                        <StatCard
                            icon="file-check-outline"
                            value={loans.filter(l => l.paysheetUri).length}
                            label="With Documents"
                            color="#059669"
                            bgColor="#d1fae5"
                        />
                        <StatCard
                            icon="trending-up"
                            value={loans.filter(l => l.salary >= 50000).length}
                            label="High Value"
                            color="#10b981"
                            bgColor="#d1fae5"
                        />
                    </View>
                </View>
            </Animated.View>
            {/* Add Button */}
            <TouchableOpacity
                style={styles.floatingAddButton}
                onPress={handleAddNew}
                activeOpacity={0.85}
            >
                <Icon name="plus" size={26} color="#fff" />
                <Text style={styles.floatingAddText}>New Application</Text>
            </TouchableOpacity>
            {/* List */}
            {loans.length === 0 ? (
                <Animated.View style={[
                    styles.emptyState,
                    {
                        opacity: fadeAnim,
                        transform: [{ translateY: slideAnim }],
                    }
                ]}>
                    <View style={styles.emptyIconContainer}>
                        <Icon name="file-document-multiple-outline" size={80} color="#cbd5e1" />
                    </View>
                    <Text style={styles.emptyTitle}>No Applications Found</Text>
                </Animated.View>
            ) : (
                <FlatList
                    data={loans}
                    keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
                    renderItem={renderLoanItem}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor="#047857"
                            colors={["#047857"]}
                        />
                    }
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
                        <Text style={styles.modalTitle}>Document Preview</Text>
                        <TouchableOpacity
                            onPress={() => setPdfModalVisible(false)}
                            style={styles.modalCloseButton}
                            activeOpacity={0.7}
                        >
                            <Icon name="close" size={24} color="#64748b" />
                        </TouchableOpacity>
                    </View>
                    <ScrollView style={styles.modalContent}>
                        {selectedPdf ? (
                            <View style={styles.pdfPreview}>
                                <View style={styles.pdfPreviewIcon}>
                                    <Icon name="file-pdf-box" size={64} color="#dc2626" />
                                </View>
                                <Text style={styles.pdfPreviewTitle}>PDF Document Ready</Text>
                                <Text style={styles.pdfPreviewFilename}>
                                    {selectedPdf.split("/").pop()}
                                </Text>
                                <TouchableOpacity
                                    style={styles.modalActionButton}
                                    onPress={() => {
                                        const applicantName = loans.find(l => l.paysheetUri === selectedPdf)?.name || "Applicant";
                                        handleDownloadPdf(selectedPdf, applicantName);
                                    }}
                                    activeOpacity={0.8}
                                >
                                    <Icon name="share-variant-outline" size={20} color="#fff" />
                                    <Text style={styles.modalActionButtonText}>Share Document</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View style={styles.pdfPreview}>
                                <View style={styles.pdfPreviewIcon}>
                                    <Icon name="file-remove-outline" size={64} color="#cbd5e1" />
                                </View>
                                <Text style={styles.pdfPreviewTitle}>No Document Available</Text>
                                <Text style={styles.pdfPreviewDescription}>
                                    The document may have been removed or is unavailable
                                </Text>
                            </View>
                        )}
                    </ScrollView>
                </View>
            </Modal>
        </View>
    );
}

// --- LoanCard ---
function LoanCard({ item, index, onEdit, onDelete, onViewPdf, onDownloadPdf }: any) {
    const itemAnim = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        Animated.timing(itemAnim, {
            toValue: 1,
            duration: 400,
            delay: index * 100,
            useNativeDriver: true,
        }).start();
    }, [index, itemAnim]);
    return (
        <Animated.View style={{
            opacity: itemAnim,
            transform: [{
                translateY: itemAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [30, 0],
                }),
            }],
        }}>
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <View style={styles.profileSection}>
                        <View style={styles.avatarCircle}>
                            <Text style={styles.avatarText}>
                                {item.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                            </Text>
                        </View>
                        <View style={styles.headerInfo}>
                            <Text style={styles.name}>{item.name}</Text>
                            <View style={styles.idBadge}>
                                <Icon name="identifier" size={12} color="#047857" />
                                <Text style={styles.loanId}>ID: {item.id}</Text>
                            </View>
                        </View>
                    </View>
                    <View style={styles.actionButtons}>
                        <TouchableOpacity
                            onPress={() => onEdit(item)}
                            style={styles.iconButton}
                            activeOpacity={0.7}
                        >
                            <Icon name="pencil-outline" size={20} color="#047857" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => onDelete(item.id!, item.name)}
                            style={[styles.iconButton, styles.deleteIconButton]}
                            activeOpacity={0.7}
                        >
                            <Icon name="delete-outline" size={20} color="#dc2626" />
                        </TouchableOpacity>
                    </View>
                </View>
                {/* Details */}
                <View style={styles.detailsGrid}>
                    <DetailItem
                        icon="email-outline"
                        iconColor="#047857"
                        label="Email"
                        value={item.email}
                    />
                    <DetailItem
                        icon="phone-outline"
                        iconColor="#059669"
                        label="Phone"
                        value={item.tel}
                    />
                    <DetailItem
                        icon="briefcase-outline"
                        iconColor="#10b981"
                        label="Occupation"
                        value={item.occupation}
                    />
                    <DetailItem
                        icon="cash"
                        iconColor="#047857"
                        label="Monthly Salary"
                        value={`LKR ${Number(item.salary).toLocaleString()}`}
                        highlight
                    />
                </View>
                <View style={styles.timestampRow}>
                    <Icon name="clock-outline" size={14} color="#94a3b8" />
                    <Text style={styles.timestamp}>
                        {item.submittedAt ? new Date(item.submittedAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                        }) : "Not available"}
                    </Text>
                </View>
                {/* PDF Section */}
                <View style={styles.pdfSection}>
                    <View style={styles.pdfHeader}>
                        <View style={styles.pdfIconWrapper}>
                            <Icon name="file-pdf-box" size={20} color="#dc2626" />
                        </View>
                        <Text style={styles.pdfTitle}>Paysheet Document</Text>
                        {item.paysheetUri && (
                            <View style={styles.attachedBadge}>
                                <Icon name="check-circle" size={12} color="#059669" />
                                <Text style={styles.attachedText}>Attached</Text>
                            </View>
                        )}
                    </View>
                    {item.paysheetUri ? (
                        <View style={styles.pdfActions}>
                            <TouchableOpacity
                                style={[styles.pdfActionButton, styles.viewPdfButton]}
                                onPress={() => onViewPdf(item.paysheetUri || null, item.name)}
                                activeOpacity={0.8}
                            >
                                <Icon name="eye-outline" size={18} color="#fff" />
                                <Text style={styles.pdfActionText}>View</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.pdfActionButton, styles.downloadPdfButton]}
                                onPress={() => onDownloadPdf(item.paysheetUri || null, item.name)}
                                activeOpacity={0.8}
                            >
                                <Icon name="download-outline" size={18} color="#fff" />
                                <Text style={styles.pdfActionText}>Download</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.noPdfContainer}>
                            <Icon name="file-remove-outline" size={18} color="#cbd5e1" />
                            <Text style={styles.noPdfText}>No document attached</Text>
                        </View>
                    )}
                </View>
            </View>
        </Animated.View>
    );
}

// --- Helpers ---
function DetailItem({ icon, iconColor, label, value, highlight }: any) {
    return (
        <View style={styles.detailItem}>
            <View style={[styles.detailIcon, { backgroundColor: `${iconColor}15` }]}>
                <Icon name={icon} size={16} color={iconColor} />
            </View>
            <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>{label}</Text>
                <Text style={[styles.detailValue, highlight && styles.detailValueHighlight]}>
                    {value}
                </Text>
            </View>
        </View>
    );
}

function StatCard({ icon, value, label, color, bgColor }: any) {
    return (
        <View style={[styles.statCard, { backgroundColor: bgColor }]}>
            <View style={[styles.statIconContainer, { backgroundColor: `${color}25` }]}>
                <Icon name={icon} size={24} color={color} />
            </View>
            <Text style={[styles.statValue, { color }]}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
        </View>
    );
}

// --- Styles ---
const styles = StyleSheet.create({
    container: {
        top:15,
        flex: 1,
        backgroundColor: "#f3f4f6",
    },
    headerContainer: {
        backgroundColor: "#047857",
        paddingTop: Platform.OS === "ios" ? 50 : 20,
        paddingBottom: 20,
        paddingHorizontal: 16,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        elevation: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    headerTop: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 20,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: "800",
        color: "#fff",
        letterSpacing: 0.5,
    },
    headerSubtitle: {
        fontSize: 14,
        color: "rgba(255,255,255,0.85)",
        marginTop: 4,
        letterSpacing: 0.3,
    },
    headerActions: {
        flexDirection: "row",
        gap: 10,
    },
    headerIconButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: "rgba(255,255,255,0.15)",
        justifyContent: "center",
        alignItems: "center",
    },
    dangerButton: {
        backgroundColor: "rgba(220, 38, 38, 0.2)",
    },
    statsContainer: {
        flexDirection: "row",
        gap: 12,
    },
    statCard: {
        flex: 1,
        padding: 16,
        borderRadius: 16,
        alignItems: "center",
    },
    statIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 8,
    },
    statValue: {
        fontSize: 24,
        fontWeight: "800",
        marginBottom: 4,
        letterSpacing: 0.5,
    },
    statLabel: {
        fontSize: 11,
        color: "#064e3b",
        fontWeight: "600",
        textAlign: "center",
    },
    floatingAddButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#047857",
        marginHorizontal: 16,
        marginTop: 20,
        marginBottom: 16,
        paddingVertical: 16,
        borderRadius: 16,
        elevation: 4,
        shadowColor: "#047857",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        gap: 10,
    },
    floatingAddText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "700",
        letterSpacing: 0.5,
    },
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 24,
    },
    card: {
        backgroundColor: "#fff",
        borderRadius: 20,
        padding: 18,
        marginBottom: 16,
        elevation: 3,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        borderWidth: 1,
        borderColor: "#f1f5f9",
    },
    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#f1f5f9",
    },
    profileSection: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
        gap: 12,
    },
    avatarCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: "#d1fae5",
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 2,
        borderColor: "#6ee7b7",
    },
    avatarText: {
        fontSize: 16,
        fontWeight: "800",
        color: "#047857",
        letterSpacing: 0.5,
    },
    headerInfo: {
        flex: 1,
    },
    name: {
        fontSize: 18,
        fontWeight: "700",
        color: "#0f172a",
        marginBottom: 4,
        letterSpacing: 0.3,
    },
    idBadge: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#d1fae5",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        alignSelf: "flex-start",
        gap: 4,
    },
    loanId: {
        fontSize: 11,
        color: "#047857",
        fontWeight: "700",
        letterSpacing: 0.3,
    },
    actionButtons: {
        flexDirection: "row",
        gap: 8,
    },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#d1fae5",
        justifyContent: "center",
        alignItems: "center",
    },
    deleteIconButton: {
        backgroundColor: "#fee2e2",
    },
    detailsGrid: {
        gap: 12,
        marginBottom: 16,
    },
    detailItem: {
        flexDirection: "row",
        alignItems: "center",
        padding: 12,
        backgroundColor: "#f9fafb",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#f1f5f9",
    },
    detailIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    detailContent: {
        flex: 1,
    },
    detailLabel: {
        fontSize: 12,
        color: "#6b7280",
        fontWeight: "600",
        marginBottom: 2,
        letterSpacing: 0.2,
    },
    detailValue: {
        fontSize: 14,
        color: "#1f2937",
        fontWeight: "600",
        letterSpacing: 0.2,
    },
    detailValueHighlight: {
        color: "#047857",
        fontWeight: "700",
        fontSize: 15,
    },
    timestampRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 10,
        paddingHorizontal: 12,
        backgroundColor: "#f9fafb",
        borderRadius: 8,
        marginBottom: 16,
        gap: 6,
    },
    timestamp: {
        fontSize: 12,
        color: "#64748b",
        fontWeight: "500",
    },
    pdfSection: {
        backgroundColor: "#fafafa",
        borderRadius: 12,
        padding: 14,
        borderWidth: 1,
        borderColor: "#f1f5f9",
    },
    pdfHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
        gap: 8,
    },
    pdfIconWrapper: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: "#fee2e2",
        justifyContent: "center",
        alignItems: "center",
    },
    pdfTitle: {
        flex: 1,
        fontSize: 14,
        fontWeight: "700",
        color: "#1f2937",
        letterSpacing: 0.2,
    },
    attachedBadge: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#d1fae5",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        gap: 4,
    },
    attachedText: {
        fontSize: 10,
        color: "#059669",
        fontWeight: "700",
        letterSpacing: 0.3,
    },
    pdfActions: {
        flexDirection: "row",
        gap: 10,
    },
    pdfActionButton: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 12,
        borderRadius: 10,
        gap: 6,
    },
    viewPdfButton: {
        backgroundColor: "#047857",
    },
    downloadPdfButton: {
        backgroundColor: "#059669",
    },
    pdfActionText: {
        fontSize: 14,
        fontWeight: "700",
        color: "#fff",
        letterSpacing: 0.3,
    },
    noPdfContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 14,
        gap: 8,
    },
    noPdfText: {
        fontSize: 13,
        color: "#94a3b8",
        fontWeight: "500",
    },
    emptyState: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 40,
        paddingBottom: 60,
    },
    emptyIconContainer: {
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: "#f1f5f9",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 24,
    },
    emptyTitle: {
        fontSize: 22,
        fontWeight: "700",
        color: "#1f2937",
        marginBottom: 8,
        textAlign: "center",
        letterSpacing: 0.3,
    },
    emptyDescription: {
        fontSize: 15,
        color: "#64748b",
        textAlign: "center",
        marginBottom: 28,
        lineHeight: 22,
    },
    emptyActionButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#047857",
        paddingHorizontal: 28,
        paddingVertical: 14,
        borderRadius: 12,
        elevation: 3,
        shadowColor: "#047857",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        gap: 8,
    },
    emptyActionText: {
        fontSize: 15,
        fontWeight: "700",
        color: "#fff",
        letterSpacing: 0.4,
    },
    modalContainer: {
        flex: 1,
        backgroundColor: "#fff",
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#f1f5f9",
        backgroundColor: "#fafafa",
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: "#1f2937",
        letterSpacing: 0.3,
    },
    modalCloseButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#f1f5f9",
        justifyContent: "center",
        alignItems: "center",
    },
    modalContent: {
        flex: 1,
    },
    pdfPreview: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 40,
        paddingVertical: 60,
    },
    pdfPreviewIcon: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: "#fee2e2",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 24,
    },
    pdfPreviewTitle: {
        fontSize: 22,
        fontWeight: "700",
        color: "#1f2937",
        marginBottom: 8,
        textAlign: "center",
        letterSpacing: 0.3,
    },
    pdfPreviewFilename: {
        fontSize: 14,
        color: "#6b7280",
        marginBottom: 32,
        textAlign: "center",
    },
    pdfPreviewDescription: {
        fontSize: 15,
        color: "#94a3b8",
        textAlign: "center",
        lineHeight: 22,
    },
    modalActionButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#047857",
        paddingHorizontal: 28,
        paddingVertical: 14,
        borderRadius: 12,
        elevation: 3,
        shadowColor: "#047857",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        gap: 8,
    },
    modalActionButtonText: {
        fontSize: 15,
        fontWeight: "700",
        color: "#fff",
        letterSpacing: 0.4,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "rgba(255,255,255,0.15)",
        justifyContent: "center",
        alignItems: "center",
    }
});