// import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
// import { Stack } from 'expo-router';
// import { StatusBar } from 'expo-status-bar';
// import 'react-native-reanimated';
//
// import { useColorScheme } from '@/hooks/use-color-scheme';
//
// export const unstable_settings = {
//   anchor: '(tabs)',
// };
//
// export default function RootLayout() {
//   const colorScheme = useColorScheme();
//
//   return (
//     <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
//       <Stack>
//         <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
//         <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
//       </Stack>
//       <StatusBar style="auto" />
//     </ThemeProvider>
//   );
// }
// app/_layout.tsx
import {AuthProvider} from "@/contexts/AuthContext";
import {Stack} from "expo-router";
import {StatusBar} from "expo-status-bar";
import {View} from "react-native";
import {DarkTheme, DefaultTheme, ThemeProvider} from "@react-navigation/native";

export default function RootLayout() {
    return (
        // <View style={{flex: 1, backgroundColor: "#fff"}}>
        //     {/* ทำให้ status bar เป็น dark-content เพื่อให้เข้ากับพื้นหลังขาว */}
        //
        //
        //     {/* ใช้ DefaultTheme (พื้นหลังขาว) */}
        //     <ThemeProvider value={DefaultTheme}>
        //         <Stack screenOptions={{headerStyle: {backgroundColor: "#fff"}, headerTintColor: "#000"}}/>
        //     </ThemeProvider>
        // </View>
        <AuthProvider>
            <View style={{flex: 1, backgroundColor: "#fff"}}>
                <Stack screenOptions={{headerShown: false}}/>
            </View>
        </AuthProvider>
    );
}
