import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    Alert,
    ScrollView,
    RefreshControl,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import {useAuth} from "../context/AuthContext";

export default function LoanListScreen({ navigation }: any) {
    const [loans, setLoans] = useState<any[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const { logout } = useAuth();

    const loadLoans = async () => {
        try {
            const data = await AsyncStorage.getItem("loanApplications");
            if (data) {
                const parsedData = JSON.parse(data);
                setLoans(parsedData);
                console.log("Loaded loans:", parsedData.length);
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
    }, []);

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
                }
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
                }
            },
        ]);
    };

    const renderLoanItem = ({ item }: { item: any }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.date}>
                    {new Date(item.submittedAt).toLocaleDateString()}
                </Text>
            </View>

            <View style={styles.details}>
                <View style={styles.detailRow}>
                    <Icon name="email" size={16} color="#666" />
                    <Text style={styles.detailText}>{item.email}</Text>
                </View>

                <View style={styles.detailRow}>
                    <Icon name="phone" size={16} color="#666" />
                    <Text style={styles.detailText}>{item.telephone}</Text>
                </View>

                <View style={styles.detailRow}>
                    <Icon name="briefcase" size={16} color="#666" />
                    <Text style={styles.detailText}>{item.occupation}</Text>
                </View>

                <View style={styles.detailRow}>
                    <Icon name="cash" size={16} color="#666" />
                    <Text style={styles.detailText}>LKR {Number(item.salary).toLocaleString()}</Text>
                </View>

                {item.paysheet && (
                    <View style={styles.detailRow}>
                        <Icon name="file-pdf" size={16} color="#e53e3e" />
                        <Text style={styles.pdfText}>{item.paysheet}</Text>
                    </View>
                )}
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Loan Applications</Text>
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
                    <Text style={styles.statNumber}>{loans.length}</Text>
                    <Text style={styles.statLabel}>Total Applications</Text>
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
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderLoanItem}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            )}
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
    headerButtons: {
        flexDirection: "row",
        gap: 12,
    },
    iconButton: {
        padding: 8,
    },
    statsContainer: {
        marginBottom: 20,
    },
    statCard: {
        backgroundColor: "#fff",
        padding: 20,
        borderRadius: 12,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    statNumber: {
        fontSize: 32,
        fontWeight: "bold",
        color: "#667eea",
    },
    statLabel: {
        fontSize: 14,
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
        alignItems: "center",
        marginBottom: 12,
    },
    name: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#2d3748",
    },
    date: {
        fontSize: 12,
        color: "#718096",
    },
    details: {
        gap: 8,
    },
    detailRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    detailText: {
        fontSize: 14,
        color: "#4a5568",
    },
    pdfText: {
        fontSize: 14,
        color: "#e53e3e",
        fontStyle: "italic",
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
});