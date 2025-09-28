import React, {useState, useEffect} from "react";
import {
    View,
    Text,
    Image,
    ScrollView,
    TouchableOpacity,
    TextInput,
    StyleSheet,
    Alert,
    ActivityIndicator,
    Platform,
    StatusBar,
} from "react-native";
import {useRouter, useLocalSearchParams} from "expo-router";
import {Ionicons} from "@expo/vector-icons";
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {doc, updateDoc, deleteDoc, getDocs, collection, query, where} from "firebase/firestore";
import {db, auth} from "../configs/firebase";
import CustomAlert from "../components/CustomAlert";

interface BookData {
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
    acquisitionSource?: string;
    acquisitionDate?: string;
    isbn?: string;
    language?: string;
    collectionId?: string; // เพิ่ม collectionId
}

interface Collection {
    id: string;
    name: string;
}

export default function BookDetailScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const insets = useSafeAreaInsets();

    // Parse book data from params
    const book: BookData = JSON.parse(params.book as string);

    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [editedBook, setEditedBook] = useState<BookData>(book);
    const [collections, setCollections] = useState<Collection[]>([]);
    const [currentCollection, setCurrentCollection] = useState<Collection | null>(null);

    // Add CustomAlert states
    const [showSuccessAlert, setShowSuccessAlert] = useState(false);
    const [showDeleteAlert, setShowDeleteAlert] = useState(false);
    const [alertConfig, setAlertConfig] = useState({title: "", message: "", type: "success" as "success" | "error"});

    // โหลด collections และหา collection ปัจจุบัน
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

            // หา collection ปัจจุบันของหนังสือเล่มนี้
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
            // Filter out undefined values before sending to Firestore
            const updateData: any = {};

            if (editedBook.title !== undefined) updateData.title = editedBook.title;
            if (editedBook.authors !== undefined) updateData.authors = editedBook.authors;
            if (editedBook.publisher !== undefined) updateData.publisher = editedBook.publisher;
            if (editedBook.year !== undefined) updateData.year = editedBook.year;
            if (editedBook.purchasePrice !== undefined) updateData.purchasePrice = editedBook.purchasePrice;
            if (editedBook.condition !== undefined) updateData.condition = editedBook.condition;
            if (editedBook.edition !== undefined) updateData.edition = editedBook.edition;
            if (editedBook.binding !== undefined) updateData.binding = editedBook.binding;
            if (editedBook.acquisitionSource !== undefined) updateData.acquisitionSource = editedBook.acquisitionSource;
            if (editedBook.acquisitionDate !== undefined) updateData.acquisitionDate = editedBook.acquisitionDate;
            if (editedBook.isbn !== undefined && editedBook.isbn !== "") updateData.isbn = editedBook.isbn;
            if (editedBook.language !== undefined && editedBook.language !== "") updateData.language = editedBook.language;

            await updateDoc(doc(db, "books", book.id), updateData);

            // Show success alert
            setAlertConfig({
                title: "Update Successful! ✅",
                message: `Book "${editedBook.title}" has been updated`,
                type: "success"
            });
            setShowSuccessAlert(true);
            setIsEditing(false);
        } catch (error) {
            console.error("Error updating book:", error);
            // Show error alert
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
                            // Show delete success alert
                            setAlertConfig({title: "Success", message: "Book deleted successfully!", type: "success"});
                            setShowDeleteAlert(true);
                        } catch (error) {
                            console.error("Error deleting book:", error);
                            // Show error alert
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

    return (
        <View style={[styles.container, {paddingTop: insets.top}]}>
            {/* StatusBar configuration */}
            <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa"/>

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#333"/>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Book Details</Text>
                <TouchableOpacity
                    onPress={() => {
                        if (isEditing) {
                            setEditedBook(book); // Reset changes
                        }
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
                {/* Cover Image */}
                <View style={styles.imageContainer}>
                    <Image
                        source={{
                            uri: book.coverImage
                                ? `data:image/jpeg;base64,${book.coverImage}`
                                : "https://via.placeholder.com/200x300/f0f0f0/999999?text=No+Cover"
                        }}
                        style={styles.coverImage}
                        onError={(error) => {
                            console.log("Image loading error:", error);
                        }}
                        defaultSource={{uri: "https://via.placeholder.com/200x300/f0f0f0/999999?text=Loading"}}
                    />
                </View>

                {/* Book Information */}
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
                    {renderField("Acquisition Source", editedBook.acquisitionSource || "", "acquisitionSource")}
                    {renderField("Acquisition Date", editedBook.acquisitionDate || "", "acquisitionDate")}

                    {/* Collection Information */}
                    {currentCollection && (
                        <View style={styles.fieldContainer}>
                            <Text style={styles.fieldLabel}>Collection</Text>
                            <View style={styles.collectionInfo}>
                                <Ionicons name="folder" size={16} color="#6366f1"/>
                                <Text style={styles.collectionName}>{currentCollection.name}</Text>
                            </View>
                        </View>
                    )}

                    {/* Action Buttons */}
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

            {/* Custom Alerts */}
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
    container: {
        flex: 1,
        backgroundColor: "#fff",
    },
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
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: "#333",
        flex: 1,
        textAlign: "center",
    },
    editButton: {
        padding: 8,
    },
    content: {
        flex: 1,
    },
    imageContainer: {
        alignItems: "center",
        paddingVertical: 20,
        backgroundColor: "#f8f9fa",
    },
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
    infoContainer: {
        padding: 20,
    },
    fieldContainer: {
        marginBottom: 16,
    },
    fieldLabel: {
        fontSize: 14,
        fontWeight: "600",
        color: "#374151",
        marginBottom: 4,
    },
    fieldValue: {
        fontSize: 16,
        color: "#111827",
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: "#f9fafb",
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#e5e7eb",
    },
    input: {
        fontSize: 16,
        color: "#111827",
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: "#fff",
        borderRadius: 8,
        borderWidth: 2,
        borderColor: "#6366f1",
    },
    actionContainer: {
        marginTop: 20,
    },
    editActions: {
        gap: 12,
    },
    button: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 10,
        gap: 8,
    },
    saveButton: {
        backgroundColor: "#10b981",
    },
    cancelButton: {
        backgroundColor: "#f3f4f6",
        borderWidth: 1,
        borderColor: "#d1d5db",
    },
    deleteButton: {
        backgroundColor: "#ef4444",
    },
    buttonText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#fff",
    },
    collectionInfo: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: "#f9fafb",
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#e5e7eb",
    },
    collectionName: {
        marginLeft: 4,
        fontSize: 16,
        color: "#111827",
    },
});
