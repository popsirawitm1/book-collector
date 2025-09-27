import React, {useState} from 'react';
import {View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions} from 'react-native';
import {Ionicons, MaterialCommunityIcons, FontAwesome5} from '@expo/vector-icons';

// Constants for graph visualization
const screenWidth = Dimensions.get('window').width;
const cardPadding = 16;
const cardMargin = 12;
const graphWidth = screenWidth - (cardMargin * 2) - (cardPadding * 2);

// Function to calculate the height of the bar based on the max value (16)
const calculateBarHeight = (value) => {
    const maxHeight = 120; // Max height for a bar representing a count of 16
    return (value / 16) * maxHeight;
};

// Data for Books by Grade (based on the image)
const gradeData = [
    {label: 'Mint', value: 8, color: '#6C63FF'},
    {label: 'NM', value: 15, color: '#6C63FF'},
    {label: 'VF', value: 12, color: '#6C63FF'},
    {label: 'F', value: 7, color: '#6C63FF'},
    {label: 'VG', value: 5, color: '#6C63FF'},
];


const CollectionValueTrend = () => (
    <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Collection Value Trend</Text>
        <View style={styles.lineGraphContainer}>
            {/* Y-Axis Labels (Simplified) */}
            <View style={styles.yAxis}>
                <Text style={styles.yAxisLabel}>140000</Text>
                <Text style={styles.yAxisLabel}>105000</Text>
                <Text style={styles.yAxisLabel}>70000</Text>
                <Text style={styles.yAxisLabel}>35000</Text>
                <Text style={styles.yAxisLabel}>0</Text>
            </View>
            {/* Graph Area (Simplified line and points) */}
            <View style={styles.graphArea}>
                <View style={styles.lineSegment}/>
                <View style={[styles.dataPoint, {left: '0%'}]}/>
                <View style={[styles.dataPoint, {left: '20%'}]}/>
                <View style={[styles.dataPoint, {left: '40%'}]}/>
                <View style={[styles.dataPoint, {left: '60%'}]}/>
                <View style={[styles.dataPoint, {left: '80%'}]}/>
                <View style={[styles.dataPoint, {left: '100%'}]}/>
            </View>
        </View>
        {/* X-Axis Labels */}
        <View style={styles.xAxis}>
            <Text style={styles.xAxisLabel}>Jan</Text>
            <Text style={styles.xAxisLabel}>Feb</Text>
            <Text style={styles.xAxisLabel}>Mar</Text>
            <Text style={styles.xAxisLabel}>Apr</Text>
            <Text style={styles.xAxisLabel}>May</Text>
            <Text style={styles.xAxisLabel}>Jun</Text>
        </View>
    </View>
);

// Component for Recent Additions
const RecentAdditions = ({onAddFirstBook}) => (
    <View style={[styles.chartCard, styles.centeredContent]}>
        <Text style={styles.chartTitle}>Recent Additions</Text>
        <Ionicons name="book-outline" size={30} color="#6C63FF" style={{marginTop: 20}}/>
        <Text style={styles.subText}>No books in your collection yet</Text>
        <TouchableOpacity
            style={styles.bigAddButton}
            onPress={onAddFirstBook}
        >
            <Text style={styles.bigAddButtonText}>+ Add Your First Book</Text>
        </TouchableOpacity>
    </View>
);

// Component for Books by Grade (Bar Chart Simulation)
const BooksByGrade = () => (
    <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Books by Grade</Text>
        <View style={styles.barChartContainer}>
            {/* Y-Axis Labels (Simplified) */}
            <View style={styles.yAxisBarChart}>
                <Text style={styles.yAxisLabelBar}>16</Text>
                <Text style={styles.yAxisLabelBar}>12</Text>
                <Text style={styles.yAxisLabelBar}>8</Text>
                <Text style={styles.yAxisLabelBar}>4</Text>
                <Text style={styles.yAxisLabelBar}>0</Text>
            </View>

            {/* Bar Chart Bars */}
            <View style={styles.barChartBars}>
                {gradeData.map((item, index) => (
                    <View key={index} style={styles.barColumn}>
                        <View style={[styles.bar, {
                            height: calculateBarHeight(item.value),
                            backgroundColor: item.color
                        }]}/>
                        <Text style={styles.barLabel}>{item.label}</Text>
                    </View>
                ))}
            </View>
        </View>
    </View>
);

// Component for Binding Distribution (Donut Chart Simulation)
const BindingDistribution = () => (
    <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Binding Distribution</Text>
        <View style={styles.donutChartContainer}>
            <View style={styles.donut}/>
            {/* The colors are approximations based on the image */}
            <View style={[styles.donutSegment, {backgroundColor: '#F0B90B', transform: [{rotate: '270deg'}]}]}/>
            <View style={[styles.donutSegment, {backgroundColor: '#1A9652', transform: [{rotate: '150deg'}]}]}/>
        </View>
    </View>
);


export default function App() {
    const [currentScreen, setCurrentScreen] = useState('Home');
    const [isDarkMode, setIsDarkMode] = useState(false);

    const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

    const containerStyle = isDarkMode ? styles.darkContainer : styles.container;
    const headerTitleStyle = isDarkMode ? styles.darkTitle : styles.title;
    const cardStyle = isDarkMode ? styles.darkCard : styles.card;
    const chartCardStyle = isDarkMode ? styles.darkChartCard : styles.chartCard;

    if (currentScreen === 'AddBook') {
        return (
            <View style={[styles.centered, containerStyle]}>
                <Text style={[styles.addBookText, {color: isDarkMode ? '#fff' : '#000'}]}>
                    Add Book Screen
                </Text>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => setCurrentScreen('Home')}
                >
                    <Text style={styles.backButtonText}>← Back to Home</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // Home screen
    return (
        <ScrollView style={containerStyle}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={headerTitleStyle}>Hello Sirawit</Text>

            </View>

            {/* Stats Cards */}
            <View style={styles.statsContainer}>
                <View style={cardStyle}>
                    <Ionicons name="book-outline" size={28} color="#6C63FF"/>
                    <Text style={[styles.cardValue, {color: isDarkMode ? '#fff' : '#000'}]}>0</Text>
                    <Text style={styles.cardLabel}>Total </Text>
                </View>
                <View style={cardStyle}>
                    <FontAwesome5 name="dollar-sign" size={28} color="#6C63FF"/>
                    <Text style={[styles.cardValue, {color: isDarkMode ? '#fff' : '#000'}]}>฿0</Text>
                    <Text style={styles.cardLabel}>Total Value</Text>
                </View>
            </View>

            {/* Quick Actions */}
            <View style={styles.quickActions}>
                <Text style={[styles.sectionTitle, {color: isDarkMode ? '#fff' : '#000'}]}>Quick Actions</Text>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => setCurrentScreen('AddBook')}
                >
                    <Text style={styles.addButtonText}>+ Add New Book</Text>
                </TouchableOpacity>

                {/*<View style={styles.actionRow}>*/}
                {/*    <TouchableOpacity style={styles.smallButton}>*/}
                {/*        <MaterialCommunityIcons name="trending-up" size={20} color="#6C63FF"/>*/}
                {/*        <Text style={styles.smallButtonText}>Update Values</Text>*/}
                {/*    </TouchableOpacity>*/}

                {/*    <TouchableOpacity style={styles.smallButton}>*/}
                {/*        <Ionicons name="calendar-outline" size={20} color="#6C63FF"/>*/}
                {/*        <Text style={styles.smallButtonText}>Conservation</Text>*/}
                {/*    </TouchableOpacity>*/}
                {/*</View>*/}
            </View>

            {/* Collection Value Trend Graph */}
            {/*<CollectionValueTrend/>*/}

            {/* Recent Additions */}
            <RecentAdditions onAddFirstBook={() => setCurrentScreen('AddBook')}/>

            {/* This Month (Activity) - Moved to be consistent with the first image set */}
            <View style={[styles.thisMonth, chartCardStyle]}>
                <Text style={[styles.sectionTitle, {color: isDarkMode ? '#fff' : '#000', alignSelf: 'flex-start'}]}>This
                    Month</Text>
                <View style={styles.thisMonthContent}>
                    <Text style={styles.subText}>New additions</Text>
                    <View style={styles.booksCountBadge}>
                        <Text style={styles.booksCountText}>0 books</Text>
                    </View>
                </View>
                {/*<Text style={styles.subText}>No recent activity</Text>*/}

                {/*<TouchableOpacity*/}
                {/*    style={styles.firstBookButton}*/}
                {/*    onPress={() => setCurrentScreen('AddBook')}*/}
                {/*>*/}
                {/*    <Text style={styles.firstBookText}>Add your first book</Text>*/}
                {/*</TouchableOpacity>*/}
            </View>

            {/*<BooksByGrade/>*/}

            {/*<BindingDistribution/>*/}

        </ScrollView>
    );
}

const styles = StyleSheet.create({
    // --- General Styles ---
    container: {flex: 1, backgroundColor: '#F8F9FA', padding: 16},
    darkContainer: {flex: 1, backgroundColor: '#121212', padding: 16},
    centered: {flex: 1, justifyContent: 'center', alignItems: 'center'},

    // --- Header Styles ---
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        paddingHorizontal: 5
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    title: {fontSize: 22, fontWeight: 'bold', color: '#000'},
    darkTitle: {fontSize: 22, fontWeight: 'bold', color: '#fff'},
    notification: {position: 'relative'},
    badge: {
        position: 'absolute',
        right: -6,
        top: -4,
        backgroundColor: 'red',
        borderRadius: 10,
        paddingHorizontal: 6,
        paddingVertical: 2
    },
    badgeText: {color: '#fff', fontSize: 12, fontWeight: 'bold'},

    // --- Stats Cards Styles ---
    statsContainer: {flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24},
    card: {
        flex: 1,
        backgroundColor: '#fff',
        marginHorizontal: 6,
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 1},
        shadowOpacity: 0.1,
        shadowRadius: 1
    },
    darkCard: {
        flex: 1,
        backgroundColor: '#1E1E1E',
        marginHorizontal: 6,
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        elevation: 2
    },
    cardValue: {fontSize: 18, fontWeight: 'bold', marginTop: 6},
    cardLabel: {fontSize: 14, color: 'gray'},

    // --- Quick Actions Styles ---
    sectionTitle: {fontSize: 16, fontWeight: '600', marginBottom: 10},
    quickActions: {marginBottom: 24, paddingHorizontal: 6},
    addButton: {backgroundColor: '#6C63FF', padding: 14, borderRadius: 10, alignItems: 'center', marginBottom: 12},
    addButtonText: {color: '#fff', fontWeight: '600'},
    actionRow: {flexDirection: 'row', justifyContent: 'space-between'},
    smallButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 12,
        marginHorizontal: 6,
        justifyContent: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 1},
        shadowOpacity: 0.1,
        shadowRadius: 1
    },
    smallButtonText: {marginLeft: 6, color: '#6C63FF', fontWeight: '500'},

    // --- Chart/Block Styles (CollectionValueTrend, RecentAdditions, BooksByGrade, BindingDistribution) ---
    chartCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: cardPadding,
        marginBottom: 20,
        marginHorizontal: cardMargin,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 1},
        shadowOpacity: 0.1,
        shadowRadius: 1
    },
    darkChartCard: {
        backgroundColor: '#1E1E1E',
        borderRadius: 12,
        padding: cardPadding,
        marginBottom: 20,
        marginHorizontal: cardMargin,
        elevation: 2,
    },
    chartTitle: {fontSize: 16, fontWeight: '600', marginBottom: 10},
    centeredContent: {alignItems: 'center'}, // For Recent Additions/This Month

    // --- Line Graph Styles (Collection Value Trend Simulation) ---
    lineGraphContainer: {
        flexDirection: 'row',
        height: 150, // Fixed height for graph
        width: '100%',
        paddingRight: 10
    },
    yAxis: {
        justifyContent: 'space-between',
        paddingRight: 10
    },
    yAxisLabel: {
        fontSize: 10,
        color: 'gray',
        textAlign: 'right',
        height: 25 // 150px height / 6 labels = 25px per segment
    },
    graphArea: {
        flex: 1,
        position: 'relative',
        borderLeftWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#E0E0E0'
    },
    lineSegment: { // This is a simplified, non-dynamic line
        position: 'absolute',
        top: '60%', // Start low
        left: 0,
        right: 0,
        height: 1,
        backgroundColor: '#6C63FF', // Simulates the general trend line
        transform: [{translateY: -75}, {rotate: '5deg'}], // Slight upward slope
    },
    dataPoint: {
        position: 'absolute',
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#6C63FF',
        bottom: 0, // Simplified: should be calculated based on value
        transform: [{translateY: -125}, {translateX: -4}], // General position for visual effect
    },
    xAxis: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingLeft: 40,
        marginTop: 5
    },
    xAxisLabel: {
        fontSize: 12,
        color: 'gray',
        width: (graphWidth / 6) // Evenly space x-axis labels
    },

    // --- Recent Additions Styles ---
    bigAddButton: {
        backgroundColor: '#6C63FF',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 20,
        marginTop: 20,
        marginBottom: 10
    },
    bigAddButtonText: {
        color: '#fff',
        fontWeight: '600'
    },

    // --- This Month Styles ---
    thisMonth: {
        alignItems: 'flex-start', // Reset to align with text/title
        padding: 16,
        marginHorizontal: cardMargin,
        marginBottom: 20
    },
    thisMonthContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        alignItems: 'center'
    },
    booksCountBadge: {
        backgroundColor: '#343A40',
        borderRadius: 15,
        paddingHorizontal: 10,
        paddingVertical: 4
    },
    booksCountText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    firstBookButton: {
        marginTop: 12,
        borderWidth: 1,
        borderColor: '#6C63FF',
        borderRadius: 10,
        paddingVertical: 8,
        paddingHorizontal: 16,
        alignSelf: 'center' // Center this button
    },
    firstBookText: {color: '#6C63FF', fontWeight: '600'},

    // --- Bar Chart Styles (Books by Grade Simulation) ---
    barChartContainer: {
        flexDirection: 'row',
        height: 180,
        paddingRight: 10,
        alignItems: 'flex-end',
    },
    yAxisBarChart: {
        justifyContent: 'space-between',
        paddingRight: 10,
        height: 150, // 16 unit max
        paddingBottom: 25 // Align 0 with x-axis
    },
    yAxisLabelBar: {
        fontSize: 10,
        color: 'gray',
        textAlign: 'right',
        height: 25 // 150px height / 6 labels = 25px per segment
    },
    barChartBars: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'flex-end',
        borderBottomWidth: 1,
        borderColor: '#E0E0E0',
        height: 150
    },
    barColumn: {
        alignItems: 'center',
        justifyContent: 'flex-end',
        flex: 1
    },
    bar: {
        width: 25,
        borderRadius: 4,
    },
    barLabel: {
        fontSize: 12,
        color: 'gray',
        marginTop: 5
    },

    // --- Donut Chart Styles (Binding Distribution Simulation) ---
    donutChartContainer: {
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 10
    },
    donut: {
        width: 150,
        height: 150,
        borderRadius: 75,
        borderWidth: 25,
        borderColor: '#6C63FF', // Primary color for the largest segment
        justifyContent: 'center',
        alignItems: 'center',
    },
    donutSegment: { // Used to simulate other segments. This is a very crude way.
        position: 'absolute',
        width: 150,
        height: 150,
        borderRadius: 75,
        borderTopWidth: 25,
        borderTopColor: 'transparent',
        borderRightWidth: 25,
        borderRightColor: 'transparent',
        borderBottomWidth: 25,
        borderBottomColor: 'transparent',
        borderLeftWidth: 25,
        borderLeftColor: 'transparent',
        // The background color is what visually fills the donut segment
    },

    // --- Add Book Screen Styles ---
    addBookText: {fontSize: 20, fontWeight: 'bold'},
    backButton: {marginTop: 16},
    backButtonText: {color: '#6C63FF', fontWeight: 'bold'},
});