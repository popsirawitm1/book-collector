import React, {useState, useEffect} from "react";
import {ScrollView, View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import {auth, db} from "../../configs/firebase";
import {collection, onSnapshot, query, where, getDocs} from "firebase/firestore";
import {useAuth} from "../../contexts/AuthContext";
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import CustomAlert from "../../components/CustomAlert";

type Page = "Settings" | "Reports" | "Help" | null;

interface Colors {
    background: string;
    card: string;
    textPrimary: string;
    textSecondary: string;
    blue: string;
    green: string;
    yellow: string;
    border: string;
}

interface MainMoreScreenProps {
    setCurrentPage: React.Dispatch<React.SetStateAction<Page>>;
    colors: Colors;
    bookStats: BookStats | null;
    showAlert?: (title: string, message?: string, type?: 'error' | 'success' | 'warning') => void;
}

interface MenuItemProps {
    title: string;
    icon: string;
    onPress: () => void;
    colors: Colors;
}

// Add Book interface
interface Book {
    id: string;
    title: string;
    authors: string;
    publisher: string;
    year: string;
    purchasePrice: number;
    condition: string;
    edition: string;
    binding: string;
    collectionId?: string;
}

// Add BookStats interface
interface BookStats {
    totalBooks: number;
    firstEditions: number;
    estimatedValue: number;
    hardcovers: number;
    collections: number;
}

// Add export function before the main App component
const exportToCSV = async (books: Book[], showAlert?: (title: string, message?: string, type?: 'error' | 'success' | 'warning') => void) => {
    try {
        // Create CSV header
        const csvHeader = "Title,Authors,Publisher,Year,Purchase Price,Condition,Edition,Binding,Collection ID\n";

        // Create CSV rows
        const csvRows = books.map(book => {
            // Escape quotes in data
            const escapeQuotes = (str: string) => str.replace(/"/g, '""');

            return `"${escapeQuotes(book.title || '')}","${escapeQuotes(book.authors || '')}","${escapeQuotes(book.publisher || '')}","${escapeQuotes(book.year || '')}","${book.purchasePrice || 0}","${escapeQuotes(book.condition || '')}","${escapeQuotes(book.edition || '')}","${escapeQuotes(book.binding || '')}","${escapeQuotes(book.collectionId || '')}"`;
        }).join('\n');

        const csvContent = csvHeader + csvRows;

        // Create file using legacy FileSystem API
        const fileName = `book_collection_${new Date().getTime()}.csv`;
        const fileUri = `${FileSystem.documentDirectory}${fileName}`;

        // Use legacy writeAsStringAsync which still works
        await FileSystem.writeAsStringAsync(fileUri, csvContent);

        // Share file
        if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(fileUri, {
                mimeType: 'text/csv',
                dialogTitle: 'Export Book Collection CSV'
            });
        } else {
            if (showAlert) {
                showAlert('Success', 'CSV file saved successfully!', 'success');
            } else {
                Alert.alert('Success', 'CSV file saved successfully!');
            }
        }

    } catch (error) {
        console.error('Export CSV error:', error);
        if (showAlert) {
            showAlert('Error', `Failed to export CSV file: ${error}`, 'error');
        } else {
            Alert.alert('Error', `Failed to export CSV file: ${error}`);
        }
    }
};

export default function App() {
    const [currentPage, setCurrentPage] = useState<Page>(null);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [bookStats, setBookStats] = useState<BookStats | null>(null);

    // Add CustomAlert states
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertTitle, setAlertTitle] = useState('');
    const [alertMessage, setAlertMessage] = useState('');
    const [alertType, setAlertType] = useState<'error' | 'success' | 'warning'>('error');

    const colors: Colors = {
        background: isDarkMode ? "#111827" : "#f3f4f6",
        card: isDarkMode ? "#1f2937" : "#fff",
        textPrimary: isDarkMode ? "#f9fafb" : "#111827",
        textSecondary: isDarkMode ? "#d1d5db" : "#6b7280",
        blue: "#2563eb",
        green: "#16a34a",
        yellow: "#eab308",
        border: isDarkMode ? "#374151" : "#e5e7eb",
    };

    // Add showAlert function
    const showAlert = (title: string, message: string = '', type: 'error' | 'success' | 'warning' = 'error') => {
        setAlertTitle(title);
        setAlertMessage(message);
        setAlertType(type);
        setAlertVisible(true);
    };

    useEffect(() => {
        const fetchBookStats = () => {
            const user = auth.currentUser;
            if (user) {
                const q = query(collection(db, "books"), where("userId", "==", user.uid));
                onSnapshot(q, (snapshot) => {
                    let totalBooks = 0;
                    let firstEditions = 0;
                    let estimatedValue = 0;
                    let hardcovers = 0;
                    let collections = new Set();

                    snapshot.forEach((doc) => {
                        const data = doc.data();
                        totalBooks++;

                        // Check for first editions
                        if (data.edition && data.edition.toLowerCase().includes("first")) {
                            firstEditions++;
                        }

                        // Calculate estimated value - handle both purchasePrice and price fields
                        const price = data.purchasePrice || data.price || 0;
                        estimatedValue += Number(price);

                        // Check for hardcovers
                        if (data.binding && data.binding.toLowerCase().includes("hardcover")) {
                            hardcovers++;
                        }

                        // Track collections
                        if (data.collectionId) {
                            collections.add(data.collectionId);
                        }
                    });

                    setBookStats({
                        totalBooks,
                        firstEditions,
                        estimatedValue,
                        hardcovers,
                        collections: collections.size,
                    });
                });
            }
        };

        fetchBookStats();
    }, []);

    const renderPage = () => {
        const pageContent = (() => {
            switch (currentPage) {
                case "Settings":
                    return (
                        <SettingsScreen
                            colors={colors}
                            isDarkMode={isDarkMode}
                            setIsDarkMode={setIsDarkMode}
                            setCurrentPage={setCurrentPage}
                            showAlert={showAlert}
                        />
                    );

                case "Reports":
                    return (
                        <ReportsScreen
                            colors={colors}
                            bookStats={bookStats}
                            setCurrentPage={setCurrentPage}
                            showAlert={showAlert}
                        />
                    );

                case "Help":
                    return (
                        <ScrollView style={[styles.container, {backgroundColor: colors.background}]}>
                            <Text style={[styles.pageTitle, {color: colors.textPrimary}]}>Help & Support</Text>

                            <View style={[styles.card, {backgroundColor: colors.card}]}>
                                <Text style={[styles.sectionTitle, {color: colors.textPrimary}]}>FAQ</Text>
                                <Text style={[styles.itemText, {color: colors.textSecondary}]}>
                                    Q: How do I add a new book?
                                </Text>
                                <Text style={[styles.itemText, {color: colors.textSecondary}]}>
                                    A: Go to the collection page and tap 'Add Book'.
                                </Text>
                                <Text style={[styles.itemText, {color: colors.textSecondary}]}>
                                    Q: How do I export my collection?
                                </Text>
                                <Text style={[styles.itemText, {color: colors.textSecondary}]}>
                                    A: Go to Reports & Export and choose a format.
                                </Text>
                            </View>

                            <View style={[styles.card, {backgroundColor: colors.card}]}>
                                <Text style={[styles.sectionTitle, {color: colors.textPrimary}]}>
                                    Contact Support
                                </Text>
                                <Text style={[styles.itemText, {color: colors.textSecondary}]}>
                                    Email: popworks002@gmail.com
                                </Text>
                                <Text style={[styles.itemText, {color: colors.textSecondary}]}>
                                    Phone: +66 94581 3503
                                </Text>
                            </View>

                            <TouchableOpacity
                                style={[styles.backButton, {backgroundColor: colors.blue}]}
                                onPress={() => setCurrentPage(null)}
                            >
                                <Text style={styles.backText}>Back</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    );

                default:
                    return <MainMoreScreen setCurrentPage={setCurrentPage} colors={colors} bookStats={bookStats}
                                           showAlert={showAlert}/>;
            }
        })();

        return (
            <>
                {pageContent}
                <CustomAlert
                    visible={alertVisible}
                    title={alertTitle}
                    message={alertMessage}
                    type={alertType}
                    onClose={() => setAlertVisible(false)}
                />
            </>
        );
    };

    return renderPage();
}

function MainMoreScreen({setCurrentPage, colors, bookStats, showAlert}: MainMoreScreenProps) {
    const {user, signOut} = useAuth();

    const handleLogout = () => {
        if (showAlert) {
            showAlert(
                'Sign Out',
                'Are you sure you want to sign out?',
                'warning'
            );
            // Note: For confirmation dialogs, we would need a different approach
            // For now, we'll keep the original Alert.alert for confirmation
        }

        Alert.alert(
            "Sign Out",
            "Are you sure you want to sign out?",
            [
                {
                    text: "Cancel",
                    style: "cancel"
                },
                {
                    text: "Sign Out",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await signOut();
                        } catch (error) {
                            if (showAlert) {
                                showAlert("Error", "Unable to sign out", "error");
                            } else {
                                Alert.alert("Error", "Unable to sign out");
                            }
                        }
                    }
                }
            ]
        );
    };

    const getUserDisplayName = () => {
        if (user?.displayName) return user.displayName;
        if (user?.email) return user.email.split('@')[0];
        return "Book Collector";
    };

    const getUserEmail = () => {
        return user?.email || "No email";
    };

    const getMembershipStatus = () => {
        // คุณสามารถเปลี่ยนตรรกะนี้ตามระบบสมาชิกของคุณ
        const createdDate = user?.metadata?.creationTime;
        if (createdDate) {
            const created = new Date(createdDate);
            const now = new Date();
            const daysSinceCreated = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
            return daysSinceCreated > 30 ? "Premium Member" : "New Member";
        }
        return "Premium Member";
    };

    return (
        <View style={{flex: 1, backgroundColor: "#f9fafb"}}>
            {/* Header with consistent theme */}
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <Text style={styles.headerTitle}>
                        <Ionicons name="person-circle" size={24} color="#6366f1"/>
                        {' '}More
                    </Text>
                    <Text style={styles.headerCount}>
                        {bookStats ? bookStats.totalBooks : 0} books
                    </Text>
                </View>
            </View>

            <ScrollView style={[{paddingHorizontal: 16, backgroundColor: colors.background}]}>
                {/* Profile Card */}
                <View style={[styles.card, {backgroundColor: colors.card}]}>
                    <View style={styles.profileRow}>
                        <Ionicons name="person-circle-outline" size={60} color={colors.blue}/>
                        <View style={{marginLeft: 12, flex: 1}}>
                            <Text style={[styles.name, {color: colors.textPrimary}]}>
                                {getUserDisplayName()}
                            </Text>
                            <Text style={[styles.email, {color: colors.textSecondary}]}>
                                {getUserEmail()}
                            </Text>
                            <Text style={[styles.member, {color: colors.blue}]}>
                                {getMembershipStatus()}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Collection Overview */}
                <View style={[styles.card, {backgroundColor: colors.card}]}>
                    <Text style={[styles.sectionTitle, {color: colors.textPrimary}]}>
                        Collection Overview
                    </Text>
                    <View style={[styles.overviewRowLine, {borderBottomColor: colors.border}]}>
                        <View style={styles.rowLeft}>
                            <Ionicons name="book-outline" size={18} color={colors.blue}/>
                            <Text style={[styles.overviewText, {color: colors.textSecondary}]}>
                                Total Books
                            </Text>
                        </View>
                        <Text style={[styles.overviewValue, {color: colors.textPrimary}]}>
                            {bookStats ? bookStats.totalBooks : 0}
                        </Text>
                    </View>

                    <View style={[styles.overviewRowLine, {borderBottomColor: colors.border}]}>
                        <View style={styles.rowLeft}>
                            <Ionicons name="star-outline" size={18} color={colors.yellow}/>
                            <Text style={[styles.overviewText, {color: colors.textSecondary}]}>
                                First Editions
                            </Text>
                        </View>
                        <Text style={[styles.overviewValue, {color: colors.textPrimary}]}>
                            {bookStats ? bookStats.firstEditions : 0}
                        </Text>
                    </View>

                    <View style={styles.overviewRow}>
                        <View style={styles.rowLeft}>
                            <Ionicons name="cash-outline" size={18} color={colors.green}/>
                            <Text style={[styles.overviewText, {color: colors.textSecondary}]}>
                                Estimated Value
                            </Text>
                        </View>
                        <Text style={[styles.overviewValue, {color: colors.textPrimary}]}>
                            ฿{bookStats ? bookStats.estimatedValue.toFixed(2) : 0}
                        </Text>
                    </View>
                </View>

                {/* Menu Items */}
                <View style={[styles.card, {backgroundColor: colors.card}]}>
                    <MenuItem
                        title="Preferences"
                        icon="settings-outline"
                        onPress={() => setCurrentPage("Settings")}
                        colors={colors}
                    />
                    <MenuItem
                        title="Reports & Export"
                        icon="document-text-outline"
                        onPress={() => setCurrentPage("Reports")}
                        colors={colors}
                    />
                    <MenuItem
                        title="Help & Support"
                        icon="help-circle-outline"
                        onPress={() => setCurrentPage("Help")}
                        colors={colors}
                    />
                    <TouchableOpacity
                        style={[styles.menuItem, {borderBottomWidth: 0}]}
                        onPress={handleLogout}
                    >
                        <View style={styles.menuItemLeft}>
                            <Ionicons name="log-out-outline" size={24} color="#dc2626"/>
                            <Text style={[styles.menuItemText, {color: "#dc2626"}]}>
                                Sign Out
                            </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary}/>
                    </TouchableOpacity>
                </View>

                {/* App Info */}
                <View style={[styles.card, {backgroundColor: colors.card}]}>
                    <Text style={[styles.sectionTitle, {color: colors.textPrimary}]}>
                        About App
                    </Text>
                    <Text style={[styles.itemText, {color: colors.textSecondary}]}>
                        Version: 1.0.0
                    </Text>
                    <Text style={[styles.itemText, {color: colors.textSecondary}]}>
                        © 2024 Book Collector
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
}

function MenuItem({title, icon, onPress, colors}: MenuItemProps) {
    return (
        <TouchableOpacity style={styles.menuItem} onPress={onPress}>
            <View style={styles.menuItemLeft}>
                <Ionicons name={icon as any} size={24} color={colors.blue}/>
                <Text style={[styles.menuItemText, {color: colors.textPrimary}]}>{title}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary}/>
        </TouchableOpacity>
    );
}

function ReportsScreen({colors, bookStats, setCurrentPage, showAlert}: {
    colors: Colors;
    bookStats: BookStats | null;
    setCurrentPage: (page: Page) => void;
    showAlert?: (title: string, message?: string, type?: 'error' | 'success' | 'warning') => void;
}) {
    const [isExporting, setIsExporting] = useState(false);
    const [books, setBooks] = useState<Book[]>([]);

    useEffect(() => {
        const fetchBooks = async () => {
            const user = auth.currentUser;
            if (user) {
                try {
                    const q = query(collection(db, "books"), where("userId", "==", user.uid));
                    const snapshot = await getDocs(q);
                    const booksData: Book[] = [];
                    snapshot.forEach((doc) => {
                        const data = doc.data();
                        booksData.push({
                            id: doc.id,
                            title: data.title || 'Unknown Title',
                            authors: data.authors || 'Unknown Author',
                            publisher: data.publisher || 'Unknown Publisher',
                            year: data.year || 'Unknown Year',
                            purchasePrice: data.purchasePrice || data.price || 0,
                            condition: data.condition || 'Unknown',
                            edition: data.edition || 'Unknown Edition',
                            binding: data.binding || 'Unknown Binding',
                            collectionId: data.collectionId || ''
                        } as Book);
                    });
                    setBooks(booksData);
                } catch (error) {
                    console.error('Error fetching books:', error);
                    if (showAlert) {
                        showAlert('Error', 'Failed to fetch books data', 'error');
                    }
                }
            }
        };

        fetchBooks();
    }, [showAlert]);

    const handleExportCSV = async () => {
        if (books.length === 0) {
            if (showAlert) {
                showAlert('No Data', 'No books found to export', 'warning');
            } else {
                Alert.alert('No Data', 'No books found to export');
            }
            return;
        }

        setIsExporting(true);
        try {
            await exportToCSV(books, showAlert);
            if (showAlert) {
                showAlert('Success', 'CSV file exported successfully!', 'success');
            } else {
                Alert.alert('Success', 'CSV file exported successfully!');
            }
        } catch (error) {
            console.error('CSV Export Error:', error);
            if (showAlert) {
                showAlert('Error', 'Failed to export CSV file', 'error');
            } else {
                Alert.alert('Error', 'Failed to export CSV file');
            }
        }
        setIsExporting(false);
    };

    return (
        <ScrollView style={[styles.container, {backgroundColor: colors.background}]}>
            <Text style={[styles.pageTitle, {color: colors.textPrimary}]}>Collection Reports</Text>

            <View style={[styles.card, {backgroundColor: colors.card}]}>
                <Text style={[styles.sectionTitle, {color: colors.textPrimary}]}>
                    Collection Summary
                </Text>
                {bookStats ? (
                    <View style={styles.statsContainer}>
                        <View style={styles.statRow}>
                            <View style={styles.statItem}>
                                <Text style={[styles.statNumber, {color: colors.blue}]}>
                                    {bookStats.totalBooks}
                                </Text>
                                <Text style={[styles.statLabel, {color: colors.textSecondary}]}>
                                    Total Books
                                </Text>
                            </View>
                            <View style={styles.statItem}>
                                <Text style={[styles.statNumber, {color: colors.green}]}>
                                    ฿{bookStats.estimatedValue.toFixed(2)}
                                </Text>
                                <Text style={[styles.statLabel, {color: colors.textSecondary}]}>
                                    Collection Value
                                </Text>
                            </View>
                        </View>
                        <View style={styles.statRow}>
                            <View style={styles.statItem}>
                                <Text style={[styles.statNumber, {color: colors.yellow}]}>
                                    {bookStats.firstEditions}
                                </Text>
                                <Text style={[styles.statLabel, {color: colors.textSecondary}]}>
                                    First Editions
                                </Text>
                            </View>
                            <View style={styles.statItem}>
                                <Text style={[styles.statNumber, {color: colors.blue}]}>
                                    {bookStats.hardcovers}
                                </Text>
                                <Text style={[styles.statLabel, {color: colors.textSecondary}]}>
                                    Hardcovers
                                </Text>
                            </View>
                        </View>
                        <Text style={[styles.itemText, {
                            color: colors.textSecondary,
                            textAlign: 'center',
                            marginTop: 15
                        }]}>
                            Ready to export {books.length} books
                        </Text>
                    </View>
                ) : (
                    <ActivityIndicator size="large" color={colors.blue}/>
                )}
            </View>

            <View style={[styles.card, {backgroundColor: colors.card}]}>
                <Text style={[styles.sectionTitle, {color: colors.textPrimary}]}>
                    Export Options
                </Text>
                <Text style={[styles.itemText, {color: colors.textSecondary, marginBottom: 20}]}>
                    Export your collection data in different formats
                </Text>

                <TouchableOpacity
                    style={[
                        styles.exportButton,
                        {backgroundColor: colors.green, opacity: isExporting ? 0.7 : 1}
                    ]}
                    onPress={handleExportCSV}
                    disabled={isExporting || books.length === 0}
                >
                    <View style={styles.exportButtonContent}>
                        <Ionicons name="grid-outline" size={20} color="#fff"/>
                        <Text style={[styles.exportText, {marginLeft: 8}]}>
                            Export as CSV Spreadsheet
                        </Text>
                    </View>
                    {isExporting && <ActivityIndicator size="small" color="#fff" style={{marginLeft: 10}}/>}
                </TouchableOpacity>

                <View style={[styles.infoCard, {backgroundColor: colors.background, marginTop: 15}]}>
                    <Ionicons name="information-circle-outline" size={20} color={colors.blue}/>
                    <Text style={[styles.infoText, {color: colors.textSecondary, marginLeft: 8}]}>
                        CSV files can be opened in Excel or Google Sheets.
                    </Text>
                </View>
            </View>

            <TouchableOpacity
                style={[styles.backButton, {backgroundColor: colors.blue}]}
                onPress={() => setCurrentPage(null)}
            >
                <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

function SettingsScreen({colors, isDarkMode, setIsDarkMode, setCurrentPage, showAlert}: {
    colors: Colors;
    isDarkMode: boolean;
    setIsDarkMode: (value: boolean) => void;
    setCurrentPage: (page: Page) => void;
    showAlert?: (title: string, message?: string, type?: 'error' | 'success' | 'warning') => void;
}) {
    const {user} = useAuth();

    const getUserDisplayName = () => {
        if (user?.displayName) return user.displayName;
        if (user?.email) return user.email.split('@')[0];
        return "Book Collector";
    };

    const getUserEmail = () => {
        return user?.email || "No email";
    };

    const getAccountCreatedDate = () => {
        if (user?.metadata?.creationTime) {
            const date = new Date(user.metadata.creationTime);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }
        return "Unknown";
    };

    const getLastSignInDate = () => {
        if (user?.metadata?.lastSignInTime) {
            const date = new Date(user.metadata.lastSignInTime);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
        return "Unknown";
    };

    return (
        <ScrollView style={[styles.container, {backgroundColor: colors.background}]}>
            <Text style={[styles.pageTitle, {color: colors.textPrimary}]}>Preferences</Text>

            {/* Profile Section */}
            <View style={[styles.card, {backgroundColor: colors.card}]}>
                <Text style={[styles.sectionTitle, {color: colors.textPrimary}]}>User Information</Text>

                <View style={styles.profileRow}>
                    <Ionicons name="person-circle-outline" size={50} color={colors.blue}/>
                    <View style={{marginLeft: 12, flex: 1}}>
                        <Text style={[styles.itemText, {color: colors.textSecondary}]}>
                            Username: {getUserDisplayName()}
                        </Text>
                        <Text style={[styles.itemText, {color: colors.textSecondary}]}>
                            Email: {getUserEmail()}
                        </Text>
                        <Text style={[styles.itemText, {color: colors.textSecondary}]}>
                            User ID: {user?.uid || "Unknown"}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Account Information */}
            <View style={[styles.card, {backgroundColor: colors.card}]}>
                <Text style={[styles.sectionTitle, {color: colors.textPrimary}]}>Account Information</Text>
                <Text style={[styles.itemText, {color: colors.textSecondary}]}>
                    Account Created: {getAccountCreatedDate()}
                </Text>
                <Text style={[styles.itemText, {color: colors.textSecondary}]}>
                    Last Sign In: {getLastSignInDate()}
                </Text>
                <Text style={[styles.itemText, {color: colors.textSecondary}]}>
                    Email Verified: {user?.emailVerified ? "Verified ✓" : "Not Verified"}
                </Text>
            </View>

            {/* App Preferences */}
            <View style={[styles.card, {backgroundColor: colors.card}]}>
                <Text style={[styles.sectionTitle, {color: colors.textPrimary}]}>App Preferences</Text>


                <View style={[styles.overviewRow, {marginBottom: 16}]}>
                    <View style={styles.rowLeft}>
                        <Ionicons name="language-outline" size={20} color={colors.blue}/>
                        <Text style={[styles.overviewText, {color: colors.textSecondary}]}>
                            Language
                        </Text>
                    </View>
                    <Text style={[styles.overviewValue, {color: colors.textPrimary}]}>
                        English
                    </Text>
                </View>

                <View style={styles.overviewRow}>
                    <View style={styles.rowLeft}>
                        <Ionicons name="notifications-outline" size={20} color={colors.blue}/>
                        <Text style={[styles.overviewText, {color: colors.textSecondary}]}>
                            Notifications
                        </Text>
                    </View>
                    <Text style={[styles.overviewValue, {color: colors.textPrimary}]}>
                        Enabled
                    </Text>
                </View>
            </View>

            <TouchableOpacity
                style={[styles.backButton, {backgroundColor: colors.blue}]}
                onPress={() => setCurrentPage(null)}
            >
                <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    card: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    profileRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    name: {
        fontSize: 20,
        fontWeight: "bold",
    },
    email: {
        fontSize: 14,
        marginTop: 2,
    },
    member: {
        fontSize: 12,
        marginTop: 4,
        fontWeight: "500",
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "bold",
        marginBottom: 12,
    },
    overviewRowLine: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingBottom: 12,
        marginBottom: 12,
        borderBottomWidth: 1,
    },
    overviewRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    rowLeft: {
        flexDirection: "row",
        alignItems: "center",
    },
    overviewText: {
        fontSize: 14,
        marginLeft: 8,
    },
    overviewValue: {
        fontSize: 16,
        fontWeight: "bold",
    },
    menuItem: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#f3f4f6",
    },
    menuItemLeft: {
        flexDirection: "row",
        alignItems: "center",
    },
    menuItemText: {
        fontSize: 16,
        marginLeft: 12,
    },
    pageTitle: {
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 20,
        textAlign: "center",
    },
    itemText: {
        fontSize: 14,
        marginBottom: 8,
    },
    exportButton: {
        padding: 12,
        borderRadius: 8,
        alignItems: "center",
        marginBottom: 8,
    },
    exportText: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "500",
    },
    backButton: {
        padding: 16,
        borderRadius: 8,
        alignItems: "center",
        marginTop: 20,
    },
    backText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
    },
    statsContainer: {
        marginTop: 12,
    },
    statRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 12,
    },
    statItem: {
        flex: 1,
        alignItems: "center",
    },
    statNumber: {
        fontSize: 18,
        fontWeight: "bold",
    },
    statLabel: {
        fontSize: 14,
        color: "#6b7280",
    },
    infoCard: {
        borderRadius: 8,
        padding: 12,
        marginTop: 16,
        flexDirection: "row",
        alignItems: "center",
    },
    infoText: {
        fontSize: 14,
        color: "#374151",
    },
    exportButtonContent: {
        flexDirection: "row",
        alignItems: "center",
    },
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
});
