// app/book-detail.tsx
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { addDoc, collection, deleteDoc, doc, getDocs, query, updateDoc, where } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CustomAlert from "../components/CustomAlert";
import { auth, db } from "../configs/firebase";

interface BookData {
    id: string;
    title: string;
    authors: string;
    publisher: string;
    year: string;
    coverImage?: string | null;
    purchasePrice: number;
    condition?: string;
    edition?: string;
    binding?: string;
    acquisitionSource?: string;
    acquisitionDate?: string;
    isbn?: string;
    language?: string;
    collectionId?: string;
}

interface Collection {
    id: string;
    name: string;
}

export default function BookDetailScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const insets = useSafeAreaInsets();

    const book: BookData = JSON.parse(params.book as string);

    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [editedBook, setEditedBook] = useState<BookData>(book);
    const [collections, setCollections] = useState<Collection[]>([]);
    const [currentCollection, setCurrentCollection] = useState<Collection | null>(null);

    const [showSuccessAlert, setShowSuccessAlert] = useState(false);
    const [showDeleteAlert, setShowDeleteAlert] = useState(false);
    const [alertConfig, setAlertConfig] = useState({title: "", message: "", type: "success" as "success" | "error"});

    // -------------------- Collection & Date Picker --------------------
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [selectedDate, setSelectedDate] = useState(book.acquisitionDate ? new Date(book.acquisitionDate) : new Date());
    const [newCollectionName, setNewCollectionName] = useState("");
    const [showNewCollectionInput, setShowNewCollectionInput] = useState(false);

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    const handleDateChange = (event: any, date?: Date) => {
        const currentDate = date || selectedDate;
        setShowDatePicker(false);
        setSelectedDate(currentDate);
        setEditedBook(prev => ({ ...prev, acquisitionDate: formatDate(currentDate) }));
    };

    const createNewCollection = async () => {
        if (!newCollectionName.trim() || !auth.currentUser) {
            Alert.alert("Error", "Please enter collection name");
            return;
        }

        try {
            const docRef = await addDoc(collection(db, "collections"), {
                name: newCollectionName.trim(),
                userId: auth.currentUser.uid,
                createdAt: new Date(),
            });
            const newCollection: Collection = { id: docRef.id, name: newCollectionName.trim() };
            setCollections(prev => [...prev, newCollection]);
            setEditedBook(prev => ({ ...prev, collectionId: docRef.id }));
            setCurrentCollection(newCollection);
            setShowNewCollectionInput(false);
            setNewCollectionName("");
        } catch (error) {
            console.error("Error creating collection:", error);
            Alert.alert("Error", "Unable to create collection");
        }
    };
    // ------------------------------------------------------------------

    useEffect(() => {
        loadCollections();
    }, []);

    const loadCollections = async () => {
        if (!auth.currentUser) return;
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

            if (book.collectionId) {
                const current = collectionsData.find(c => c.id === book.collectionId);
                setCurrentCollection(current || null);
            }
        } catch (error) {
            console.error("Error loading collections:", error);
        }
    };

    const handleSave = async () => {
        setIsLoading(true);
        try {
            const updateData: any = {};
            if (editedBook.title !== undefined) updateData.title = editedBook.title;
            if (editedBook.authors !== undefined) updateData.authors = editedBook.authors;
            if (editedBook.publisher !== undefined) updateData.publisher = editedBook.publisher;
            if (editedBook.year !== undefined) updateData.year = editedBook.year;
            if (editedBook.purchasePrice !== undefined) updateData.purchasePrice = editedBook.purchasePrice;
            if (editedBook.collectionId !== undefined) {
                updateData.collectionId = editedBook.collectionId;
            } else {
                updateData.collectionId = null;
            }
            if (editedBook.edition !== undefined) updateData.edition = editedBook.edition;
            if (editedBook.binding !== undefined) updateData.binding = editedBook.binding;
            if (editedBook.acquisitionSource !== undefined) updateData.acquisitionSource = editedBook.acquisitionSource;
            if (editedBook.acquisitionDate !== undefined) updateData.acquisitionDate = editedBook.acquisitionDate;
            if (editedBook.isbn !== undefined && editedBook.isbn !== "") updateData.isbn = editedBook.isbn;
            if (editedBook.language !== undefined && editedBook.language !== "") updateData.language = editedBook.language;
            if (editedBook.coverImage !== undefined) updateData.coverImage = editedBook.coverImage;
            if (editedBook.collectionId !== undefined) updateData.collectionId = editedBook.collectionId;

            await updateDoc(doc(db, "books", book.id), updateData);

            setAlertConfig({
                title: "Update Successful! ✅",
                message: `Book "${editedBook.title}" has been updated`,
                type: "success"
            });
            setShowSuccessAlert(true);
            setIsEditing(false);
        } catch (error) {
            console.error("Error updating book:", error);
            setAlertConfig({
                title: "Error Occurred ❌",
                message: "Unable to update book. Please try again.",
                type: "error"
            });
            setShowSuccessAlert(true);
        }
        setIsLoading(false);
    };

    const handleDelete = () => {
        Alert.alert(
            "Delete Book",
            "Are you sure you want to delete this book? This action cannot be undone.",
            [
                {text: "Cancel", style: "cancel"},
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        setIsLoading(true);
                        try {
                            await deleteDoc(doc(db, "books", book.id));
                            setAlertConfig({title: "Success", message: "Book deleted successfully!", type: "success"});
                            setShowDeleteAlert(true);
                        } catch (error) {
                            console.error("Error deleting book:", error);
                            setAlertConfig({
                                title: "Error",
                                message: "Failed to delete the book. Please try again.",
                                type: "error"
                            });
                            setShowDeleteAlert(true);
                            setIsLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const renderField = (label: string, value: string, field: keyof BookData, isNumeric = false) => (
        <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>{label}</Text>
            {isEditing ? (
                <TextInput
                    style={styles.input}
                    value={String(value || "")}
                    onChangeText={(text) => {
                        setEditedBook(prev => ({
                            ...prev,
                            [field]: isNumeric ? (text ? Number(text) : 0) : text
                        }));
                    }}
                    keyboardType={isNumeric ? "numeric" : "default"}
                    multiline={field === "title" || field === "authors"}
                />
            ) : (
                <Text style={styles.fieldValue}>{value || "Not specified"}</Text>
            )}
        </View>
    );

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
            Alert.alert("Permission Denied", "Please allow access to your photo library.");
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            base64: true,
            allowsEditing: true,
            aspect: [150, 220],
            quality: 0.7,
        });

        if (!result.canceled && result.assets.length > 0 && result.assets[0].base64) {
            setEditedBook(prev => ({ ...prev, coverImage: result.assets[0].base64 }));
        }
    };

    const takePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== "granted") {
            Alert.alert("Permission Denied", "Please allow access to your camera.");
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            base64: true,
            allowsEditing: true,
            aspect: [150, 220],
            quality: 0.7,
        });

        if (!result.canceled && result.assets.length > 0 && result.assets[0].base64) {
            setEditedBook(prev => ({ ...prev, coverImage: result.assets[0].base64 }));
        }
    };

    return (
        <View style={[styles.container, {paddingTop: insets.top}]}>
            <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa"/>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#333"/>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Book Details</Text>
                <TouchableOpacity
                    onPress={() => {
                        if (isEditing) setEditedBook(book);
                        setIsEditing(!isEditing);
                    }}
                    style={styles.editButton}
                >
                    <Ionicons
                        name={isEditing ? "close" : "pencil"}
                        size={20}
                        color={isEditing ? "#ef4444" : "#6366f1"}
                    />
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{paddingBottom: insets.bottom + 20}}
            >
                <View style={styles.imageContainer}>
                    <Image
                        source={{
                            uri: editedBook.coverImage
                                ? `data:image/jpeg;base64,${editedBook.coverImage}`
                                : "https://via.placeholder.com/200x300/f0f0f0/999999?text=No+Cover"
                        }}
                        style={styles.coverImage}
                    />

                    {isEditing && (
                        <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 8, gap: 12 }}>
                            <TouchableOpacity onPress={pickImage} style={styles.imageButton}>
                                <Ionicons name="image" size={24} color="#4F46E5" />
                                <Text style={{ color: "#4F46E5" }}>Gallery</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={takePhoto} style={styles.imageButton}>
                                <Ionicons name="camera" size={24} color="#4F46E5" />
                                <Text style={{ color: "#4F46E5" }}>Camera</Text>
                            </TouchableOpacity>
                            {editedBook.coverImage && (
                                <TouchableOpacity onPress={() => setEditedBook(prev => ({ ...prev, coverImage: undefined }))} style={styles.imageButton}>
                                    <Ionicons name="close-circle" size={24} color="#ef4444" />
                                    <Text style={{ color: "#ef4444" }}>Remove</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    )}
                </View>

                <View style={styles.infoContainer}>
                    {renderField("Book Title", editedBook.title, "title")}
                    {renderField("Author", editedBook.authors, "authors")}
                    {renderField("Publisher", editedBook.publisher, "publisher")}
                    {renderField("Publication Year", editedBook.year, "year")}
                    {renderField("ISBN", editedBook.isbn || "", "isbn")}
                    {renderField("Language", editedBook.language || "", "language")}
                    {renderField("Edition", editedBook.edition || "", "edition")}
                    {renderField("Binding", editedBook.binding || "", "binding")}
                    {renderField("Condition", editedBook.condition || "", "condition")}
                    {renderField("Price (฿)", String(editedBook.purchasePrice), "purchasePrice", true)}

                    {/* Acquisition Source */}
                    {renderField("Acquisition Source", editedBook.acquisitionSource || "", "acquisitionSource")}

                    {/* Acquisition Date */}
                    <View style={{marginBottom: 16}}>
                        <Text style={styles.fieldLabel}>Acquisition Date</Text>
                        {isEditing ? (
                            <TouchableOpacity
                                style={{ paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, backgroundColor: '#f9fafb' }}
                                onPress={() => setShowDatePicker(true)}
                            >
                                <Text>{editedBook.acquisitionDate || "Select acquisition date"}</Text>
                            </TouchableOpacity>
                        ) : (
                            <Text style={styles.fieldValue}>{editedBook.acquisitionDate || "Not specified"}</Text>
                        )}

                        {showDatePicker && (
                            <DateTimePicker
                                value={selectedDate}
                                mode="date"
                                display="default"
                                onChange={handleDateChange}
                            />
                        )}
                    </View>

                    {/* Collection Picker */}
                    <View style={{marginBottom: 16}}>
                        <Text style={styles.fieldLabel}>Collection</Text>
                        {isEditing ? (
                            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                                <TouchableOpacity
                                    style={{
                                        paddingVertical: 6,
                                        paddingHorizontal: 12,
                                        borderRadius: 8,
                                        backgroundColor: editedBook.collectionId ? '#f3f4f6' : '#6366f1'
                                    }}
                                    onPress={() => {
                                        setEditedBook(prev => ({ ...prev, collectionId: undefined }));
                                        setCurrentCollection(null);
                                    }}
                                >
                                    <Text style={{ color: editedBook.collectionId ? '#111827' : '#fff' }}>No Collection</Text>
                                </TouchableOpacity>

                                {collections.map(c => (
                                    <TouchableOpacity
                                        key={c.id}
                                        style={{
                                            paddingVertical: 6,
                                            paddingHorizontal: 12,
                                            borderRadius: 8,
                                            backgroundColor: editedBook.collectionId === c.id ? '#6366f1' : '#f3f4f6'
                                        }}
                                        onPress={() => {
                                            setEditedBook(prev => ({ ...prev, collectionId: c.id }));
                                            setCurrentCollection(c);
                                        }}
                                    >
                                        <Text style={{ color: editedBook.collectionId === c.id ? '#fff' : '#111827' }}>{c.name}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        ) : (
                            <View style={styles.collectionInfo}>
                                <Text style={styles.collectionName}>
                                    {currentCollection ? currentCollection.name : "No Collection"}
                                </Text>
                            </View>
                        )}

                        {isEditing && (
                            showNewCollectionInput ? (
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 }}>
                                    <TextInput
                                        style={{ flex: 1, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 8 }}
                                        placeholder="Enter new collection name"
                                        value={newCollectionName}
                                        onChangeText={setNewCollectionName}
                                    />
                                    <TouchableOpacity style={{ paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#6366f1', borderRadius: 8 }}
                                        onPress={createNewCollection}>
                                        <Text style={{ color: '#fff' }}>Create</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => { setShowNewCollectionInput(false); setNewCollectionName(""); }}>
                                        <Text style={{ color: '#ef4444' }}>Cancel</Text>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <TouchableOpacity onPress={() => setShowNewCollectionInput(true)} style={{ marginTop: 8 }}>
                                    <Text style={{ color: '#6366f1' }}>+ Add New Collection</Text>
                                </TouchableOpacity>
                            )
                        )}
                    </View>

                    <View style={styles.actionContainer}>
                        {isEditing ? (
                            <View style={styles.editActions}>
                                <TouchableOpacity
                                    style={[styles.button, styles.saveButton]}
                                    onPress={handleSave}
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <ActivityIndicator color="#fff" size="small"/>
                                    ) : (
                                        <>
                                            <Ionicons name="checkmark" size={20} color="#fff"/>
                                            <Text style={styles.buttonText}>Save Changes</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.button, styles.cancelButton]}
                                    onPress={() => {
                                        setEditedBook(book);
                                        setIsEditing(false);
                                    }}
                                    disabled={isLoading}
                                >
                                    <Ionicons name="close" size={20} color="#6b7280"/>
                                    <Text style={[styles.buttonText, {color: "#6b7280"}]}>Cancel</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <TouchableOpacity
                                style={[styles.button, styles.deleteButton]}
                                onPress={handleDelete}
                                disabled={isLoading}
                            >
                                <Ionicons name="trash" size={20} color="#fff"/>
                                <Text style={styles.buttonText}>Delete Book</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </ScrollView>

            <CustomAlert
                visible={showSuccessAlert}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
                onClose={() => setShowSuccessAlert(false)}
            />
            <CustomAlert
                visible={showDeleteAlert}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
                onClose={() => {
                    setShowDeleteAlert(false);
                    router.back();
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#fff" },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: "#f8f9fa",
        borderBottomWidth: 1,
        borderBottomColor: "#e5e7eb",
    },
    backButton: { padding: 8 },
    headerTitle: { fontSize: 18, fontWeight: "600", color: "#333", flex: 1, textAlign: "center" },
    editButton: { padding: 8 },
    content: { flex: 1 },
    imageContainer: { alignItems: "center", paddingVertical: 20, backgroundColor: "#f8f9fa" },
    coverImage: {
        width: 160,
        height: 240,
        borderRadius: 12,
        resizeMode: "cover",
        shadowColor: "#000",
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    imageButton: { flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4 },
    infoContainer: { padding: 20 },
    fieldContainer: { marginBottom: 16 },
    fieldLabel: { fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 4 },
    fieldValue: { fontSize: 16, color: "#111827", paddingVertical: 8, paddingHorizontal: 12, backgroundColor: "#f9fafb", borderRadius: 8, borderWidth: 1, borderColor: "#e5e7eb" },
    input: { fontSize: 16, color: "#111827", paddingVertical: 8, paddingHorizontal: 12, backgroundColor: "#fff", borderRadius: 8, borderWidth: 2, borderColor: "#6366f1" },
    actionContainer: { marginTop: 20 },
    editActions: { gap: 12 },
    button: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 12, paddingHorizontal: 20, borderRadius: 10, gap: 8 },
    saveButton: { backgroundColor: "#10b981" },
    cancelButton: { backgroundColor: "#f3f4f6", borderWidth: 1, borderColor: "#d1d5db" },
    deleteButton: { backgroundColor: "#ef4444" },
    buttonText: { fontSize: 16, fontWeight: "600", color: "#fff" },
    collectionInfo: { flexDirection: "row", alignItems: "center", paddingVertical: 8, paddingHorizontal: 12, backgroundColor: "#f9fafb", borderRadius: 8, borderWidth: 1, borderColor: "#e5e7eb" },
    collectionName: { marginLeft: 4, fontSize: 16, color: "#111827" },
});
