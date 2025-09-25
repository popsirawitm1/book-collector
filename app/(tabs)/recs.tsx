import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Switch, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Mock API function for recommendations (replace with actual Firebase implementation)
const mockAPI = {
    getRecommendations: async (mode: string, target: any) => {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Mock recommendations data
        return {
            recommendations: [
                {
                    isbn13: '9780123456789',
                    title: 'Sample Book Title',
                    author: 'Sample Author',
                    publisher: 'Sample Publisher',
                    year: '2023',
                    description: 'This is a sample book description for testing the recommendations feature.'
                },
                {
                    isbn13: '9780987654321',
                    title: 'Another Great Book',
                    author: 'Another Author',
                    publisher: 'Great Publisher',
                    year: '2022',
                    description: 'Another sample book to demonstrate the recommendations functionality.'
                }
            ]
        };
    }
};

interface Recommendation {
    isbn13: string;
    title?: string;
    author?: string;
    publisher?: string;
    year?: string;
    description?: string;
    [k: string]: any;
}

interface RecommendationsScreenProps {
    onGenerateRecs: (mode: 'collection' | 'taste', filters?: any) => void;
}

export const RecommendationsScreen: React.FC<RecommendationsScreenProps> = ({ onGenerateRecs }) => {
    const [activeMode, setActiveMode] = useState<'collection' | 'taste'>('collection');
    const [tasteInput, setTasteInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
    const [error, setError] = useState('');
    const [filters, setFilters] = useState({
        years: '',
        binding: '',
        language: '',
        publisher: '',
        firstEdition: false
    });

    const handleGenerate = async () => {
        setIsLoading(true);
        setError('');
        try {
            const target = activeMode === 'taste' ? { taste: tasteInput, ...filters } : filters;
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

    const handleSave = (isbn: string) => {
        // TODO: implement save
        console.log('Save', isbn);
    };

    const handleHide = (isbn: string) => {
        // TODO: implement hide
        console.log('Hide', isbn);
        setRecommendations(prev => prev.filter(r => r.isbn13 !== isbn));
    };

    const handleAddRadar = (isbn: string) => {
        // TODO: implement radar
        console.log('Radar', isbn);
    };

    const renderRecommendation = ({ item }: { item: Recommendation }) => (
        <View style={styles.recCard}>
            <View style={styles.recHeader}>
                <Text style={styles.recTitle}>{item.title || 'Unknown Title'}</Text>
                <TouchableOpacity onPress={() => handleHide(item.isbn13)}>
                    <Ionicons name="close" size={18} color="#888" />
                </TouchableOpacity>
            </View>
            {item.author && <Text style={styles.recMeta}>{item.author}</Text>}
            <Text style={styles.recMeta}>
                {item.publisher ? `${item.publisher}` : ''}{item.year ? ` • ${item.year}` : ''}
            </Text>
            {item.description && (
                <Text style={styles.recDesc} numberOfLines={3}>
                    {item.description}
                </Text>
            )}
            <View style={styles.recActions}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleSave(item.isbn13)}>
                    <Ionicons name="bookmark-outline" size={16} color="#2563eb" />
                    <Text style={styles.actionText}>Wishlist</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleAddRadar(item.isbn13)}>
                    <Ionicons name="radio-outline" size={16} color="#16a34a" />
                    <Text style={styles.actionText}>Radar</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {/* Header Card */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>
                    <Ionicons name="sparkles" size={20} color="#6366f1" /> AI Book Recommendations
                </Text>
                <Text style={styles.paragraph}>
                    Get personalized book recommendations based on your collection or specify your taste preferences. All recommendations are verified.
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
                    </View>
                )}

                {activeMode === 'taste' && (
                    <View style={{ marginTop: 12 }}>
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
                        onChangeText={(v) => setFilters(p => ({ ...p, years: v }))}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Publisher"
                        placeholderTextColor="#999"
                        value={filters.publisher}
                        onChangeText={(v) => setFilters(p => ({ ...p, publisher: v }))}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Language"
                        placeholderTextColor="#999"
                        value={filters.language}
                        onChangeText={(v) => setFilters(p => ({ ...p, language: v }))}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Binding type"
                        placeholderTextColor="#999"
                        value={filters.binding}
                        onChangeText={(v) => setFilters(p => ({ ...p, binding: v }))}
                    />
                </View>

                <View style={styles.actionsRow}>
                    <View style={styles.switchRow}>
                        <Text style={styles.switchLabel}>First editions only</Text>
                        <Switch
                            value={filters.firstEdition}
                            onValueChange={(val) => setFilters(p => ({ ...p, firstEdition: val }))}
                        />
                    </View>
                    <TouchableOpacity
                        style={[styles.primaryBtn, (isLoading || (activeMode === 'taste' && !tasteInput.trim())) && styles.btnDisabled]}
                        disabled={isLoading || (activeMode === 'taste' && !tasteInput.trim())}
                        onPress={handleGenerate}
                    >
                        {isLoading ? (
                            <>
                                <ActivityIndicator size="small" color="#fff" style={{ marginRight: 6 }} />
                                <Text style={styles.primaryBtnText}>Generating...</Text>
                            </>
                        ) : (
                            <>
                                <Ionicons name="sparkles" size={16} color="#fff" style={{ marginRight: 6 }} />
                                <Text style={styles.primaryBtnText}>Get Recommendations</Text>
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
                        <Text style={styles.sectionTitle}>Recommendations for You</Text>
                        <View style={styles.badge}>
                            <Ionicons name="sparkles" size={12} color="#6366f1" />
                            <Text style={styles.badgeText}>AI Generated</Text>
                        </View>
                    </View>

                    <FlatList
                        data={recommendations}
                        keyExtractor={(item) => item.isbn13}
                        renderItem={renderRecommendation}
                        scrollEnabled={false}
                        contentContainerStyle={{ gap: 12 }}
                    />

                    <View style={styles.verifyCard}>
                        <Ionicons name="shield-checkmark" size={22} color="#16a34a" />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.verifyTitle}>All recommendations verified</Text>
                            <Text style={styles.verifyDesc}>
                                Cross-checked against trusted databases for accurate metadata.
                            </Text>
                        </View>
                    </View>
                </View>
            )}

            {/* Empty */}
            {recommendations.length === 0 && !error && (
                <View style={styles.emptyState}>
                    <Ionicons name="book-outline" size={48} color="#888" />
                    <Text style={styles.emptyTitle}>No recommendations yet</Text>
                    <Text style={styles.emptyDesc}>
                        {activeMode === 'collection'
                            ? 'Generate recommendations based on your current collection.'
                            : 'Describe your taste to receive personalized suggestions.'}
                    </Text>
                </View>
            )}

        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f1115' },
    content: { padding: 16, paddingBottom: 48, gap: 16 },
    card: { backgroundColor: '#1c2128', borderRadius: 12, padding: 16, gap: 12 },
    cardTitle: { fontSize: 18, fontWeight: '600', color: '#f1f5f9' },
    paragraph: { fontSize: 13, lineHeight: 18, color: '#94a3b8' },
    tabsRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
    tabBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: '#11151a', alignItems: 'center' },
    tabBtnActive: { backgroundColor: '#3b82f6' },
    tabText: { fontSize: 12, fontWeight: '500', color: '#94a3b8' },
    tabTextActive: { color: '#fff' },
    infoBox: { backgroundColor: '#11151a', padding: 12, borderRadius: 8 },
    infoTitle: { fontSize: 14, fontWeight: '600', color: '#e2e8f0', marginBottom: 4 },
    infoText: { fontSize: 12, lineHeight: 17, color: '#94a3b8' },
    label: { fontSize: 13, fontWeight: '600', color: '#e2e8f0', marginBottom: 6 },
    hint: { fontSize: 11, color: '#64748b', marginTop: 4 },
    input: {
        backgroundColor: '#11151a',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        color: '#e2e8f0',
        fontSize: 13,
        borderWidth: 1,
        borderColor: '#252c36'
    },
    filterGrid: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 12, rowGap: 12, marginTop: 16 },
    actionsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 16, justifyContent: 'space-between' },
    switchRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    switchLabel: { fontSize: 13, color: '#e2e8f0' },
    primaryBtn: { flexDirection: 'row', backgroundColor: '#6366f1', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
    btnDisabled: { opacity: 0.5 },
    primaryBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
    errorBox: { backgroundColor: '#471515', borderColor: '#7f1d1d', borderWidth: 1, padding: 12, borderRadius: 8 },
    errorText: { color: '#fca5a5', fontSize: 13 },
    section: { gap: 16 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    sectionTitle: { fontSize: 16, fontWeight: '600', color: '#f1f5f9' },
    badge: { flexDirection: 'row', gap: 4, backgroundColor: '#1e293b', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, alignItems: 'center' },
    badgeText: { fontSize: 11, color: '#cbd5e1' },
    recCard: { backgroundColor: '#1c2128', padding: 14, borderRadius: 10 },
    recHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    recTitle: { fontSize: 15, fontWeight: '600', color: '#f1f5f9', flex: 1, paddingRight: 8 },
    recMeta: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
    recDesc: { fontSize: 12, color: '#cbd5e1', marginTop: 8, lineHeight: 17 },
    recActions: { flexDirection: 'row', gap: 12, marginTop: 12 },
    actionBtn: { flexDirection: 'row', gap: 6, backgroundColor: '#11151a', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
    actionText: { fontSize: 11, fontWeight: '600', color: '#cbd5e1' },
    verifyCard: { flexDirection: 'row', gap: 12, backgroundColor: '#11151a', padding: 14, borderRadius: 10, alignItems: 'center', marginTop: 8 },
    verifyTitle: { fontSize: 14, fontWeight: '600', color: '#e2e8f0' },
    verifyDesc: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
    emptyState: { alignItems: 'center', paddingVertical: 48, gap: 12 },
    emptyTitle: { fontSize: 16, fontWeight: '600', color: '#f1f5f9' },
    emptyDesc: { fontSize: 13, color: '#94a3b8', textAlign: 'center', paddingHorizontal: 24 },
    tipTitle: { fontSize: 15, fontWeight: '600', color: '#f1f5f9' },
    tipRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
    bullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#6366f1', marginTop: 6 },
    tipText: { fontSize: 12, color: '#94a3b8', flex: 1 }
});

export default function RecommendationsTab() {
    const handleGenerateRecs = (mode: 'collection' | 'taste', filters?: any) => {
        console.log('Generate recommendations:', mode, filters);
    };

    return <RecommendationsScreen onGenerateRecs={handleGenerateRecs} />;
}
