// UserLoanSearchScreen.tsx - නව තිරය
import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Modal,
    ScrollView,
    Alert,
    StatusBar
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LoanApplication } from '../models/LoanApplication';

export default function UserLoanSearchScreen({ navigation }: any) {
    const [searchEmail, setSearchEmail] = useState('');
    const [foundApplication, setFoundApplication] = useState<LoanApplication | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [loading, setLoading] = useState(false);

    const searchByEmail = async () => {
        if (!searchEmail.trim()) {
            Alert.alert('Error', 'Please enter your email address');
            return;
        }

        setLoading(true);
        try {
            const data = await AsyncStorage.getItem('loanApplications');
            if (data) {
                const applications: LoanApplication[] = JSON.parse(data);
                const userApp = applications.find(app =>
                    app.email.toLowerCase() === searchEmail.toLowerCase()
                );

                if (userApp) {
                    setFoundApplication(userApp);
                    setModalVisible(true);
                } else {
                    Alert.alert('Not Found', 'No application found with this email address');
                }
            } else {
                Alert.alert('No Data', 'No applications found in the system');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to search application');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch(status) {
            case 'approved': return '#059669';
            case 'rejected': return '#dc2626';
            default: return '#f59e0b';
        }
    };

    const getStatusText = (status: string) => {
        switch(status) {
            case 'approved': return 'Approved';
            case 'rejected': return 'Rejected';
            default: return 'Pending Review';
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#f3f4f6" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}
                >
                    <Icon name="arrow-left" size={24} color="#374151" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Find My Application</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Search Section */}
            <View style={styles.searchSection}>
                <View style={styles.searchContainer}>
                    <Icon name="email-outline" size={20} color="#047857" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Enter your email address..."
                        placeholderTextColor="#9ca3af"
                        value={searchEmail}
                        onChangeText={setSearchEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                </View>

                <TouchableOpacity
                    style={[styles.searchButton, loading && styles.searchButtonDisabled]}
                    onPress={searchByEmail}
                    disabled={loading}
                >
                    <Icon name="magnify" size={20} color="#fff" />
                    <Text style={styles.searchButtonText}>
                        {loading ? 'Searching...' : 'Search Application'}
                    </Text>
                </TouchableOpacity>

                <Text style={styles.helpText}>
                    Enter the email address you used for the loan application to check your status
                </Text>
            </View>

            {/* Application Details Modal */}
            <Modal
                visible={modalVisible}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Application Details</Text>
                        <TouchableOpacity
                            onPress={() => setModalVisible(false)}
                            style={styles.modalCloseButton}
                        >
                            <Icon name="close" size={24} color="#64748b" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.modalContent}>
                        {foundApplication && (
                            <View style={styles.applicationDetails}>
                                {/* Status Badge */}
                                <View style={styles.statusSection}>
                                    <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(foundApplication.status)}15` }]}>
                                        <Icon
                                            name={
                                                foundApplication.status === 'approved' ? 'check-circle' :
                                                    foundApplication.status === 'rejected' ? 'close-circle' :
                                                        'clock-outline'
                                            }
                                            size={20}
                                            color={getStatusColor(foundApplication.status)}
                                        />
                                        <Text style={[styles.statusText, { color: getStatusColor(foundApplication.status) }]}>
                                            {getStatusText(foundApplication.status)}
                                        </Text>
                                    </View>
                                </View>

                                {/* Personal Information */}
                                <View style={styles.detailSection}>
                                    <Text style={styles.sectionTitle}>Personal Information</Text>
                                    <DetailRow icon="account" label="Full Name" value={foundApplication.name} />
                                    <DetailRow icon="email" label="Email" value={foundApplication.email} />
                                    <DetailRow icon="phone" label="Phone" value={foundApplication.tel} />
                                    <DetailRow icon="briefcase" label="Occupation" value={foundApplication.occupation} />
                                    <DetailRow
                                        icon="currency-usd"
                                        label="Monthly Salary"
                                        value={`LKR ${Number(foundApplication.salary).toLocaleString()}`}
                                    />
                                </View>

                                {/* Application Info */}
                                <View style={styles.detailSection}>
                                    <Text style={styles.sectionTitle}>Application Information</Text>
                                    <DetailRow
                                        icon="identifier"
                                        label="Application ID"
                                        value={foundApplication.id?.toString() || 'N/A'}
                                    />
                                    <DetailRow
                                        icon="calendar"
                                        label="Submitted Date"
                                        value={foundApplication.submittedAt ?
                                            new Date(foundApplication.submittedAt).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            }) : 'N/A'
                                        }
                                    />
                                </View>

                                {/* Document Status */}
                                <View style={styles.detailSection}>
                                    <Text style={styles.sectionTitle}>Document Status</Text>
                                    <View style={styles.documentRow}>
                                        <Icon
                                            name={foundApplication.paysheetUri ? "file-check" : "file-remove"}
                                            size={20}
                                            color={foundApplication.paysheetUri ? "#059669" : "#94a3b8"}
                                        />
                                        <Text style={styles.documentText}>
                                            {foundApplication.paysheetUri ?
                                                "Paysheet document submitted" :
                                                "No document attached"
                                            }
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        )}
                    </ScrollView>
                </View>
            </Modal>
        </View>
    );
}

// Detail Row Component
function DetailRow({ icon, label, value }: { icon: string; label: string; value: string }) {
    return (
        <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
                <Icon name={icon} size={18} color="#047857" />
            </View>
            <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>{label}</Text>
                <Text style={styles.detailValue}>{value}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f3f4f6',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f3f4f6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#374151',
    },
    searchSection: {
        padding: 20,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    searchIcon: {
        marginRight: 12,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#374151',
    },
    searchButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#047857',
        paddingVertical: 14,
        borderRadius: 12,
        marginBottom: 12,
        gap: 8,
    },
    searchButtonDisabled: {
        opacity: 0.6,
    },
    searchButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    helpText: {
        textAlign: 'center',
        color: '#6b7280',
        fontSize: 14,
        lineHeight: 20,
    },
    modalContainer: {
        flex: 1,
        backgroundColor: '#fff',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1f2937',
    },
    modalCloseButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f1f5f9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        flex: 1,
        padding: 20,
    },
    applicationDetails: {
        gap: 24,
    },
    statusSection: {
        alignItems: 'center',
        marginBottom: 16,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        gap: 8,
    },
    statusText: {
        fontSize: 16,
        fontWeight: '700',
    },
    detailSection: {
        backgroundColor: '#f9fafb',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#374151',
        marginBottom: 12,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    detailIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#d1fae5',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    detailContent: {
        flex: 1,
    },
    detailLabel: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 2,
        fontWeight: '500',
    },
    detailValue: {
        fontSize: 16,
        color: '#1f2937',
        fontWeight: '600',
    },
    documentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    documentText: {
        fontSize: 14,
        color: '#374151',
        fontWeight: '500',
    },
});