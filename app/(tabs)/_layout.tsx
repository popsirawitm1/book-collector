// app/(tabs)/_layout.tsx
import {Tabs} from "expo-router";
import {Ionicons} from "@expo/vector-icons";
import {View, Text} from 'react-native';


export default function TabsLayout() {
    return (
        <Tabs
            screenOptions={{
                headerTitleAlign: "center",
                tabBarActiveTintColor: "#000",
                tabBarInactiveTintColor: "#999",
                tabBarLabelStyle: {fontSize: 12},
                tabBarStyle: {backgroundColor: "#fff"},
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: "Home",
                    tabBarIcon: ({color, size}) => (
                        <Ionicons name="home-outline" size={size} color={color}/>
                    ),
                    headerShown: false
                }}
            />
            <Tabs.Screen
                name="library"
                options={{
                    title: "Library",
                    tabBarIcon: ({color, size}) => (
                        <Ionicons name="library-outline" size={size} color={color}/>
                    ),
                    headerShown: false,
                    headerTitle: () => (
                        <View style={{flexDirection: "row", alignItems: "center"}}>
                            <Ionicons name="library" size={32} color="#6366f1"/>
                            <Text style={{marginLeft: 12, fontSize: 20}}>Library</Text>
                        </View>
                    )
                }}
            />
            <Tabs.Screen
                name="add"
                options={{
                    title: "Add Book",
                    tabBarIcon: ({color, size}) => (
                        <Ionicons name="add-circle-outline" size={size} color={color}/>
                    ),
                    headerShown: false
                }}
            />
            <Tabs.Screen
                name="recs"
                options={{
                    title: "Recommendations",
                    tabBarIcon: ({color, size}) => (
                        <Ionicons name="sparkles-outline" size={size} color={color}/>
                    ),
                    headerShown: false
                }}
            />
            <Tabs.Screen
                name="wishlist"
                options={{
                    title: "Wishlist",
                    tabBarIcon: ({color, size}) => (
                        <Ionicons name="bookmark-outline" size={size} color={color}/>
                    ),
                    headerShown: false
                }}
            />
            <Tabs.Screen
                name="more"
                options={{
                    title: "More",
                    tabBarIcon: ({color, size}) => (
                        <Ionicons name="ellipsis-horizontal-circle-outline" size={size} color={color}/>
                    ),
                    headerShown: false
                }}
            />
        </Tabs>
    );
}
