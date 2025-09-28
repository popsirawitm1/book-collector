import React, {useState, useEffect} from 'react';
import {View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions, ActivityIndicator} from 'react-native';
import {Ionicons, FontAwesome5} from '@expo/vector-icons';
import {useAuth} from '@/contexts/AuthContext';
import {auth, db} from '@/configs/firebase';
import {collection, onSnapshot, query, where} from 'firebase/firestore';
import {useRouter} from 'expo-router';

// Constants for graph visualization
const screenWidth = Dimensions.get('window').width;
const cardPadding = 16;
const cardMargin = 12;
const graphWidth = screenWidth - (cardMargin * 2) - (cardPadding * 2);

// Function to calculate the height of the bar based on the max value (16)
const calculateBarHeight = (value: number): number => {
    const maxHeight = 120; // Max height for a bar representing a count of 16
    return (value / 16) * maxHeight;
};

// Interface for Book data
interface Book {
    id: string;
    title: string;
    authors: string;
    publisher: string;
    year: string;
    coverImage?: string;
    purchasePrice: number;
    condition?: string;
    edition?: string;
    binding?: string;
    createdAt: any;
}

// Interface for Collection data
interface Collection {
    id: string;
    name: string;
}

const CollectionValueTrend = ({bookData}: { bookData: Book[] }) => {
    // Calculate monthly data for the last 6 months
    const getMonthlyData = () => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
        const currentDate = new Date();
        const monthlyValues = [];

        for (let i = 5; i >= 0; i--) {
            const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
            const monthBooks = bookData.filter(book => {
                if (!book.createdAt) return false;
                const bookDate = book.createdAt.toDate ? book.createdAt.toDate() : new Date(book.createdAt);
                return bookDate.getMonth() === targetDate.getMonth() &&
                    bookDate.getFullYear() === targetDate.getFullYear();
            });
            const monthValue = monthBooks.reduce((sum, book) => sum + book.purchasePrice, 0);
            monthlyValues.push(monthValue);
        }
        return monthlyValues;
    };

    const monthlyValues = getMonthlyData();
    const maxValue = Math.max(...monthlyValues, 1);

    return (
        <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Collection Value Trend</Text>
            <View style={styles.lineGraphContainer}>
                {/* Y-Axis Labels */}
                <View style={styles.yAxis}>
                    <Text style={styles.yAxisLabel}>{maxValue}</Text>
                    <Text style={styles.yAxisLabel}>{Math.round(maxValue * 0.75)}</Text>
                    <Text style={styles.yAxisLabel}>{Math.round(maxValue * 0.5)}</Text>
                    <Text style={styles.yAxisLabel}>{Math.round(maxValue * 0.25)}</Text>
                    <Text style={styles.yAxisLabel}>0</Text>
                </View>
                {/* Graph Area with dynamic points */}
                <View style={styles.graphArea}>
                    <View style={styles.lineSegment}/>
                    {monthlyValues.map((value, index) => (
                        <View
                            key={index}
                            style={[
                                styles.dataPoint,
                                {
                                    left: `${(index / 5) * 100}%`,
                                    bottom: `${(value / maxValue) * 80}%`
                                }
                            ]}
                        />
                    ))}
                </View>
            </View>
            {/* X-Axis Labels */}
            <View style={styles.xAxis}>
                {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((month, index) => (
                    <Text key={index} style={styles.xAxisLabel}>{month}</Text>
                ))}
            </View>
        </View>
    );
};

// Component for Recent Additions
const RecentAdditions = ({recentBooks, onAddBook}: {
    recentBooks: Book[],
    onAddBook: () => void
}) => (
    <View style={[styles.chartCard, styles.centeredContent]}>
        <Text style={styles.chartTitle}>Recent Additions</Text>
        {recentBooks.length === 0 ? (
            <>
                <Ionicons name="book-outline" size={30} color="#6C63FF" style={{marginTop: 20}}/>
                <Text style={styles.subText}>No books in your collection yet</Text>
                <TouchableOpacity
                    style={styles.bigAddButton}
                    onPress={onAddBook}
                >
                    <Text style={styles.bigAddButtonText}>+ Add Your First Book</Text>
                </TouchableOpacity>
            </>
        ) : (
            <View style={styles.recentBooksContainer}>
                {recentBooks.slice(0, 2).map((book, index) => (
                    <View key={book.id} style={styles.recentBookItem}>
                        <Text style={styles.recentBookTitle} numberOfLines={1}>{book.title}</Text>
                        <Text style={styles.recentBookAuthor} numberOfLines={1}>{book.authors}</Text>
                        <Text style={styles.recentBookPrice}>฿{book.purchasePrice}</Text>
                    </View>
                ))}
                <TouchableOpacity
                    style={styles.addMoreButton}
                    onPress={onAddBook}
                >
                    <Text style={styles.addMoreButtonText}>+ Add More</Text>
                </TouchableOpacity>
            </View>
        )}
    </View>
);

// Component for Books by Grade (Bar Chart Simulation)
const BooksByGrade = ({bookData}: { bookData: Book[] }) => {
    const getGradeData = () => {
        const conditions = ['Mint', 'Near Mint', 'Very Fine', 'Fine', 'Very Good'];
        return conditions.map(condition => {
            const count = bookData.filter(book =>
                book.condition?.toLowerCase().includes(condition.toLowerCase()) ||
                book.condition?.toLowerCase().includes(condition.substring(0, 2).toLowerCase())
            ).length;
            return {
                label: condition.substring(0, 4),
                value: count,
                color: '#6C63FF'
            };
        });
    };

    const gradeData = getGradeData();
    const maxValue = Math.max(...gradeData.map(g => g.value), 1);

    return (
        <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Books by Condition</Text>
            <View style={styles.barChartContainer}>
                {/* Y-Axis Labels */}
                <View style={styles.yAxisBarChart}>
                    <Text style={styles.yAxisLabelBar}>{maxValue}</Text>
                    <Text style={styles.yAxisLabelBar}>{Math.round(maxValue * 0.75)}</Text>
                    <Text style={styles.yAxisLabelBar}>{Math.round(maxValue * 0.5)}</Text>
                    <Text style={styles.yAxisLabelBar}>{Math.round(maxValue * 0.25)}</Text>
                    <Text style={styles.yAxisLabelBar}>0</Text>
                </View>

                {/* Bar Chart Bars */}
                <View style={styles.barChartBars}>
                    {gradeData.map((item, index) => (
                        <View key={index} style={styles.barColumn}>
                            <View style={[styles.bar, {
                                height: maxValue > 0 ? (item.value / maxValue) * 150 : 0,
                                backgroundColor: item.color
                            }]}/>
                            <Text style={styles.barLabel}>{item.label}</Text>
                        </View>
                    ))}
                </View>
            </View>
        </View>
    );
};

// Component for Binding Distribution (Donut Chart Simulation)
const BindingDistribution = ({bookData}: { bookData: Book[] }) => {
    const getBindingData = () => {
        const bindings = ['Hardcover', 'Paperback', 'Trade Paperback'];
        return bindings.map(binding => {
            const count = bookData.filter(book =>
                book.binding?.toLowerCase().includes(binding.toLowerCase())
            ).length;
            return {binding, count};
        });
    };

    const bindingData = getBindingData();
    const totalBooks = bookData.length;

    return (
        <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Binding Distribution</Text>
            <View style={styles.donutChartContainer}>
                <View style={styles.donut}/>
                <View style={[styles.donutSegment, {backgroundColor: '#F0B90B', transform: [{rotate: '270deg'}]}]}/>
                <View style={[styles.donutSegment, {backgroundColor: '#1A9652', transform: [{rotate: '150deg'}]}]}/>
            </View>

            {/* Binding stats */}
            <View style={styles.bindingStats}>
                {bindingData.map((item, index) => (
                    <View key={index} style={styles.bindingStat}>
                        <Text style={styles.bindingLabel}>{item.binding}</Text>
                        <Text style={styles.bindingCount}>
                            {item.count} ({totalBooks > 0 ? Math.round((item.count / totalBooks) * 100) : 0}%)
                        </Text>
                    </View>
                ))}
            </View>
        </View>
    );
};

export default function App() {
    const [currentScreen, setCurrentScreen] = useState('Home');
    const [isDarkMode, setIsDarkMode] = useState(false);
    const {user} = useAuth();
    const router = useRouter();

    // Book data states
    const [books, setBooks] = useState<Book[]>([]);
    const [collections, setCollections] = useState<Collection[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Load data from Firebase
    useEffect(() => {
        if (!auth.currentUser) return;

        setIsLoading(true);

        // Load books
        const booksQuery = query(
            collection(db, "books"),
            where("userId", "==", auth.currentUser.uid)
        );

        const unsubscribe = onSnapshot(booksQuery, (snapshot) => {
            const booksData: Book[] = snapshot.docs.map((doc) => ({
                id: doc.id,
                title: doc.data().title || "",
                authors: doc.data().authors || "",
                publisher: doc.data().publisher || "",
                year: doc.data().year || "",
                coverImage: doc.data().coverImage,
                purchasePrice: Number(doc.data().purchasePrice) || 0,
                condition: doc.data().condition || "",
                edition: doc.data().edition || "",
                binding: doc.data().binding || "",
                createdAt: doc.data().createdAt,
            }));
            setBooks(booksData);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

    // Function to get display name from user
    const getDisplayName = () => {
        if (!user) return 'Guest';

        if (user.displayName) {
            return user.displayName;
        }

        if (user.email) {
            return user.email.split('@')[0];
        }

        return 'User';
    };

    // Function to navigate to Add Book tab
    const navigateToAddBook = () => {
        router.push('/(tabs)/add');
    };

    // Calculate statistics
    const totalBooks = books.length;
    const totalValue = books.reduce((sum, book) => sum + book.purchasePrice, 0);
    const recentBooks = books
        .sort((a, b) => {
            const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
            const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
            return dateB.getTime() - dateA.getTime();
        })
        .slice(0, 5);

    // Get books added this month
    const thisMonthBooks = books.filter(book => {
        if (!book.createdAt) return false;
        const bookDate = book.createdAt.toDate ? book.createdAt.toDate() : new Date(book.createdAt);
        const currentDate = new Date();
        return bookDate.getMonth() === currentDate.getMonth() &&
            bookDate.getFullYear() === currentDate.getFullYear();
    });

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

    if (isLoading) {
        return (
            <View style={[styles.centered, containerStyle]}>
                <ActivityIndicator size="large" color="#6C63FF"/>
                <Text style={[styles.subText, {marginTop: 16}]}>Loading your collection...</Text>
            </View>
        );
    }

    // Home screen
    return (
        <View style={{flex: 1, backgroundColor: "#f9fafb"}}>
            {/* Header with consistent theme */}
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <Text style={styles.headerTitle}>
                        <Ionicons name="home" size={24} color="#6366f1"/>
                        {' '}Hello, {getDisplayName()}
                    </Text>
                    <Text style={styles.headerCount}>
                        {totalBooks} books
                    </Text>
                </View>
            </View>

            <ScrollView style={{paddingHorizontal: 16, paddingTop: 16}}>
                {/* Stats Cards */}
                <View style={styles.statsContainer}>
                    <View style={cardStyle}>
                        <Ionicons name="book-outline" size={28} color="#6C63FF"/>
                        <Text style={[styles.cardValue, {color: isDarkMode ? '#fff' : '#000'}]}>
                            {totalBooks}
                        </Text>
                        <Text style={styles.cardLabel}>Total Books</Text>
                    </View>
                    <View style={cardStyle}>
                        <FontAwesome5 name="dollar-sign" size={28} color="#6C63FF"/>
                        <Text style={[styles.cardValue, {color: isDarkMode ? '#fff' : '#000'}]}>
                            ฿{totalValue.toLocaleString()}
                        </Text>
                        <Text style={styles.cardLabel}>Total Value</Text>
                    </View>
                </View>

                {/* Quick Actions */}
                <View style={styles.quickActions}>
                    <Text style={[styles.sectionTitle, {color: isDarkMode ? '#fff' : '#000'}]}>Quick Actions</Text>
                    <TouchableOpacity
                        style={styles.addButton}
                        onPress={navigateToAddBook}
                    >
                        <Text style={styles.addButtonText}>+ Add New Book</Text>
                    </TouchableOpacity>
                </View>

                {/* Recent Additions */}
                <RecentAdditions
                    recentBooks={recentBooks}
                    onAddBook={navigateToAddBook}
                />

                {/* This Month Activity */}
                <View style={[styles.thisMonth, chartCardStyle]}>
                    <Text style={[styles.sectionTitle, {color: isDarkMode ? '#fff' : '#000', alignSelf: 'flex-start'}]}>
                        This Month
                    </Text>
                    <View style={styles.thisMonthContent}>
                        <Text style={styles.subText}>New additions</Text>
                        <View style={styles.booksCountBadge}>
                            <Text style={styles.booksCountText}>{thisMonthBooks.length} books</Text>
                        </View>
                    </View>

                    {thisMonthBooks.length === 0 ? (
                        <TouchableOpacity
                            style={styles.firstBookButton}
                            onPress={navigateToAddBook}
                        >
                            <Text style={styles.firstBookText}>Add your first book this month</Text>
                        </TouchableOpacity>
                    ) : (
                        <View style={styles.thisMonthStats}>
                            <Text style={styles.thisMonthValue}>
                                Total value:
                                ฿{thisMonthBooks.reduce((sum, book) => sum + book.purchasePrice, 0).toLocaleString()}
                            </Text>
                        </View>
                    )}
                </View>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    // --- General Styles ---
    container: {flex: 1, backgroundColor: '#F8F9FA', padding: 16},
    darkContainer: {flex: 1, backgroundColor: '#121212', padding: 16},
    centered: {flex: 1, justifyContent: 'center', alignItems: 'center'},

    // --- Header Styles ---
    header: {
        backgroundColor: '#fff',
        paddingTop: 60,
        paddingHorizontal: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb'
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 0
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827'
    },
    headerCount: {
        fontSize: 16,
        color: '#6b7280',
        backgroundColor: '#f3f4f6',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 20
    },
    title: {fontSize: 22, fontWeight: 'bold', color: '#000'},
    darkTitle: {fontSize: 22, fontWeight: 'bold', color: '#fff'},

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
    subText: {fontSize: 14, color: 'gray', marginBottom: 8},

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
        transform: [{translateX: -4}],
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
    recentBooksContainer: {
        width: '100%',
        marginTop: 16,
    },
    recentBookItem: {
        backgroundColor: '#f8f9fa',
        padding: 12,
        borderRadius: 8,
        marginBottom: 8,
    },
    recentBookTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
    },
    recentBookAuthor: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    recentBookPrice: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#6C63FF',
        marginTop: 4,
    },
    addMoreButton: {
        backgroundColor: '#f0f0f0',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#6C63FF',
        borderStyle: 'dashed',
    },
    addMoreButtonText: {
        color: '#6C63FF',
        fontWeight: '600',
    },

    // --- This Month Styles ---
    thisMonth: {
        alignItems: 'flex-start',
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
        alignSelf: 'center'
    },
    firstBookText: {color: '#6C63FF', fontWeight: '600'},
    thisMonthStats: {
        marginTop: 8,
        width: '100%',
    },
    thisMonthValue: {
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
    },

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
    },
    bindingStats: {
        marginTop: 12,
    },
    bindingStat: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 4,
    },
    bindingLabel: {
        fontSize: 12,
        color: '#333',
    },
    bindingCount: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#6C63FF',
    },

    // --- Add Book Screen Styles ---
    addBookText: {fontSize: 20, fontWeight: 'bold'},
    backButton: {marginTop: 16},
    backButtonText: {color: '#6C63FF', fontWeight: 'bold'},
});
