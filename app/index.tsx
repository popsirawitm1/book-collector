// app/index.tsx
import {Redirect} from "expo-router";
import {ActivityIndicator, View} from "react-native";
import {useAuth} from "@/contexts/AuthContext";

export default function Index() {
    const {user, loading} = useAuth();

    if (loading) {
        return (
            <View style={{flex: 1, alignItems: "center", justifyContent: "center"}}>
                <ActivityIndicator/>
            </View>
        );
    }

    return user ? <Redirect href="/(tabs)/"/> : <Redirect href="/(auth)/sign-in"/>;
}
