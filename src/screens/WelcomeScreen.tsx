import React from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

type Props = {
    navigation: NativeStackNavigationProp<any>;
};

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen({ navigation }: Props) {
    return (
        <LinearGradient
            colors={["#047857", "#10B981"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradient}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header Section */}
                <View style={styles.header}>
                    <View style={styles.logoContainer}>
                        <LinearGradient
                            colors={["#047857", "#10B981"]}
                            style={styles.logoCircle}
                        >
                            <Icon name="bank" size={60} color="#fff" />
                        </LinearGradient>
                        <Text style={styles.title}>LoanPro</Text>
                        <Text style={styles.subtitle}>Smart Loan Management</Text>
                    </View>
                </View>

                {/* Main Content */}
                <View style={styles.content}>
                    <View style={styles.card}>
                        <Text style={styles.welcomeText}>Welcome</Text>
                        <Text style={styles.description}>
                            Choose your role to continue
                        </Text>

                        {/* User Type Selection */}
                        <View style={styles.selectionContainer}>
                            {/* User Option */}
                            <TouchableOpacity
                                style={styles.optionCard}
                                onPress={() => navigation.navigate("ApplicationForm")}
                            >
                                <LinearGradient
                                    colors={["#10B981", "#047857"]}
                                    style={styles.optionGradient}
                                >
                                    <Icon name="account-edit" size={40} color="#fff" />
                                    <Text style={styles.optionTitle}>User</Text>
                                    <Text style={styles.optionSubtitle}>
                                        Apply for loan
                                    </Text>
                                    <View style={styles.optionButton}>
                                        <Text style={styles.optionButtonText}>Apply Now</Text>
                                        <Icon name="arrow-right" size={16} color="#10B981" />
                                    </View>
                                </LinearGradient>
                            </TouchableOpacity>

                            {/* Manager Option */}
                            <TouchableOpacity
                                style={styles.optionCard}
                                onPress={() => navigation.navigate("Login")}
                            >
                                <LinearGradient
                                    colors={["#047857", "#10B981"]}
                                    style={styles.optionGradient}
                                >
                                    <Icon name="shield-account" size={40} color="#fff" />
                                    <Text style={styles.optionTitle}>Manager</Text>
                                    <Text style={styles.optionSubtitle}>
                                        Manage applications
                                    </Text>
                                    <View style={styles.optionButton}>
                                        <Text style={styles.optionButtonText}>Login</Text>
                                        <Icon name="login" size={16} color="#047857" />
                                    </View>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    gradient: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        minHeight: height,
    },
    header: {
        alignItems: "center",
        paddingTop: height * 0.05,
        paddingBottom: 20,
    },
    logoContainer: {
        alignItems: "center",
    },
    logoCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 15,
        elevation: 6,
        shadowColor: "#047857",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
    },
    title: {
        fontSize: 28,
        fontWeight: "bold",
        color: "#fff",
        marginBottom: 5,
        letterSpacing: 0.5,
    },
    subtitle: {
        fontSize: 14,
        color: "#D1FAE5",
        fontWeight: "500",
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
        paddingBottom: 30,
        justifyContent: 'center',
    },
    card: {
        backgroundColor: "#fff",
        borderRadius: 20,
        padding: 20,
        elevation: 6,
        shadowColor: "#047857",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
    },
    welcomeText: {
        fontSize: 22,
        fontWeight: "bold",
        color: "#047857",
        textAlign: "center",
        marginBottom: 8,
    },
    description: {
        fontSize: 14,
        color: "#6B7280",
        textAlign: "center",
        marginBottom: 25,
        lineHeight: 20,
    },
    selectionContainer: {
        marginBottom: 10,
    },
    optionCard: {
        borderRadius: 16,
        overflow: "hidden",
        marginBottom: 15,
        elevation: 3,
        shadowColor: "#047857",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
    },
    optionGradient: {
        padding: 20,
        alignItems: "center",
    },
    optionTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#fff",
        marginTop: 12,
        marginBottom: 5,
    },
    optionSubtitle: {
        fontSize: 12,
        color: "#D1FAE5",
        textAlign: "center",
        marginBottom: 15,
        lineHeight: 16,
    },
    optionButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        elevation: 2,
    },
    optionButtonText: {
        fontSize: 14,
        fontWeight: "bold",
        marginRight: 6,
    },
});