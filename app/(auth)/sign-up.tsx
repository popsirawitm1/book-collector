import {useState} from "react";
import {
    View,
    TextInput,
    Text,
    StyleSheet,
    KeyboardAvoidingView,
    ScrollView,
    Platform,
    TouchableOpacity,
} from "react-native";
import {createUserWithEmailAndPassword, updateProfile} from "firebase/auth";
import {auth} from "@/configs/firebase";
import {Link, useRouter, usePathname} from "expo-router";
import {Ionicons} from "@expo/vector-icons";
import CustomAlert from '@/components/CustomAlert';

export default function SignUp() {
    const router = useRouter();
    const pathname = usePathname();
    console.log("Current pathname:", pathname); // เพิ่มบรรทัดนี้เพื่อดูค่า pathname
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [displayName, setDisplayName] = useState("");
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
        if (!email || !password || !confirmPassword) {
            showAlert('กรุณากรอกข้อมูล', 'โปรดกรอกข้อมูลให้ครบทุกช่อง', 'warning');
            return;
        }
        if (password !== confirmPassword) {
            showAlert('รหัสผ่านไม่ตรงกัน', 'กรุณาตรวจสอบรหัสผ่านอีกครั้ง', 'error');
            return;
        }
        try {
            setSubmitting(true);
            const cred = await createUserWithEmailAndPassword(
                auth,
                email.trim(),
                password
            );
            if (displayName) {
                await updateProfile(cred.user, {displayName});
            }
            showAlert('สมัครสมาชิกสำเร็จ', 'ยินดีต้อนรับสู่ Book Collector!', 'success');
            router.replace("/(tabs)/");
        } catch (e: any) {
            showAlert('สมัครสมาชิกไม่สำเร็จ', e?.message ?? "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ กรุณาลองใหม่อีกครั้ง", 'error');
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
                <View style={styles.logoSection}>
                    <View style={styles.logoCircle}>
                        <Ionicons name="book-outline" size={48} color="#fff"/>
                    </View>
                    <Text style={styles.appTitle}>Book Collector</Text>
                    <Text style={styles.appSubtitle}>
                        Manage your premium book collection
                    </Text>
                </View>
                <View style={styles.card}>
                    <Text style={styles.welcome}>Welcome</Text>

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

                    {/* Display Name */}
                    <View style={styles.inputContainer}>
                        <Ionicons name="person-outline" size={20} color="#888"/>
                        <TextInput
                            style={styles.input}
                            placeholder="Your name"
                            value={displayName}
                            onChangeText={setDisplayName}
                        />
                    </View>

                    {/* Email */}
                    <View style={styles.inputContainer}>
                        <Ionicons name="mail-outline" size={20} color="#888"/>
                        <TextInput
                            style={styles.input}
                            placeholder="your@email.com"
                            autoCapitalize="none"
                            keyboardType="email-address"
                            value={email}
                            onChangeText={setEmail}
                        />
                    </View>

                    {/* Password */}
                    <View style={styles.inputContainer}>
                        <Ionicons name="lock-closed-outline" size={20} color="#888"/>
                        <TextInput
                            style={styles.input}
                            placeholder="Password"
                            secureTextEntry={!showPassword}
                            value={password}
                            onChangeText={setPassword}
                        />
                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                            <Ionicons
                                name={showPassword ? "eye-off-outline" : "eye-outline"}
                                size={20}
                                color="#888"
                            />
                        </TouchableOpacity>
                    </View>

                    {/* Confirm Password */}
                    <View style={styles.inputContainer}>
                        <Ionicons name="lock-closed-outline" size={20} color="#888"/>
                        <TextInput
                            style={styles.input}
                            placeholder="Confirm Password"
                            secureTextEntry
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                        />
                    </View>

                    {/* Create Account Button */}
                    <TouchableOpacity
                        style={[styles.button, submitting && {opacity: 0.7}]}
                        onPress={onSubmit}
                        disabled={submitting}
                    >
                        <Text style={styles.buttonText}>
                            {submitting ? "Signing up..." : "Create Account"}
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
    appTitle: {
        fontSize: 22,
        fontWeight: "700",
        color: "#111827",
        textAlign: "center",
    },
    appSubtitle: {
        fontSize: 14,
        color: "#6b7280",
        marginTop: 8,
        textAlign: "center",
        maxWidth: 250,
    },
    card: {
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 24,
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
        width: "100%",
        maxWidth: 400,
        alignSelf: "center",
    },
    welcome: {
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
        paddingHorizontal: 12,
        marginBottom: 16,
        paddingVertical: 4,
    },
    input: {
        flex: 1,
        paddingVertical: 12,
        marginLeft: 8,
        fontSize: 16,
        color: "#111827",
    },
    button: {
        backgroundColor: "#4F46E5",
        paddingVertical: 16,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
        marginTop: 8,
    },
    buttonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
    },
    linkText: {
        marginTop: 20,
        textAlign: "center",
        color: "#6b7280",
    },
});
