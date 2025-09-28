import React, {useState, useEffect} from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    Switch,
    FlatList,
    Linking
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {openRouterAIService} from '../../services/aiRecommendationService';
import {db} from '../../configs/firebase';
import {addDoc, collection, query, where, getDocs} from 'firebase/firestore';
import {useAuth} from '../../contexts/AuthContext';
import {CustomAlert} from '../../components/CustomAlert';
import {useFocusEffect} from 'expo-router';

interface Recommendation {
    isbn13: string;
    title?: string;
    author?: string;
    publisher?: string;
    year?: string;
    description?: string;
    estimated_value?: string;
    availability?: string;
    sources_used?: string;

    [k: string]: any;
}

interface SearchSource {
    url: string;
    title: string;
    content?: string;
    start_index: number;
    end_index: number;
}

interface RecommendationResponse {
    recommendations: Recommendation[];
    search_sources?: SearchSource[];
    search_enabled?: boolean;
}

interface RecommendationsScreenProps {
    onGenerateRecs: (mode: 'collection' | 'taste', filters?: any) => void;
}

// เพิ่ม interface สำหรับหนังสือ
interface Book {
    id: string;
    title: string;
    authors: string;
    publisher?: string;
    year?: string;
    binding?: string;
    language?: string;
    edition?: string;
    purchasePrice?: number;
}

// เพิ่ม interface สำหรับสถิติคอลเลคชัน
interface CollectionAnalysis {
    totalBooks: number;
    topAuthors: string[];
    topPublishers: string[];
    commonYearRanges: string[];
    preferredBindings: string[];
    commonLanguages: string[];
    avgPrice: number;
    hasFirstEditions: boolean;
}

export const RecommendationsScreen: React.FC<RecommendationsScreenProps> = ({onGenerateRecs}) => {
    const {user} = useAuth();
    const [activeMode, setActiveMode] = useState<'collection' | 'taste'>('collection');
    const [tasteInput, setTasteInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
    const [searchSources, setSearchSources] = useState<SearchSource[]>([]);
    const [error, setError] = useState('');
    const [collectionAnalysis, setCollectionAnalysis] = useState<CollectionAnalysis | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [filters, setFilters] = useState({
        years: '',
        binding: '',
        language: '',
        publisher: '',
        firstEdition: false
    });

    // State สำหรับ CustomAlert
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

    // ฟังก์ชันตรวจสอบและเปิด URL
    const isValidUrl = (string: string): boolean => {
        try {
            const url = new URL(string);
            return url.protocol === 'http:' || url.protocol === 'https:';
        } catch {
            return false;
        }
    };

    // ฟังก์ชันดึงและวิเคราะห์คอลเลคชัน
    const fetchAndAnalyzeCollection = async (): Promise<CollectionAnalysis | null> => {
        if (!user?.uid) return null;

        setIsAnalyzing(true);
        try {
            const q = query(collection(db, "books"), where("userId", "==", user.uid));
            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                throw new Error('No books found in your collection');
            }

            const books: Book[] = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                // เฉพาะหนังสือจริง ไม่รวม wishlist
                if (!data.type || data.type !== 'wishlist') {
                    books.push({
                        id: doc.id,
                        title: data.title || 'Unknown',
                        authors: data.authors || 'Unknown',
                        publisher: data.publisher,
                        year: data.year,
                        binding: data.binding,
                        language: data.language,
                        edition: data.edition,
                        purchasePrice: data.purchasePrice || data.price || 0
                    });
                }
            });

            // วิเคราะห์ข้อมูล
            const analysis = analyzeCollection(books);
            setCollectionAnalysis(analysis);
            return analysis;

        } catch (error) {
            console.error('Error fetching collection:', error);
            throw error;
        } finally {
            setIsAnalyzing(false);
        }
    };

    // ฟังก์ชันวิเคราะห์คอลเลคชัน
    const analyzeCollection = (books: Book[]): CollectionAnalysis => {
        const authorCount: Record<string, number> = {};
        const publisherCount: Record<string, number> = {};
        const yearRanges: string[] = [];
        const bindings: string[] = [];
        const languages: string[] = [];
        let totalPrice = 0;
        let priceCount = 0;
        let hasFirstEditions = false;

        books.forEach(book => {
            // นับ authors
            if (book.authors && book.authors !== 'Unknown') {
                const authors = book.authors.split(',').map(a => a.trim());
                authors.forEach(author => {
                    authorCount[author] = (authorCount[author] || 0) + 1;
                });
            }

            // นับ publishers
            if (book.publisher) {
                publisherCount[book.publisher] = (publisherCount[book.publisher] || 0) + 1;
            }

            // เก็บปี
            if (book.year) {
                const year = parseInt(book.year);
                if (!isNaN(year)) {
                    // แบ่งเป็นช่วงทศวรรษ
                    const decade = Math.floor(year / 10) * 10;
                    const range = `${decade}s`;
                    if (!yearRanges.includes(range)) {
                        yearRanges.push(range);
                    }
                }
            }

            // เก็บ binding
            if (book.binding) {
                if (!bindings.includes(book.binding)) {
                    bindings.push(book.binding);
                }
            }

            // เก็บภาษา
            if (book.language) {
                if (!languages.includes(book.language)) {
                    languages.push(book.language);
                }
            }

            // คำนวณราคา
            if (book.purchasePrice && book.purchasePrice > 0) {
                totalPrice += book.purchasePrice;
                priceCount++;
            }

            // ตรวจสอบ first edition
            if (book.edition && book.edition.toLowerCase().includes('first')) {
                hasFirstEditions = true;
            }
        });

        // เรียงลำดับและเอาอันดับต้นๆ
        const topAuthors = Object.entries(authorCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([author]) => author);

        const topPublishers = Object.entries(publisherCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([publisher]) => publisher);

        return {
            totalBooks: books.length,
            topAuthors,
            topPublishers,
            commonYearRanges: yearRanges.slice(0, 3),
            preferredBindings: bindings.slice(0, 2),
            commonLanguages: languages.slice(0, 2),
            avgPrice: priceCount > 0 ? totalPrice / priceCount : 0,
            hasFirstEditions
        };
    };

    // อัปเดต mockAPI ให้ใช้ข้อมูลจริง
    const mockAPI = {
        getRecommendations: async (mode: string, target: any): Promise<RecommendationResponse> => {
            let analysisData = target;

            // ถ้าเป็น collection mode ให้ใช้ข้อมูลจากคอลเลคชัน
            if (mode === 'AUTO') {
                const analysis = collectionAnalysis || await fetchAndAnalyzeCollection();
                if (!analysis) {
                    throw new Error('Unable to analyze your collection');
                }

                // ดึงข้อมูลละเอียดจากคอลเลคชัน
                const detailedData = await getDetailedCollectionData();

                // สร้าง context จากคอลเลคชัน
                analysisData = {
                    collectionSize: analysis.totalBooks,
                    favoriteAuthors: analysis.topAuthors,
                    preferredPublishers: analysis.topPublishers,
                    commonYears: analysis.commonYearRanges,
                    preferredBinding: analysis.preferredBindings,
                    languages: analysis.commonLanguages,
                    hasFirstEditions: analysis.hasFirstEditions,
                    bookTitles: detailedData.bookTitles || [],
                    sampleAuthors: detailedData.sampleAuthors || [],
                    samplePublishers: detailedData.samplePublishers || [],
                    sampleLanguages: detailedData.sampleLanguages || [],
                    sampleYears: detailedData.sampleYears || [],
                    sampleBindings: detailedData.sampleBindings || [],
                    ...target // รวม filters ที่ผู้ใช้เลือก
                };
            }

            // เรียก OpenRouter AI - ไม่มี fallback
            const result = await openRouterAIService.getRecommendations(mode, analysisData);

            // เก็บ search sources แยก
            if (result.search_sources) {
                setSearchSources(result.search_sources);
            }

            return result;
        }
    };

    // เพิ่มฟังก์ชันดึงข้อมูลละเอียดจากคอลเลคชัน
    const getDetailedCollectionData = async () => {
        if (!user?.uid) return {};

        try {
            const q = query(collection(db, "books"), where("userId", "==", user.uid));
            const snapshot = await getDocs(q);

            const titles: string[] = [];
            const allAuthors: string[] = [];
            const allPublishers: string[] = [];
            const allLanguages: string[] = [];
            const allYears: string[] = [];
            const allBindings: string[] = [];

            snapshot.forEach((doc) => {
                const data = doc.data();
                // เฉพาะหนังสือจริง ไม่รวม wishlist
                if (!data.type || data.type !== 'wishlist') {
                    if (data.title) {
                        titles.push(data.title);
                    }

                    // เก็บ authors
                    if (data.authors) {
                        const authors = data.authors.split(',').map((a: string) => a.trim());
                        allAuthors.push(...authors);
                    }

                    // เก็บ publishers
                    if (data.publisher) {
                        allPublishers.push(data.publisher);
                    }

                    // เก็บ languages
                    if (data.language) {
                        allLanguages.push(data.language);
                    }

                    // เก็บ years
                    if (data.year) {
                        allYears.push(data.year);
                    }

                    // เก็บ bindings
                    if (data.binding) {
                        allBindings.push(data.binding);
                    }
                }
            });

            return {
                bookTitles: titles.slice(0, 8), // ส่งไปให้ AI ดู
                sampleAuthors: [...new Set(allAuthors)].slice(0, 8),
                samplePublishers: [...new Set(allPublishers)].slice(0, 5),
                sampleLanguages: [...new Set(allLanguages)],
                sampleYears: [...new Set(allYears)].slice(0, 8),
                sampleBindings: [...new Set(allBindings)]
            };
        } catch (error) {
            console.error('Error getting detailed collection data:', error);
            return {};
        }
    };

    // โหลดข้อมูลคอลเลคชันเมื่อเข้าหน้า collection mode
    useEffect(() => {
        if (activeMode === 'collection' && user?.uid && !collectionAnalysis) {
            fetchAndAnalyzeCollection().catch(err => {
                console.error('Failed to analyze collection:', err);
                setError(err.message || 'Failed to analyze your collection');
            });
        }
    }, [activeMode, user?.uid]);

    // รีเฟรชข้อมูลทุกครั้งที่เข้าหน้า
    useFocusEffect(
        React.useCallback(() => {
            if (activeMode === 'collection' && user?.uid) {
                fetchAndAnalyzeCollection().catch(err => {
                    console.error('Failed to analyze collection:', err);
                    setError(err.message || 'Failed to analyze your collection');
                });
            }
        }, [activeMode, user?.uid])
    );

    const handleGenerate = async () => {
        setIsLoading(true);
        setError('');
        try {
            const target = activeMode === 'taste' ? {taste: tasteInput, ...filters} : filters;
            const result = await mockAPI.getRecommendations(
                activeMode === 'collection' ? 'AUTO' : 'MANUAL',
                target
            );
            setRecommendations(result.recommendations || []);
            onGenerateRecs(activeMode, target);
        } catch (e: any) {
            setError(e?.message || 'Failed to generate recommendations');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async (isbn: string) => {
        try {
            const book = recommendations.find(r => r.isbn13 === isbn);
            if (!book || !user?.uid) {
                console.log('Missing book or user:', {book: !!book, userId: user?.uid});
                return;
            }

            console.log('Attempting to save book to wishlist:', {
                userId: user.uid,
                isbn13: isbn,
                title: book.title
            });

            // ตรวจสอบว่ามีอยู่ใน collection "books" ที่มี type = 'wishlist' แล้วหรือไม่
            const q = query(
                collection(db, 'books'),
                where('userId', '==', user.uid),
                where('isbn13', '==', isbn),
                where('type', '==', 'wishlist')
            );
            const existingBooks = await getDocs(q);

            if (!existingBooks.empty) {
                showAlert('Already in Wishlist', `${book.title} is already in your wishlist.`, 'warning');
                return;
            }

            // บันทึกลง collection "books" ด้วย type = 'wishlist'
            const wishlistData = {
                userId: user.uid,
                isbn13: isbn,
                title: book.title || 'Unknown Title',
                author: book.author || 'Unknown Author',
                publisher: book.publisher,
                year: book.year,
                description: book.description,
                estimatedValue: book.estimated_value,
                addedAt: new Date(),
                source: 'recommendations',
                type: 'wishlist' // เพิ่ม type เพื่อแยกจาก books ทั่วไป
            };

            console.log('Saving wishlist data:', wishlistData);

            await addDoc(collection(db, 'books'), wishlistData);

            console.log('Successfully saved to wishlist');
            showAlert('Added to Wishlist', `${book.title} has been added to your wishlist.`, 'success');
        } catch (error: any) {
            console.error('Error adding to wishlist:', error);
            console.error('Error code:', error.code);
            console.error('Error message:', error.message);

            // แสดงข้อความ error ที่เป็นมิตรกับผู้ใช้มากขึ้น
            let errorMessage = 'Failed to add to wishlist. Please try again.';

            if (error.code === 'permission-denied') {
                errorMessage = 'Permission denied. Please make sure you are logged in and try again.';
            } else if (error.code === 'unavailable') {
                errorMessage = 'Service temporarily unavailable. Please try again later.';
            }

            showAlert('Error', errorMessage, 'error');
        }
    };

    const handleHide = (isbn: string) => {
        setRecommendations(prev => prev.filter(r => r.isbn13 !== isbn));
    };

    const handleOpenURL = (url: string) => {
        // ตรวจสอบว่า URL ถูกต้องหรือไม่
        if (!url || !isValidUrl(url)) {
            showAlert(
                'Invalid Link',
                'The provided link is not a valid URL. Please check the source information.',
                'error'
            );
            return;
        }

        // เปิด URL ในเบราว์เซอร์ภายนอก
        Linking.openURL(url).catch(err => {
            console.error('Failed to open URL:', err);
            showAlert(
                'Cannot Open Link',
                'Unable to open the link. Please make sure you have a web browser installed and try again.',
                'error'
            );
        });
    };

    const renderRecommendation = ({item}: { item: Recommendation }) => (
        <View style={styles.recCard}>
            <View style={styles.recHeader}>
                <Text style={styles.recTitle}>{item.title || 'Unknown Title'}</Text>
                <TouchableOpacity onPress={() => handleHide(item.isbn13)}>
                    <Ionicons name="close" size={18} color="#888"/>
                </TouchableOpacity>
            </View>

            {item.author && <Text style={styles.recMeta}>{item.author}</Text>}

            <Text style={styles.recMeta}>
                {item.publisher ? `${item.publisher}` : ''}{item.year ? ` • ${item.year}` : ''}
            </Text>

            {/* เพิ่มข้อมูล market value และ availability */}
            {item.estimated_value && (
                <Text style={styles.recValue}>
                    <Ionicons name="pricetag-outline" size={12} color="#16a34a"/>
                    {' '}Market Value: {item.estimated_value}
                </Text>
            )}

            {item.availability && (
                <Text style={styles.recAvailability}>
                    <Ionicons name="storefront-outline" size={12} color="#2563eb"/>
                    {' '}{item.availability}
                </Text>
            )}

            {item.description && (
                <Text style={styles.recDesc} numberOfLines={4}>
                    {item.description}
                </Text>
            )}

            {/* แสดงว่าข้อมูลมาจาก web search */}
            {item.sources_used && (
                <Text style={styles.recSources}>
                    <Ionicons name="globe-outline" size={12} color="#6b7280"/>
                    {' '}Sources: {item.sources_used}
                </Text>
            )}

            <View style={styles.recActions}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleSave(item.isbn13)}>
                    <Ionicons name="bookmark-outline" size={16} color="#2563eb"/>
                    <Text style={styles.actionText}>Add to Wishlist</Text>
                </TouchableOpacity>
                {/* ปุ่มเปิดลิงก์ */}
                {item.sources_used && (
                    <TouchableOpacity style={styles.actionBtn} onPress={() => handleOpenURL(item.sources_used!)}>
                        <Ionicons name="link-outline" size={16} color="#3b82f6"/>
                        <Text style={styles.actionText}>View Source</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );

    return (
        <View style={{flex: 1, backgroundColor: "#f9fafb"}}>
            {/* Header with consistent theme */}
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <Text style={styles.headerTitle}>
                        <Ionicons name="bulb" size={24} color="#6366f1"/>
                        {' '}Recommendations
                    </Text>
                    <Text style={styles.headerCount}>
                        {recommendations.length} suggestions
                    </Text>
                </View>
            </View>

            <ScrollView style={{paddingHorizontal: 4}} contentContainerStyle={styles.content}>
                {/* Header Card */}
                <View style={styles.card}>
                    <Text style={styles.paragraph}>
                        Get personalized book recommendations based on your collection or specify your taste
                        preferences.
                        All recommendations are verified with web search.
                    </Text>

                    {/* Tabs */}
                    <View style={styles.tabsRow}>
                        <TouchableOpacity
                            style={[styles.tabBtn, activeMode === 'collection' && styles.tabBtnActive]}
                            onPress={() => setActiveMode('collection')}
                        >
                            <Text style={[styles.tabText, activeMode === 'collection' && styles.tabTextActive]}>
                                From My Collection
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.tabBtn, activeMode === 'taste' && styles.tabBtnActive]}
                            onPress={() => setActiveMode('taste')}
                        >
                            <Text style={[styles.tabText, activeMode === 'taste' && styles.tabTextActive]}>
                                From My Taste
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {activeMode === 'collection' && (
                        <View style={styles.infoBox}>
                            <Text style={styles.infoTitle}>Based on Your Collection</Text>
                            <Text style={styles.infoText}>
                                We analyze authors, publishers, and time periods in your books to suggest new titles.
                            </Text>

                            {/* แสดงสถานะการวิเคราะห์ */}
                            {isAnalyzing && (
                                <View style={styles.analysisStatus}>
                                    <ActivityIndicator size="small" color="#6366f1" style={{marginRight: 8}}/>
                                    <Text style={styles.analysisText}>Analyzing your collection...</Text>
                                </View>
                            )}

                            {/* แสดงผลการวิเคราะห์ */}
                            {collectionAnalysis && !isAnalyzing && (
                                <View style={styles.analysisResult}>
                                    <View style={styles.analysisRow}>
                                        <Ionicons name="library-outline" size={14} color="#6366f1"/>
                                        <Text style={styles.analysisDetailText}>
                                            {collectionAnalysis.totalBooks} books analyzed
                                        </Text>
                                    </View>

                                    {collectionAnalysis.topAuthors.length > 0 && (
                                        <View style={styles.analysisRow}>
                                            <Ionicons name="person-outline" size={14} color="#6366f1"/>
                                            <Text style={styles.analysisDetailText}>
                                                Top authors: {collectionAnalysis.topAuthors.slice(0, 3).join(', ')}
                                            </Text>
                                        </View>
                                    )}

                                    {collectionAnalysis.topPublishers.length > 0 && (
                                        <View style={styles.analysisRow}>
                                            <Ionicons name="business-outline" size={14} color="#6366f1"/>
                                            <Text style={styles.analysisDetailText}>
                                                Publishers: {collectionAnalysis.topPublishers.join(', ')}
                                            </Text>
                                        </View>
                                    )}

                                    {collectionAnalysis.commonYearRanges.length > 0 && (
                                        <View style={styles.analysisRow}>
                                            <Ionicons name="calendar-outline" size={14} color="#6366f1"/>
                                            <Text style={styles.analysisDetailText}>
                                                Common periods: {collectionAnalysis.commonYearRanges.join(', ')}
                                            </Text>
                                        </View>
                                    )}

                                    {collectionAnalysis.hasFirstEditions && (
                                        <View style={styles.analysisRow}>
                                            <Ionicons name="star-outline" size={14} color="#eab308"/>
                                            <Text style={styles.analysisDetailText}>
                                                Includes first editions
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            )}
                        </View>
                    )}

                    {activeMode === 'taste' && (
                        <View style={{marginTop: 12}}>
                            <Text style={styles.label}>Describe what you&apos;re looking for:</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g., Hardcover, first editions, Japanese 1950-1985, Shinchōsha"
                                placeholderTextColor="#999"
                                value={tasteInput}
                                onChangeText={setTasteInput}
                                multiline
                            />
                            <Text style={styles.hint}>
                                Be specific about genres, time periods, publishers, binding types, or languages
                            </Text>
                        </View>
                    )}

                    {/* Filters */}
                    <View style={styles.filterGrid}>
                        <TextInput
                            style={styles.input}
                            placeholder="Year range (e.g., 1950-1985)"
                            placeholderTextColor="#999"
                            value={filters.years}
                            onChangeText={(v) => setFilters(p => ({...p, years: v}))}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Publisher"
                            placeholderTextColor="#999"
                            value={filters.publisher}
                            onChangeText={(v) => setFilters(p => ({...p, publisher: v}))}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Language"
                            placeholderTextColor="#999"
                            value={filters.language}
                            onChangeText={(v) => setFilters(p => ({...p, language: v}))}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Binding type"
                            placeholderTextColor="#999"
                            value={filters.binding}
                            onChangeText={(v) => setFilters(p => ({...p, binding: v}))}
                        />
                    </View>

                    <View style={styles.actionsRow}>
                        <View style={styles.switchRow}>
                            <Text style={styles.switchLabel}>First editions only</Text>
                            <Switch
                                value={filters.firstEdition}
                                onValueChange={(val) => setFilters(p => ({...p, firstEdition: val}))}
                            />
                        </View>
                        <TouchableOpacity
                            style={[styles.primaryBtn, (isLoading || (activeMode === 'taste' && !tasteInput.trim())) && styles.btnDisabled]}
                            disabled={isLoading || (activeMode === 'taste' && !tasteInput.trim())}
                            onPress={handleGenerate}
                        >
                            {isLoading ? (
                                <>
                                    <ActivityIndicator size="small" color="#fff" style={{marginRight: 0}}/>
                                    <Text style={styles.primaryBtnText}>Generating...</Text>
                                </>
                            ) : (
                                <>
                                    <Ionicons name="sparkles" size={16} color="#fff" style={{marginRight: 0}}/>
                                    <Text style={styles.primaryBtnText}> Recommendations</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Error */}
                {!!error && (
                    <View style={styles.errorBox}>
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                )}

                {/* Recommendations */}
                {recommendations.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Books for You </Text>
                            <View style={styles.badgeRow}>
                                <View style={styles.badge}>
                                    <Ionicons name="sparkles" size={12} color="#6366f1"/>
                                    <Text style={styles.badgeText}>AI Generated</Text>
                                </View>
                                <View style={styles.costBadge}>
                                    <Ionicons name="leaf" size={12} color="#16a34a"/>
                                    <Text style={styles.costBadgeText}>Cost Optimized</Text>
                                </View>
                            </View>
                        </View>

                        <FlatList
                            data={recommendations}
                            keyExtractor={(item) => item.isbn13}
                            renderItem={renderRecommendation}
                            scrollEnabled={false}
                            contentContainerStyle={{gap: 12}}
                        />

                        <View style={styles.verifyCard}>
                            <Ionicons name="shield-checkmark" size={22} color="#16a34a"/>
                            <View style={{flex: 1}}>
                                <Text style={styles.verifyTitle}>Web search verified • Cost optimized</Text>
                                <Text style={styles.verifyDesc}>
                                    All recommendations verified with current market data using efficient native search.
                                </Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* Web Search Sources */}
                {searchSources.length > 0 && (
                    <View style={styles.sourcesSection}>
                        <Text style={styles.sourcesTitle}>
                            <Ionicons name="globe" size={16} color="#6366f1"/> Web Search Sources
                        </Text>
                        {searchSources.slice(0, 5).map((source, index) => (
                            <TouchableOpacity
                                key={index}
                                style={styles.sourceItem}
                                onPress={() => handleOpenURL(source.url)}
                            >
                                <Text style={styles.sourceTitle}>{source.title}</Text>
                                <Text style={styles.sourceUrl}>{source.url}</Text>
                                <Ionicons name="open-outline" size={12} color="#6366f1"
                                          style={{position: 'absolute', right: 8, top: 8}}/>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {/* Empty */}
                {recommendations.length === 0 && !error && (
                    <View style={styles.emptyState}>
                        <Ionicons name="book-outline" size={48} color="#888"/>
                        <Text style={styles.emptyTitle}>No recommendations yet</Text>
                        <Text style={styles.emptyDesc}>
                            {activeMode === 'collection'
                                ? 'Generate recommendations based on your current collection.'
                                : 'Describe your taste to receive personalized suggestions.'}
                        </Text>
                    </View>
                )}

                {/* Custom Alert */}
                {alert.visible && (
                    <CustomAlert
                        title={alert.title}
                        message={alert.message}
                        type={alert.type}
                        onClose={hideAlert}
                    />
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {flex: 1, backgroundColor: '#ffffff'},
    content: {padding: 16, paddingBottom: 48, gap: 16},
    card: {backgroundColor: '#ffffff', borderRadius: 12, padding: 16, gap: 12, borderWidth: 1, borderColor: '#e5e7eb'},
    cardTitle: {fontSize: 18, fontWeight: '600', color: '#111827'},
    paragraph: {fontSize: 13, lineHeight: 18, color: '#6b7280'},
    tabsRow: {flexDirection: 'row', gap: 8, marginTop: 4},
    tabBtn: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 8,
        backgroundColor: '#f3f4f6',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e5e7eb'
    },
    tabBtnActive: {backgroundColor: '#3b82f6', borderColor: '#3b82f6'},
    tabText: {fontSize: 12, fontWeight: '500', color: '#6b7280'},
    tabTextActive: {color: '#ffffff'},
    infoBox: {backgroundColor: '#f9fafb', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb'},
    infoTitle: {fontSize: 14, fontWeight: '600', color: '#111827', marginBottom: 4},
    infoText: {fontSize: 12, lineHeight: 17, color: '#6b7280'},
    label: {fontSize: 13, fontWeight: '600', color: '#111827', marginBottom: 6},
    hint: {fontSize: 11, color: '#9ca3af', marginTop: 4},
    input: {
        backgroundColor: '#ffffff',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        color: '#111827',
        fontSize: 13,
        borderWidth: 1,
        borderColor: '#d1d5db'
    },
    filterGrid: {flexDirection: 'row', flexWrap: 'wrap', columnGap: 12, rowGap: 12, marginTop: 16},
    actionsRow: {flexDirection: 'row', alignItems: 'center', marginTop: 16, justifyContent: 'space-between'},
    switchRow: {flexDirection: 'row', alignItems: 'center', gap: 8},
    switchLabel: {fontSize: 13, color: '#111827'},
    primaryBtn: {
        flexDirection: 'row',
        backgroundColor: '#6366f1',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center'
    },
    btnDisabled: {opacity: 0.5},
    primaryBtnText: {color: '#ffffff', fontSize: 13, fontWeight: '600'},
    errorBox: {backgroundColor: '#fef2f2', borderColor: '#fecaca', borderWidth: 1, padding: 12, borderRadius: 8},
    errorText: {color: '#dc2626', fontSize: 13},
    section: {gap: 16},
    sectionHeader: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
    sectionTitle: {fontSize: 16, fontWeight: '600', color: '#111827'},
    badgeRow: {
        flexDirection: 'row',
        gap: 8
    },
    badge: {
        flexDirection: 'row',
        gap: 4,
        backgroundColor: '#f3f4f6',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e5e7eb'
    },
    costBadge: {
        flexDirection: 'row',
        gap: 4,
        backgroundColor: '#f0fdf4',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#bbf7d0'
    },
    badgeText: {fontSize: 11, color: '#6b7280'},
    costBadgeText: {
        fontSize: 11,
        color: '#16a34a',
        fontWeight: '600'
    },
    recCard: {backgroundColor: '#ffffff', padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#e5e7eb'},
    recHeader: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
    recTitle: {fontSize: 15, fontWeight: '600', color: '#111827', flex: 1, paddingRight: 8},
    recMeta: {fontSize: 12, color: '#6b7280', marginTop: 2},
    recValue: {
        fontSize: 12,
        color: '#16a34a',
        fontWeight: '600',
        marginTop: 4
    },
    recAvailability: {
        fontSize: 12,
        color: '#2563eb',
        marginTop: 2
    },
    recDesc: {fontSize: 12, color: '#374151', marginTop: 8, lineHeight: 17},
    recSources: {
        fontSize: 11,
        color: '#6b7280',
        marginTop: 4,
        fontStyle: 'italic'
    },
    recActions: {flexDirection: 'row', gap: 12, marginTop: 12},
    actionBtn: {
        flexDirection: 'row',
        gap: 6,
        backgroundColor: '#f9fafb',
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: 8,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e5e7eb'
    },
    actionText: {fontSize: 11, fontWeight: '600', color: '#374151'},
    verifyCard: {
        flexDirection: 'row',
        gap: 12,
        backgroundColor: '#f0fdf4',
        padding: 14,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 8,
        borderWidth: 1,
        borderColor: '#bbf7d0'
    },
    verifyTitle: {fontSize: 14, fontWeight: '600', color: '#111827'},
    verifyDesc: {fontSize: 12, color: '#6b7280', marginTop: 2},
    sourcesSection: {
        backgroundColor: '#f8fafc',
        padding: 14,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#e2e8f0'
    },
    sourcesTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 8
    },
    sourceItem: {
        paddingVertical: 6,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb'
    },
    sourceTitle: {
        fontSize: 12,
        fontWeight: '500',
        color: '#111827'
    },
    sourceUrl: {
        fontSize: 11,
        color: '#6b7280',
        marginTop: 2
    },
    emptyState: {alignItems: 'center', paddingVertical: 48, gap: 12},
    emptyTitle: {fontSize: 16, fontWeight: '600', color: '#111827'},
    emptyDesc: {fontSize: 13, color: '#6b7280', textAlign: 'center', paddingHorizontal: 24},
    analysisStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        paddingVertical: 8
    },
    analysisText: {
        fontSize: 12,
        color: '#6366f1',
        fontStyle: 'italic'
    },
    analysisResult: {
        marginTop: 8,
        gap: 6
    },
    analysisRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6
    },
    analysisDetailText: {
        fontSize: 11,
        color: '#374151',
        flex: 1
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
    }
});

export default function RecommendationsTab() {
    const handleGenerateRecs = (mode: 'collection' | 'taste', filters?: any) => {
        console.log('Generate recommendations:', mode, filters);
    };

    return <RecommendationsScreen onGenerateRecs={handleGenerateRecs}/>;
}
