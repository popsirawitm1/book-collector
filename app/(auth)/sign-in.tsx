// app/(auth)/sign-in.tsx
import {useState} from "react";
import {View, TextInput, Button, Text, StyleSheet, Alert} from "react-native";
import {signInWithEmailAndPassword} from "firebase/auth";
import {auth} from "@/configs/firebase";
import {Link, useRouter} from "expo-router";

export default function SignIn() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const onSubmit = async () => {
        if (!email || !password) {
            Alert.alert("กรุณากรอกข้อมูลให้ครบ");
            return;
        }
        try {
            setSubmitting(true);
            await signInWithEmailAndPassword(auth, email.trim(), password);
            router.replace("/(tabs)/"); // เข้าหน้าแท็บทันที
        } catch (e: any) {
            Alert.alert("เข้าสู่ระบบไม่สำเร็จ", e?.message ?? "Unknown error");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Sign In</Text>

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

            <Button title={submitting ? "Signing in..." : "Sign In"} onPress={onSubmit} disabled={submitting}/>

            <Text style={{marginTop: 16, textAlign: "center"}}>
                ยังไม่มีบัญชี? <Link href="/(auth)/sign-up">สร้างบัญชี</Link>
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {flex: 1, padding: 20, justifyContent: "center"},
    title: {fontSize: 24, fontWeight: "600", marginBottom: 24, textAlign: "center"},
    input: {
        borderWidth: 1, borderColor: "#ddd", borderRadius: 8, padding: 12, marginBottom: 12,
    },
});
