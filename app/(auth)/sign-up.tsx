// app/(auth)/sign-up.tsx
import {useState} from "react";
import {
    View,
    TextInput,
    Button,
    Text,
    StyleSheet,
    Alert,
    KeyboardAvoidingView,
    ScrollView,
    Platform,
} from "react-native";
import {createUserWithEmailAndPassword, updateProfile} from "firebase/auth";
import {auth} from "@/configs/firebase";
import {Link, useRouter} from "expo-router";

export default function SignUp() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [displayName, setDisplayName] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const onSubmit = async () => {
        if (!email || !password) {
            Alert.alert("กรุณากรอกข้อมูลให้ครบ");
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
            router.replace("/(tabs)/");
        } catch (e: any) {
            Alert.alert("สมัครสมาชิกไม่สำเร็จ", e?.message ?? "Unknown error");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={{flex: 1, backgroundColor: "#fff"}}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
            <ScrollView
                contentContainerStyle={styles.scroll}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.container}>
                    <Text style={styles.title}>Sign Up</Text>

                    <TextInput
                        style={styles.input}
                        placeholder="Display name (optional)"
                        value={displayName}
                        onChangeText={setDisplayName}
                    />

                    <TextInput
                        style={styles.input}
                        placeholder="Email"
                        autoCapitalize="none"
                        keyboardType="email-address"
                        value={email}
                        onChangeText={setEmail}
                    />

                    <TextInput
                        style={styles.input}
                        placeholder="Password"
                        secureTextEntry
                        value={password}
                        onChangeText={setPassword}
                    />

                    <Button
                        title={submitting ? "Signing up..." : "Create account"}
                        onPress={onSubmit}
                        disabled={submitting}
                    />

                    <Text style={{marginTop: 16, textAlign: "center"}}>
                        มีบัญชีแล้ว? <Link href="/(auth)/sign-in">เข้าสู่ระบบ</Link>
                    </Text>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    scroll: {
        flexGrow: 1,
    },
    container: {
        flex: 1,
        justifyContent: "center",
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: "600",
        marginBottom: 24,
        textAlign: "center",
    },
    input: {
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
    },
});
