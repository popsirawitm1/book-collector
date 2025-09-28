import React, {useState, useCallback} from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    FlatList,
    Image,
    TextInput
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {db} from '../../configs/firebase';
import {collection, query, where, getDocs, deleteDoc, doc, addDoc} from 'firebase/firestore';
import {useAuth} from '../../contexts/AuthContext';
import {CustomAlert} from '../../components/CustomAlert';
import {useFocusEffect} from 'expo-router';

interface WishlistItem {
    id: string;
    isbn13: string;
    title: string;
    author: string;
    publisher?: string;
    year?: string;
    description?: string;
    estimatedValue?: string;
    addedAt: Date;
    source: string;
}

export default function WishlistScreen() {
    const {user} = useAuth();
    const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchText, setSearchText] = useState('');
    const [alert, setAlert] = useState({
        visible: false,
        title: '',
        message: '',
        type: 'info' as 'success' | 'error' | 'warning' | 'info'
    });

    // ฟังก์ชันแสดง alert
    const showAlert = (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
        setAlert({
            visible: true,
            title,
            message,
            type
        });
    };

    // ฟังก์ชันปิด alert
    const hideAlert = () => {
        setAlert(prev => ({...prev, visible: false}));
    };

    // ดึงข้อมูล wishlist จาก Firestore
    const fetchWishlist = async () => {
        if (!user?.uid) return;

        setIsLoading(true);
        try {
            const q = query(
                collection(db, 'books'),
                where('userId', '==', user.uid),
                where('type', '==', 'wishlist')
            );
            const snapshot = await getDocs(q);

            const items: WishlistItem[] = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                items.push({
                    id: doc.id,
                    isbn13: data.isbn13 || '',
                    title: data.title || 'Unknown Title',
                    author: data.author || 'Unknown Author',
                    publisher: data.publisher,
                    year: data.year,
                    description: data.description,
                    estimatedValue: data.estimatedValue,
                    addedAt: data.addedAt?.toDate() || new Date(),
                    source: data.source || 'unknown'
                });
            });

            // เรียงตามวันที่เพิ่ม (ใหม่สุดก่อน)
            items.sort((a, b) => b.addedAt.getTime() - a.addedAt.getTime());
            setWishlistItems(items);

        } catch (error) {
            console.error('Error fetching wishlist:', error);
            showAlert('Error', 'Failed to load wishlist items.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    // รีเฟรชข้อมูลทุกครั้งที่เข้าหน้า
    useFocusEffect(
        useCallback(() => {
            fetchWishlist();
        }, [user?.uid])
    );

    // ลบ item จาก wishlist
    const removeFromWishlist = async (item: WishlistItem) => {
        try {
            await deleteDoc(doc(db, 'books', item.id));
            setWishlistItems(prev => prev.filter(w => w.id !== item.id));
            showAlert('Removed', `"${item.title}" has been removed from your wishlist.`, 'success');
        } catch (error) {
            console.error('Error removing from wishlist:', error);
            showAlert('Error', 'Failed to remove item from wishlist.', 'error');
        }
    };

    // เพิ่มจาก wishlist ไปเป็น collection จริง
    const addToCollection = async (item: WishlistItem) => {
        try {
            // เพิ่มเป็นหนังสือจริงในคอลเลคชัน
            await addDoc(collection(db, 'books'), {
                userId: user?.uid,
                isbn: item.isbn13,
                title: item.title,
                authors: item.author,
                publisher: item.publisher || '',
                year: item.year || '',
                language: 'English',
                binding: 'Unknown',
                acquisitionSource: 'From Wishlist',
                acquisitionDate: new Date().toLocaleDateString('en-US'),
                purchasePrice: '',
                coverImage: null,
                collectionId: '',
                createdAt: new Date(),
                // ไม่มี type หรือ type: undefined = หนังสือจริงในคอลเลคชัน
            });

            // ลบจาก wishlist
            await deleteDoc(doc(db, 'books', item.id));
            setWishlistItems(prev => prev.filter(w => w.id !== item.id));

            showAlert('Added to Collection', `"${item.title}" has been moved to your collection.`, 'success');
        } catch (error) {
            console.error('Error adding to collection:', error);
            showAlert('Error', 'Failed to add to collection.', 'error');
        }
    };

    // กรองรายการตามการค้นหา
    const filteredItems = wishlistItems.filter(item =>
        item.title.toLowerCase().includes(searchText.toLowerCase()) ||
        item.author.toLowerCase().includes(searchText.toLowerCase()) ||
        (item.publisher && item.publisher.toLowerCase().includes(searchText.toLowerCase()))
    );

    const renderWishlistItem = ({item}: { item: WishlistItem }) => (
        <View style={styles.wishlistCard}>
            <View style={styles.itemHeader}>
                <View style={styles.itemInfo}>
                    <Text style={styles.itemTitle} numberOfLines={2}>{item.title}</Text>
                    <Text style={styles.itemAuthor}>{item.author}</Text>
                    {item.publisher && (
                        <Text style={styles.itemMeta}>{item.publisher}{item.year && ` • ${item.year}`}</Text>
                    )}
                    {item.estimatedValue && (
                        <Text style={styles.itemValue}>
                            <Ionicons name="pricetag-outline" size={12} color="#16a34a"/>
                            {' '}Est. Value: {item.estimatedValue}
                        </Text>
                    )}
                    <Text style={styles.itemDate}>
                        Added {item.addedAt.toLocaleDateString()} from {item.source}
                    </Text>
                </View>
                <View style={styles.itemActions}>
                    <TouchableOpacity
                        style={[styles.actionButton, styles.addButton]}
                        onPress={() => addToCollection(item)}
                    >
                        <Ionicons name="library-outline" size={16} color="#fff"/>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.actionButton, styles.removeButton]}
                        onPress={() => removeFromWishlist(item)}
                    >
                        <Ionicons name="trash-outline" size={16} color="#fff"/>
                    </TouchableOpacity>
                </View>
            </View>

            {item.description && (
                <Text style={styles.itemDescription} numberOfLines={3}>
                    {item.description}
                </Text>
            )}
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <Text style={styles.headerTitle}>
                        <Ionicons name="bookmark" size={24} color="#6366f1"/>
                        {' '}My Wishlist
                    </Text>
                    <Text style={styles.headerCount}>{wishlistItems.length} items</Text>
                </View>

                {/* Search Bar */}
                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color="#6b7280" style={styles.searchIcon}/>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search wishlist..."
                        placeholderTextColor="#9ca3af"
                        value={searchText}
                        onChangeText={setSearchText}
                    />
                    {searchText.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchText('')} style={styles.clearButton}>
                            <Ionicons name="close-circle" size={20} color="#6b7280"/>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Content */}
            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#6366f1"/>
                    <Text style={styles.loadingText}>Loading your wishlist...</Text>
                </View>
            ) : filteredItems.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="bookmark-outline" size={64} color="#d1d5db"/>
                    <Text style={styles.emptyTitle}>
                        {searchText ? 'No matching items found' : 'Your wishlist is empty'}
                    </Text>
                    <Text style={styles.emptyDescription}>
                        {searchText
                            ? 'Try adjusting your search terms'
                            : 'Add books from recommendations to start building your wishlist'
                        }
                    </Text>
                    {searchText && (
                        <TouchableOpacity
                            style={styles.clearSearchButton}
                            onPress={() => setSearchText('')}
                        >
                            <Text style={styles.clearSearchText}>Clear search</Text>
                        </TouchableOpacity>
                    )}
                </View>
            ) : (
                <FlatList
                    data={filteredItems}
                    keyExtractor={(item) => item.id}
                    renderItem={renderWishlistItem}
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                />
            )}

            {/* Custom Alert */}
            {alert.visible && (
                <CustomAlert
                    visible={alert.visible}
                    title={alert.title}
                    message={alert.message}
                    type={alert.type}
                    onClose={hideAlert}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9fafb'
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
        marginBottom: 16
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
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f9fafb',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        paddingHorizontal: 12
    },
    searchIcon: {
        marginRight: 8
    },
    searchInput: {
        flex: 1,
        paddingVertical: 12,
        fontSize: 16,
        color: '#111827'
    },
    clearButton: {
        padding: 4
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16
    },
    loadingText: {
        fontSize: 16,
        color: '#6b7280'
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
        gap: 16
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#374151',
        textAlign: 'center'
    },
    emptyDescription: {
        fontSize: 16,
        color: '#6b7280',
        textAlign: 'center',
        lineHeight: 24
    },
    clearSearchButton: {
        marginTop: 8,
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#6366f1',
        borderRadius: 8
    },
    clearSearchText: {
        color: '#fff',
        fontWeight: '500'
    },
    listContainer: {
        padding: 16,
        gap: 12
    },
    wishlistCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 1},
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#f3f4f6'
    },
    itemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    itemInfo: {
        flex: 1,
        marginRight: 12
    },
    itemTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 4
    },
    itemAuthor: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 2
    },
    itemMeta: {
        fontSize: 12,
        color: '#9ca3af',
        marginBottom: 4
    },
    itemValue: {
        fontSize: 12,
        color: '#16a34a',
        fontWeight: '500',
        marginBottom: 4
    },
    itemDate: {
        fontSize: 11,
        color: '#9ca3af',
        fontStyle: 'italic'
    },
    itemActions: {
        flexDirection: 'row',
        gap: 8
    },
    actionButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center'
    },
    addButton: {
        backgroundColor: '#16a34a'
    },
    removeButton: {
        backgroundColor: '#dc2626'
    },
    itemDescription: {
        fontSize: 13,
        color: '#4b5563',
        marginTop: 12,
        lineHeight: 18
    }
});
