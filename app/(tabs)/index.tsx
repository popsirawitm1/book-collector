// app/(tabs)/index.tsx
import {View, Text, Button, StyleSheet} from "react-native";
import {useAuth} from "@/contexts/AuthContext";
import {useRouter} from "expo-router";

export default function Home() {
    const {user, signOut} = useAuth();
    const router = useRouter();

    const handleSignOut = async () => {
        await signOut();
        router.replace("/(auth)/sign-in");
    };


    return (
        <View style={styles.container}>
            <Text style={styles.title}>Hello, {user?.displayName ?? user?.email}</Text>
            <Button title="Sign out" onPress={handleSignOut}/>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {flex: 1, padding: 20, justifyContent: "center"},
    title: {fontSize: 20, marginBottom: 16, textAlign: "center"},
});
