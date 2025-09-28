import {useState} from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import {Auth, signInWithEmailAndPassword} from "firebase/auth";
import {auth} from "@/configs/firebase";
import {Link, usePathname, useRouter} from "expo-router";
import {Ionicons} from "@expo/vector-icons";
import CustomAlert from '@/components/CustomAlert';

export default function SignIn() {
    const router = useRouter();
    const pathname = usePathname();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [alert, setAlert] = useState({
        visible: false,
        title: '',
        message: '',
        type: 'error' as 'error' | 'success' | 'warning'
    });

    const showAlert = (title: string, message?: string, type: 'error' | 'success' | 'warning' = 'error') => {
        setAlert({
            visible: true,
            title,
            message,
            type
        });
    };

    const hideAlert = () => {
        setAlert(prev => ({...prev, visible: false}));
    };

    const onSubmit = async () => {
        if (!email || !password) {
            showAlert('กรุณากรอกข้อมูล', 'โปรดกรอกอีเมลและรหัสผ่านให้ครบถ้วน', 'warning');
            return;
        }
        try {
            setSubmitting(true);
            await signInWithEmailAndPassword(auth as Auth, email.trim(), password);
            router.replace("/(tabs)/" as any);
        } catch (e: any) {
            showAlert('เข้าสู่ระบบไม่สำเร็จ', e?.message ?? "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ กรุณาลองใหม่อีกครั้ง", 'error');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={{flex: 1, backgroundColor: "#f9fafb"}}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
            <ScrollView
                contentContainerStyle={styles.scroll}
                keyboardShouldPersistTaps="handled"
            >
                {/* Logo */}
                <View style={styles.logoSection}>
                    <View style={styles.logoCircle}>
                        <Ionicons name="book-outline" size={32} color="#fff"/>
                    </View>
                    <Text style={styles.appName}>Book Collector</Text>
                    <Text style={styles.subtitle}>
                        Manage your premium book collection
                    </Text>
                </View>

                {/* Card */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Welcome</Text>

                    {/* Tabs */}
                    <View style={styles.tabsList}>
                        <Link href="/sign-in" asChild>
                            <TouchableOpacity
                                style={[styles.tabsTrigger, pathname.includes('sign-in') && styles.tabsTriggerActive]}
                            >
                                <Text
                                    style={[styles.tabsText, pathname.includes('sign-in') && styles.tabsTextActive]}>
                                    Sign In
                                </Text>
                            </TouchableOpacity>
                        </Link>
                        <Link href="/sign-up" asChild>
                            <TouchableOpacity
                                style={[styles.tabsTrigger, pathname.includes('sign-up') && styles.tabsTriggerActive]}
                            >
                                <Text
                                    style={[styles.tabsText, pathname.includes('sign-up') && styles.tabsTextActive]}>
                                    Sign Up
                                </Text>
                            </TouchableOpacity>
                        </Link>
                    </View>

                    {/* Email input */}
                    <View style={styles.inputContainer}>
                        <Ionicons
                            name="mail-outline"
                            size={20}
                            color="#6b7280"
                            style={styles.inputIcon}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="your@email.com"
                            placeholderTextColor="#374151"
                            autoCapitalize="none"
                            keyboardType="email-address"
                            value={email}
                            onChangeText={setEmail}
                            editable={!submitting}
                        />
                    </View>

                    {/* Password input */}
                    <View style={styles.inputContainer}>
                        <Ionicons
                            name="lock-closed-outline"
                            size={20}
                            color="#6b7280"
                            style={styles.inputIcon}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Password"
                            placeholderTextColor="#374151"
                            secureTextEntry={!showPassword}
                            value={password}
                            onChangeText={setPassword}
                            editable={!submitting}
                        />
                        <TouchableOpacity
                            onPress={() => setShowPassword(!showPassword)}
                            style={styles.eyeIcon}
                            disabled={submitting}
                        >
                            <Ionicons
                                name={showPassword ? "eye-off-outline" : "eye-outline"}
                                size={20}
                                color="#6b7280"
                            />
                        </TouchableOpacity>
                    </View>

                    {/* Submit button */}
                    <TouchableOpacity
                        style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                        onPress={onSubmit}
                        disabled={submitting}
                    >
                        <Text style={styles.submitText}>
                            {submitting ? "Signing in..." : "Sign In"}
                        </Text>
                    </TouchableOpacity>
                </View>

            </ScrollView>
            <CustomAlert
                visible={alert.visible}
                title={alert.title}
                message={alert.message}
                type={alert.type}
                onClose={hideAlert}
            />
        </KeyboardAvoidingView>
    );
}


const styles = StyleSheet.create({
    scroll: {
        flexGrow: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
        minHeight: "100%",
    },
    logoSection: {
        alignItems: "center",
        marginBottom: 32,
        width: "100%",
    },
    logoCircle: {
        backgroundColor: "#4F46E5",
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 12,
    },
    appName: {
        fontSize: 20,
        fontWeight: "700",
        color: "#111827",
        textAlign: "center",
    },
    subtitle: {
        fontSize: 14,
        color: "#6b7280",
        marginTop: 4,
        textAlign: "center",
        maxWidth: 250,
    },
    card: {
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 24,
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowOffset: {width: 0, height: 2},
        shadowRadius: 4,
        elevation: 2,
        width: "100%",
        maxWidth: 400,
        alignSelf: "center",
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: "600",
        textAlign: "center",
        marginBottom: 20,
        color: "#111827",
    },
    tabsList: {
        flexDirection: "row",
        marginBottom: 28,
        backgroundColor: "transparent",
        justifyContent: "center",
        alignItems: "center",
        gap: 12,
        position: 'relative',
        borderColor: "#DCDCDC",
        borderWidth: 1,
        borderRadius: 30,
        alignSelf: 'center',
        width: 'auto',
        paddingHorizontal: 4,
        paddingVertical: 4,
    },
    tabsTrigger: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 25,
        backgroundColor: "transparent",
        minHeight: 36,
        position: 'relative',
    },
    tabsTriggerActive: {
        backgroundColor: "#374151",
        borderColor: "#374151",
        shadowColor: "#374151",
        shadowOpacity: 0.3,
        shadowOffset: {width: 0, height: 6},
        shadowRadius: 12,
        elevation: 6,
        transform: [{scale: 1.05}],
    },
    tabsText: {
        color: "#000000",
        fontWeight: "500",
        fontSize: 15,
        textAlign: "center",
        letterSpacing: 0.3,
        zIndex: 1,
        position: 'relative',
        paddingHorizontal: 12,
    },
    tabsTextActive: {
        color: "#000000",
        fontWeight: "600",
        fontSize: 15,
        letterSpacing: 0.3,
        zIndex: 1,
        backgroundColor: "#DCDCDC",
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 20,
        position: 'relative',
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 8,
        marginBottom: 16,
        paddingHorizontal: 12,
        paddingVertical: 4,
    },
    inputIcon: {
        marginRight: 8,
    },
    eyeIcon: {
        padding: 8,
    },
    input: {
        flex: 1,
        paddingVertical: 12,
        fontSize: 16,
        color: "#111827",
    },
    submitButton: {
        backgroundColor: "#4F46E5",
        paddingVertical: 16,
        borderRadius: 8,
        marginTop: 8,
        alignItems: "center",
        justifyContent: "center",
    },
    submitButtonDisabled: {
        backgroundColor: "#9CA3AF",
    },
    submitText: {
        color: "#fff",
        fontWeight: "600",
        fontSize: 16,
    },
    demoCard: {
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 16,
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowOffset: {width: 0, height: 2},
        shadowRadius: 4,
        elevation: 2,
        marginTop: 10,
    },
    demoTitle: {
        fontWeight: "600",
        fontSize: 14,
        marginBottom: 6,
    },
    demoText: {
        fontSize: 12,
        color: "#6b7280",
        lineHeight: 18,
    },
});