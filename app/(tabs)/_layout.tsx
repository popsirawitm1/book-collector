// app/(tabs)/_layout.tsx
import {Tabs} from "expo-router";
import {Ionicons} from "@expo/vector-icons";

export default function TabsLayout() {
    return (
        <Tabs
            screenOptions={{
                headerTitleAlign: "center",
                tabBarActiveTintColor: "#000",
                tabBarInactiveTintColor: "#999",
                tabBarLabelStyle: {fontSize: 12},
                tabBarStyle: {backgroundColor: "#fff"},
                screenOptions: { headerShown: false },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: "Home",
                    tabBarIcon: ({color, size}) => (
                        <Ionicons name="home-outline" size={size} color={color}/>
                    ),
                }}
            />
            <Tabs.Screen
                name="library"
                options={{
                    title: "Library",
                    tabBarIcon: ({color, size}) => (
                        <Ionicons name="library-outline" size={size} color={color}/>
                    ),
                }}
            />
            <Tabs.Screen
                name="add"
                options={{
                    title: "Add",
                    tabBarIcon: ({color, size}) => (
                        <Ionicons name="add-circle-outline" size={size} color={color}/>
                    ),
                }}
            />
            <Tabs.Screen
                name="scan"
                options={{
                    title: "Scan",
                    tabBarIcon: ({color, size}) => (
                        <Ionicons name="scan-outline" size={size} color={color}/>
                    ),
                }}
            />
            <Tabs.Screen
                name="recs"
                options={{
                    title: "Recommendations",
                    tabBarIcon: ({color, size}) => (
                        <Ionicons name="sparkles-outline" size={size} color={color}/>
                    ),
                }}
            />
            <Tabs.Screen
                name="more"
                options={{
                    title: "More",
                    tabBarIcon: ({color, size}) => (
                        <Ionicons name="ellipsis-horizontal-circle-outline" size={size} color={color}/>
                    ),
                }}
            />
        </Tabs>
    );
}
