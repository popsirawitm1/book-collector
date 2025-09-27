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
                    headerTitle: () => (
                        <View style={{flexDirection: "row", alignItems: "center"}}>
                            <Ionicons name="book" size={32} color="#6366f1"/>
                            <Text style={{marginLeft: 12, fontSize: 20}}>Book Collector</Text>
                        </View>
                    )
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
                    title: "Add Book",
                    tabBarIcon: ({color, size}) => (
                        <Ionicons name="add-circle-outline" size={size} color={color}/>
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
                    headerTitle: () => (
                        <View style={{flexDirection: "row", alignItems: "center"}}>
                            <Ionicons name="sparkles" size={32} color="#6366f1"/>
                            <Text style={{marginLeft: 12, fontSize: 20}}>AI Recommendations</Text>
                        </View>
                    )
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
