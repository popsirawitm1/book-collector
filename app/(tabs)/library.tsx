import React, {useEffect, useState} from "react";
import {
    View,
    Text,
    Image,
    ScrollView,
    TouchableOpacity,
    TextInput,
    StyleSheet,
    Modal,
    Button,
    Alert,
    ActivityIndicator,
} from "react-native";
import {useNavigation, NavigationProp} from "@react-navigation/native";
import {Ionicons} from "@expo/vector-icons";
import {auth, db} from "../../configs/firebase";
import {collection, onSnapshot, query, where, doc, updateDoc, deleteDoc, getDocs} from "firebase/firestore";

// กำหนด type ของ Book
interface Book {
    id: string;
    title: string;
    author: string;
    publisher: string;
    year: string;
    image: string;
    price: number;
    condition: string;
    edition: string;
    type: string;
    shelf: string;
    read: boolean;
    isbn?: string;
    language?: string;
    acquisitionSource?: string;
    acquisitionDate?: string;
    collectionId?: string; // เพิ่ม collectionId
    collectionName?: string; // เพิ่ม collectionName สำหรับแสดงผล
}

interface Collection {
    id: string;
    name: string;
}

const FILTER_TABS = [
    {label: "All", value: "all"},
    {label: "Hardcover", value: "hardcover"},
    {label: "First Editions", value: "first"},
    {label: "Collections", value: "collections"}, // เพิ่ม collection tab
];

export default function BookPage() {
    const navigation = useNavigation<NavigationProp<any>>();
    const [search, setSearch] = useState<string>("");
    const [activeTab, setActiveTab] = useState<string>("all");
    const [filterVisible, setFilterVisible] = useState<boolean>(false);

    // เพิ่ม loading states
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isLoadingCollections, setIsLoadingCollections] = useState<boolean>(true);
    const [isLoadingBooks, setIsLoadingBooks] = useState<boolean>(true);

    // ฟิลเตอร์เพิ่มเติม
    const [authorFilter, setAuthorFilter] = useState<string>("");
    const [yearFilter, setYearFilter] = useState<string>("");
    const [collectionFilter, setCollectionFilter] = useState<string>(""); // เพิ่ม collection filter

    // State สำหรับหนังสือและ collections
    const [books, setBooks] = useState<Book[]>([]);
    const [collections, setCollections] = useState<Collection[]>([]);

    // ดึงข้อมูล collections
    const loadCollections = async () => {
        if (!auth.currentUser) return;

        setIsLoadingCollections(true); // เริ่มโหลด collections

        try {
            const q = query(
                collection(db, "collections"),
                where("userId", "==", auth.currentUser.uid)
            );
            const querySnapshot = await getDocs(q);
            const collectionsData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                name: doc.data().name
            }));
            setCollections(collectionsData);
        } catch (error) {
            console.error("Error loading collections:", error);
        } finally {
            setIsLoadingCollections(false); // เสร็จสิ้นการโหลด collections
        }
    };

    // ดึงข้อมูลหนังสือจาก Firestore
    useEffect(() => {
        if (!auth.currentUser) return;

        setIsLoadingBooks(true); // เริ่มโหลดหนังสือ
        loadCollections(); // โหลด collections

        const q = query(
            collection(db, "books"),
            where("userId", "==", auth.currentUser.uid)
        );
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data: Book[] = snapshot.docs.map((doc) => {
                const bookData = doc.data();
                const collectionId = bookData.collectionId;

                return {
                    id: doc.id,
                    title: bookData.title || "",
                    author: bookData.authors || "",
                    publisher: bookData.publisher || "",
                    year: bookData.year || "",
                    image: bookData.coverImage
                        ? `data:image/jpeg;base64,${bookData.coverImage}`
                        : "https://i.ibb.co/3WpzD7y/book-open.jpg",
                    price: Number(bookData.purchasePrice) || 0,
                    condition: bookData.condition || "",
                    edition: bookData.edition || "",
                    type: bookData.binding || "",
                    shelf: bookData.shelf || "",
                    read: false,
                    isbn: bookData.isbn,
                    language: bookData.language,
                    acquisitionSource: bookData.acquisitionSource,
                    acquisitionDate: bookData.acquisitionDate,
                    collectionId: collectionId,
                    collectionName: "", // เราจะอัพเดทภายหลัง
                };
            });
            setBooks(data);
            setIsLoadingBooks(false); // เสร็จสิ้นการโหลดหนังสือ
        });
        return () => unsubscribe();
    }, []); // ลบ collections dependency ออก

    // อัพเดท collection name เมื่อ collections เปลี่ยน
    useEffect(() => {
        if (collections.length > 0 && books.length > 0) {
            const updatedBooks = books.map(book => ({
                ...book,
                collectionName: collections.find(c => c.id === book.collectionId)?.name || ""
            }));
            setBooks(updatedBooks);
        }
    }, [collections]); // เฉพาะ collections เป็น dependency

    // Update overall loading state
    useEffect(() => {
        setIsLoading(isLoadingBooks || isLoadingCollections);
    }, [isLoadingBooks, isLoadingCollections]);

    // ฟิลเตอร์ logic
    const filteredBooks = books.filter((book) => {
        const matchSearch =
            book.title.toLowerCase().includes(search.toLowerCase()) ||
            book.author.toLowerCase().includes(search.toLowerCase());

        let matchTab = true;
        if (activeTab === "hardcover") matchTab = book.type.toLowerCase() === "hardcover";
        if (activeTab === "first") matchTab = book.edition.toLowerCase().includes("first");
        if (activeTab === "collections") matchTab = !!book.collectionId; // แสดงเฉพาะหนังสือที่อยู่ใน collection

        const matchAuthor = authorFilter ? book.author.toLowerCase().includes(authorFilter.toLowerCase()) : true;
        const matchYear = yearFilter ? book.year === yearFilter : true;
        const matchCollection = collectionFilter ? book.collectionId === collectionFilter : true; // เพิ่ม collection filter

        return matchSearch && matchTab && matchAuthor && matchYear && matchCollection;
    });

    const resetFilter = () => {
        setAuthorFilter("");
        setYearFilter("");
    };

    const handleBookEdit = async (bookId: string, field: string, value: any) => {
        try {
            const bookRef = doc(db, "books", bookId);
            await updateDoc(bookRef, {[field]: value});
        } catch (error) {
            console.error("Error updating book:", error);
            Alert.alert("Error", "Failed to save changes.");
        }
    };

    const handleDeleteBook = (bookId: string, title: string) => {
        Alert.alert(
            "Confirm Delete",
            `Are you sure you want to delete "${title}"?`,
            [
                {text: "Cancel", style: "cancel"},
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await deleteDoc(doc(db, "books", bookId));
                        } catch (error) {
                            console.error("Error deleting book:", error);
                            Alert.alert("Error", "Failed to delete book.");
                        }
                    },
                },
            ]
        );
    };

    const FilterModal = () => (
        <Modal visible={filterVisible} animationType="slide" transparent>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Filter Books</Text>

                    <Text style={styles.filterLabel}>Author</Text>
                    <TextInput
                        style={styles.filterInput}
                        value={authorFilter}
                        onChangeText={setAuthorFilter}
                        placeholder="Author"
                    />

                    <Text style={styles.filterLabel}>Publish Year</Text>
                    <TextInput
                        style={styles.filterInput}
                        value={yearFilter}
                        onChangeText={setYearFilter}
                        placeholder="Publish Year"
                        keyboardType="numeric"
                    />

                    <Text style={styles.filterLabel}>Collection</Text>
                    <View style={styles.collectionFilterContainer}>
                        <TouchableOpacity
                            style={[
                                styles.collectionFilterItem,
                                !collectionFilter && styles.collectionFilterItemSelected
                            ]}
                            onPress={() => setCollectionFilter("")}
                        >
                            <Text style={[
                                styles.collectionFilterText,
                                !collectionFilter && styles.collectionFilterTextSelected
                            ]}>
                                All Collections
                            </Text>
                        </TouchableOpacity>
                        {collections.map(collection => (
                            <TouchableOpacity
                                key={collection.id}
                                style={[
                                    styles.collectionFilterItem,
                                    collectionFilter === collection.id && styles.collectionFilterItemSelected
                                ]}
                                onPress={() => setCollectionFilter(collection.id)}
                            >
                                <Text style={[
                                    styles.collectionFilterText,
                                    collectionFilter === collection.id && styles.collectionFilterTextSelected
                                ]}>
                                    {collection.name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <View style={styles.modalButtons}>
                        <Button title="Cancel" onPress={() => setFilterVisible(false)}/>
                        <Button
                            title="Save"
                            onPress={() => {
                                setFilterVisible(false);
                            }}
                        />
                    </View>
                </View>
            </View>
        </Modal>
    );

    // Loading Screen Component
    const LoadingScreen = () => (
        <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6366f1"/>
            <Text style={styles.loadingText}>Loading your library...</Text>
            <Text style={styles.loadingSubText}>Please wait while we fetch your books and collections</Text>
        </View>
    );

    return (
        <View style={{flex: 1, backgroundColor: "#fff"}}>
            {isLoading ? (
                <LoadingScreen/>
            ) : (
                <>
                    {/* Header + Book count + Filter button */}
                    <View style={styles.headerRow}>
                        <Text style={styles.bookCount}>
                            {filteredBooks.length} of {books.length} books
                        </Text>
                        <TouchableOpacity
                            style={styles.filterButton}
                            onPress={() => setFilterVisible(true)}
                        >
                            <Ionicons name="filter" size={20} color="#fff" style={{marginRight: 6}}/>
                            <Text style={styles.filterButtonText}>Filter</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Search bar */}
                    <View style={styles.searchBar}>
                        <Ionicons name="search" size={18} color="#9ca3af"/>
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search books, authors..."
                            placeholderTextColor="#9ca3af"
                            value={search}
                            onChangeText={setSearch}
                        />
                    </View>

                    {/* Filter Tabs */}
                    <View style={{flexDirection: "row", marginHorizontal: 16, marginTop: 16}}>
                        {FILTER_TABS.map((tab) => (
                            <TouchableOpacity
                                key={tab.value}
                                onPress={() => setActiveTab(tab.value)}
                                style={[styles.tab, activeTab === tab.value && styles.tabActive]}
                            >
                                <Text style={{
                                    color: activeTab === tab.value ? "#fff" : "#555",
                                    fontWeight: "bold",
                                    textAlign: "center"
                                }}>
                                    {tab.label} (
                                    {tab.value === "all"
                                        ? books.length
                                        : books.filter((b) => {
                                            if (tab.value === "hardcover") return b.type.toLowerCase() === "hardcover";
                                            if (tab.value === "first") return b.edition.toLowerCase().includes("first");
                                            if (tab.value === "collections") return !!b.collectionId;
                                            return true;
                                        }).length}
                                    )
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Filter Modal */}
                    <FilterModal/>

                    {/* Books */}
                    <ScrollView style={{marginTop: 16, paddingHorizontal: 16}}>
                        {filteredBooks.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Ionicons name="book-outline" size={64} color="#ccc"/>
                                <Text style={styles.emptyText}>No books found</Text>
                                <Text style={styles.emptySubText}>Try adjusting your search or filters</Text>
                            </View>
                        ) : (
                            filteredBooks.map((book) => (
                                <TouchableOpacity
                                    key={book.id}
                                    style={styles.card}
                                    onPress={() => {
                                        // Create proper book data object to pass
                                        const bookData = {
                                            id: book.id,
                                            title: book.title,
                                            authors: book.author,
                                            publisher: book.publisher,
                                            year: book.year,
                                            coverImage: book.image.includes('base64,')
                                                ? book.image.split('base64,')[1]  // Extract only base64 data
                                                : null,
                                            purchasePrice: book.price,
                                            condition: book.condition,
                                            edition: book.edition,
                                            binding: book.type,
                                            acquisitionSource: book.acquisitionSource,
                                            acquisitionDate: book.acquisitionDate,
                                            isbn: book.isbn,
                                            language: book.language,
                                            collectionId: book.collectionId,
                                        };

                                        navigation.navigate("book-detail", {book: JSON.stringify(bookData)});
                                    }}
                                >
                                    <Image source={{uri: book.image}} style={styles.image}/>
                                    <View style={{flex: 1, marginLeft: 12}}>
                                        <Text style={styles.bookTitle}>{book.title}</Text>
                                        <Text style={styles.bookAuthor}>{book.author}</Text>
                                        <Text style={styles.bookPublisher}>
                                            {book.publisher} • {book.year}
                                        </Text>

                                        {/* แสดง Collection name */}
                                        {book.collectionName && (
                                            <View style={styles.collectionBadgeContainer}>
                                                <Ionicons name="folder-outline" size={12} color="#6366f1"/>
                                                <Text style={styles.collectionBadge}>{book.collectionName}</Text>
                                            </View>
                                        )}

                                        <View style={{flexDirection: "row", flexWrap: "wrap", marginTop: 4}}>
                                            {book.edition ? <Text style={styles.badge}>{book.edition}</Text> : null}
                                            {book.type ? <Text style={styles.badge}>{book.type}</Text> : null}
                                            {book.condition ?
                                                <Text style={styles.badgeGreen}>{book.condition}</Text> : null}
                                        </View>
                                        <Text style={styles.price}>฿{book.price}</Text>
                                        {book.shelf && <Text style={styles.shelf}>{book.shelf}</Text>}
                                    </View>

                                    {/* Arrow indicator */}
                                    <View style={styles.arrowContainer}>
                                        <Ionicons name="chevron-forward" size={20} color="#9ca3af"/>
                                    </View>
                                </TouchableOpacity>
                            ))
                        )}
                    </ScrollView>
                </>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    headerRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 8,
        backgroundColor: "#f8f9fa",
    },
    bookCount: {
        fontSize: 16,
        color: "#333",
    },
    filterButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#6366f1",
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
    filterButtonText: {
        color: "#fff",
        fontWeight: "bold",
    },
    searchBar: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#f1f5f9",
        borderRadius: 8,
        marginHorizontal: 16,
        marginTop: 8,
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 16,
        color: "#333",
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: "center",
        borderRadius: 8,
        marginHorizontal: 4,
    },
    tabActive: {
        backgroundColor: "#6366f1",
    },
    modalOverlay: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0, 0, 0, 0.7)",
    },
    modalContent: {
        width: "90%",
        backgroundColor: "#fff",
        borderRadius: 8,
        padding: 16,
        elevation: 4,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 16,
        textAlign: "center",
    },
    filterLabel: {
        fontSize: 14,
        fontWeight: "500",
        marginTop: 12,
        marginBottom: 4,
        color: "#333",
    },
    filterInput: {
        backgroundColor: "#f1f5f9",
        borderRadius: 8,
        paddingVertical: 10,
        paddingHorizontal: 12,
        fontSize: 16,
        color: "#333",
        elevation: 1,
    },
    collectionFilterContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        marginTop: 8,
        borderRadius: 8,
        overflow: "hidden",
        backgroundColor: "#f9fafb",
        elevation: 1,
    },
    collectionFilterItem: {
        flex: 1,
        paddingVertical: 10,
        alignItems: "center",
        borderRadius: 8,
        margin: 4,
        backgroundColor: "#fff",
    },
    collectionFilterItemSelected: {
        backgroundColor: "#6366f1",
    },
    collectionFilterText: {
        color: "#333",
        fontWeight: "500",
    },
    collectionFilterTextSelected: {
        color: "#fff",
        fontWeight: "bold",
    },
    modalButtons: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 16,
    },
    detailImage: {
        width: "100%",
        height: 200,
        borderRadius: 8,
        resizeMode: "cover",
        marginBottom: 12,
    },
    bookTitle: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#111",
    },
    bookAuthor: {
        fontSize: 14,
        color: "#555",
        marginTop: 2,
    },
    bookPublisher: {
        fontSize: 14,
        color: "#555",
        marginTop: 2,
    },
    badge: {
        backgroundColor: "#e0f7fa",
        borderRadius: 12,
        paddingVertical: 4,
        paddingHorizontal: 8,
        fontSize: 12,
        color: "#00796b",
        marginRight: 8,
        marginTop: 4,
    },
    badgeGreen: {
        backgroundColor: "#e8f5e9",
        borderRadius: 12,
        paddingVertical: 4,
        paddingHorizontal: 8,
        fontSize: 12,
        color: "#2e7d32",
        marginRight: 8,
        marginTop: 4,
    },
    price: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#111",
        marginTop: 8,
    },
    shelf: {
        fontSize: 14,
        color: "#777",
        marginTop: 4,
    },
    card: {
        backgroundColor: "#fff",
        borderRadius: 8,
        elevation: 2,
        flexDirection: "row",
        padding: 16,
        marginBottom: 16,
        alignItems: "center",
    },
    image: {
        width: 60,
        height: 90,
        borderRadius: 4,
        resizeMode: "cover",
    },
    arrowContainer: {
        marginLeft: 8,
    },
    collectionBadgeContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#eef2ff",
        borderRadius: 12,
        paddingVertical: 4,
        paddingHorizontal: 8,
        marginTop: 4,
    },
    collectionBadge: {
        fontSize: 12,
        color: "#4f46e5",
        marginLeft: 4,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#fff",
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: "#333",
    },
    loadingSubText: {
        marginTop: 4,
        fontSize: 14,
        color: "#777",
        textAlign: "center",
        paddingHorizontal: 32,
    },
    emptyState: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingVertical: 32,
    },
    emptyText: {
        marginTop: 16,
        fontSize: 18,
        fontWeight: "bold",
        color: "#333",
    },
    emptySubText: {
        marginTop: 8,
        fontSize: 14,
        color: "#777",
        textAlign: "center",
        paddingHorizontal: 32,
    },
});
