// app/_layout.tsx
import {AuthProvider} from '@/contexts/AuthContext';
import {Stack} from 'expo-router';
import {StatusBar} from 'expo-status-bar';
import {View} from 'react-native';
import {DarkTheme, DefaultTheme, ThemeProvider} from '@react-navigation/native';

export default function RootLayout() {
    return (
        <AuthProvider>
            <View style={{flex: 1, backgroundColor: '#fff'}}>
                <Stack screenOptions={{headerShown: false}}/>
            </View>
        </AuthProvider>
    );
}
