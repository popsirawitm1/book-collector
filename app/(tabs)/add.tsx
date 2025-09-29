import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect } from "expo-router";
import type { Auth } from "firebase/auth";
import { addDoc, collection, getDocs, query, where } from "firebase/firestore";
import { useCallback, useRef, useState } from "react";
import {
    ActivityIndicator,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import CustomAlert from "../../components/CustomAlert";
import { auth, db } from "../../configs/firebase";
import { BookData, fetchBookByQuery, ScanModal, ScanResult } from "../lib/scan";

// Ensure 'auth' is typed correctly
const typedAuth = auth as Auth;

const defaultBook = {
    step: 1,
    isbn: "",
    title: "",
    authors: "",
    publisher: "",
    year: "",
    language: "English",
    binding: "Hardcover",
    acquisitionSource: "",
    acquisitionDate: "",
    purchasePrice: "",
    coverImage: null as string | null, // Base64
    collectionId: "", // เพิ่ม collection
};

export default function Add() {
    const [book, setBook] = useState({...defaultBook});
    const [scanVisible, setScanVisible] = useState(false);
    const [errorMessage, setErrorMessage] = useState(""); // สำหรับข้อความสีแดง
    const [isLoading, setIsLoading] = useState(false); // Loading state
    const [collections, setCollections] = useState<Array<{ id: string, name: string }>>([]);
    const [newCollectionName, setNewCollectionName] = useState("");
    const [showNewCollectionInput, setShowNewCollectionInput] = useState(false);
    const [showSuccessAlert, setShowSuccessAlert] = useState(false); // เพิ่มสำหรับ CustomAlert
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const scrollViewRef = useRef<ScrollView | null>(null);

    useFocusEffect(
        useCallback(() => {
            setBook({...defaultBook});
            setErrorMessage("");
            loadUserCollections();
        }, [])
    );

    // Load user's collections
    const loadUserCollections = async () => {
        if (!typedAuth.currentUser) return;

        try {
            const q = query(
                collection(db, "collections"),
                where("userId", "==", typedAuth.currentUser.uid)
            );
            const querySnapshot = await getDocs(q);
            const userCollections = querySnapshot.docs.map(doc => ({
                id: doc.id,
                name: doc.data().name
            }));
            setCollections(userCollections);
        } catch (error) {
            console.error("Error loading collections:", error);
        }
    };

    // Create new collection
    const createNewCollection = async () => {
        if (!newCollectionName.trim() || !typedAuth.currentUser) {
            setErrorMessage("Please enter collection name");
            return;
        }

        try {
            const docRef = await addDoc(collection(db, "collections"), {
                name: newCollectionName.trim(),
                userId: typedAuth.currentUser.uid,
                createdAt: new Date(),
            });

            // Add to local state
            setCollections(prev => [...prev, {
                id: docRef.id,
                name: newCollectionName.trim()
            }]);

            // Set as selected collection
            setBook(prev => ({...prev, collectionId: docRef.id}));

            // Reset form
            setNewCollectionName("");
            setShowNewCollectionInput(false);
            setErrorMessage("");

        } catch (error) {
            console.error("Error creating collection:", error);
            setErrorMessage("Unable to create collection");
        }
    };

    const nextStep = () => {
        setErrorMessage(""); // ล้าง error ทุกครั้ง
        setBook(prev => ({...prev, step: prev.step + 1}));

        // Scroll to top when going to review step
        if (book.step === 2) {
            setTimeout(() => {
                // This will scroll to top after state update
                scrollViewRef.current?.scrollTo({y: 0, animated: true});
            }, 100);
        }
    };
    const prevStep = () => {
        setErrorMessage("");
        setBook(prev => ({...prev, step: prev.step - 1}));
    };

    // ================= FETCH FROM ISBN or TITLE =================
    const fetchBook = async (query?: string) => {
        const search = query || book.isbn || book.title;
        if (!search) return;

        const bookData: BookData | null = await fetchBookByQuery(search);
        if (bookData) {
            setBook(prev => ({...prev, ...bookData}));
            setErrorMessage("");
            setTimeout(nextStep, 100);
        } else {
            setErrorMessage("No data found for this ISBN/Title");
        }
    };

    // ================= IMAGE PICKER =================
    const pickCoverImage = async () => {
        const {status} = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
            return setErrorMessage("Permission Denied: Please allow access to your photo library.");
        }

        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                base64: true,
                allowsEditing: true,
                aspect: [150, 220],
                quality: 0.3,
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
            });

            if (!result.canceled && result.assets.length > 0) {
                const base64Data = result.assets[0].base64;
                if (base64Data) {
                    const sizeInBytes = (base64Data.length * 3) / 4;
                    const maxSize = 900000;

                    if (sizeInBytes > maxSize) {
                        setErrorMessage("Image size is too large. Please select a smaller image");
                        return;
                    }

                    setBook(prev => ({...prev, coverImage: base64Data}));
                    setErrorMessage("");
                }
            }
        } catch (error) {
            console.error("ImagePicker error:", error);
            setErrorMessage("Error occurred while selecting image");
        }
    };

    // เพิ่มฟังก์ชันถ่ายรูปด้วยกล้อง
    const takeCoverPhoto = async () => {
        const {status} = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== "granted") {
            return setErrorMessage("Permission Denied: Please allow access to camera.");
        }

        try {
            const result = await ImagePicker.launchCameraAsync({
                base64: true,
                allowsEditing: true,
                aspect: [150, 220],
                quality: 0.3,
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
            });

            if (!result.canceled && result.assets.length > 0) {
                const base64Data = result.assets[0].base64;
                if (base64Data) {
                    const sizeInBytes = (base64Data.length * 3) / 4;
                    const maxSize = 900000;

                    if (sizeInBytes > maxSize) {
                        setErrorMessage("Image size is too large. Please try taking another photo");
                        return;
                    }

                    setBook(prev => ({...prev, coverImage: base64Data}));
                    setErrorMessage("");
                }
            }
        } catch (error) {
            console.error("Camera error:", error);
            setErrorMessage("Error occurred while taking photo");
        }
    };

    // ================= SAVE BOOK =================
    const saveBook = async () => {
        if (!book.title) {
            setErrorMessage("Please enter Title before saving");
            setBook(prev => ({...prev, step: 2})); // กลับไป Step 2
            return;
        }
        if (!typedAuth.currentUser) {
            setErrorMessage("User not logged in");
            setBook(prev => ({...prev, step: 2}));
            return;
        }

        setIsLoading(true); // เริ่ม loading

        try {
            await addDoc(collection(db, "books"), {
                userId: typedAuth.currentUser.uid,
                isbn: book.isbn,
                title: book.title,
                authors: book.authors,
                publisher: book.publisher,
                year: book.year,
                language: book.language,
                binding: book.binding,
                acquisitionSource: book.acquisitionSource,
                acquisitionDate: book.acquisitionDate,
                purchasePrice: book.purchasePrice,
                coverImage: book.coverImage,
                collectionId: book.collectionId, // เพิ่ม collection ID
                createdAt: new Date(),
            });

            // แสดง success alert
            setShowSuccessAlert(true);

        } catch (error: any) {
            console.error("Upload error:", error);
            setErrorMessage(error.message || "Failed to save book.");
            setBook(prev => ({...prev, step: 2}));
        } finally {
            setIsLoading(false); // หยุด loading
        }
    };

    // ================= HANDLE SCAN RESULT =================
    const handleScan = (result: ScanResult) => {
        setBook(prev => ({...prev, isbn: result.isbn}));
        fetchBook(result.isbn);
        setScanVisible(false);
    };

    // ================= DATE PICKER FUNCTIONS =================
    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const handleDateChange = (event: any, selectedDate?: Date) => {
        const currentDate = selectedDate || new Date();
        setShowDatePicker(false);
        setSelectedDate(currentDate);
        setBook(prev => ({...prev, acquisitionDate: formatDate(currentDate)}));
    };

    // ================= RENDER INPUT REUSABLE =================
    const renderInput = (label: string, value: string, onChange: (v: string) => void, type: "text" | "numeric", icon: any) => (
        <View style={{marginBottom: 12}}>
            <Text style={styles.label}>{label}</Text>
            <View style={styles.inputContainer}>
                <Ionicons name={icon} size={20} color="#6b7280" style={styles.inputIcon}/>
                <TextInput
                    style={styles.input}
                    value={value}
                    onChangeText={onChange}
                    keyboardType={type === "numeric" ? "numeric" : "default"}
                />
            </View>
        </View>
    );

    // ================= RENDER =================
    const totalSteps = 3;
    const progressPercent = Math.round((book.step / totalSteps) * 100);

    return (
        <View style={{flex: 1, backgroundColor: "#f9fafb"}}>
            {/* Header with consistent theme */}
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <Text style={styles.headerTitle}>
                        <Ionicons name="add-circle" size={24} color="#6366f1"/>
                        {' '}Add New Book
                    </Text>
                    <Text style={styles.headerCount}>
                        Step {book.step} of {totalSteps}
                    </Text>
                </View>
            </View>

            <KeyboardAvoidingView
                style={{flex: 1}}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
                <ScrollView style={{paddingHorizontal: 16}} contentContainerStyle={{paddingBottom: 40}}
                            keyboardShouldPersistTaps="handled" ref={scrollViewRef}>
                    {/* Progress Bar */}
                    <View style={styles.progressContainer}>
                        <View style={styles.progressBar}>
                            <View style={[styles.progressFill, {width: `${progressPercent}%`}]}/>
                        </View>
                    </View>

                    {/* Card */}
                    <View style={styles.card}>
                        {/* Step 1 */}
                        {book.step === 1 && (
                            <View>
                                <Text style={styles.label}>ISBN (Optional)</Text>
                                <View style={styles.inputContainer}>
                                    <Ionicons name="barcode-outline" size={20} color="#6b7280"
                                              style={styles.inputIcon}/>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="9780000000000"
                                        value={book.isbn}
                                        onChangeText={v => setBook(prev => ({...prev, isbn: v}))}
                                        keyboardType="numeric"
                                    />
                                </View>
                                <Text style={styles.orText}>OR</Text>
                                <Text style={styles.label}>Title (Optional)</Text>
                                <View style={styles.inputContainer}>
                                    <Ionicons name="book-outline" size={20} color="#6b7280" style={styles.inputIcon}/>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter book title"
                                        value={book.title}
                                        onChangeText={v => setBook(prev => ({...prev, title: v}))}
                                    />
                                </View>

                                {errorMessage ? (
                                    <View style={styles.errorBox}>
                                        <Text style={styles.errorText}>{errorMessage}</Text>
                                    </View>
                                ) : null}

                                <Text style={styles.orText}>_____________________________________________</Text>

                                <TouchableOpacity style={styles.primaryButton} onPress={() => fetchBook()}>
                                    <Text style={styles.buttonText}>Fetch Book</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.secondaryButton} onPress={() => setScanVisible(true)}>
                                    <Text style={styles.secondaryButtonText}>Scan ISBN (Mobile)</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.secondaryButton} onPress={nextStep}>
                                    <Text style={styles.secondaryButtonText}>Add Manually</Text>
                                </TouchableOpacity>

                                <ScanModal visible={scanVisible} onClose={() => setScanVisible(false)}
                                           onScan={handleScan}/>
                            </View>
                        )}

                        {/* Step 2 */}
                        {book.step === 2 && (
                            <View>
                                <Text style={styles.label}>Cover Image</Text>

                                {/* แสดงรูปที่เลือก/ถ่ายแล้ว */}
                                {book.coverImage ? (
                                    <View style={styles.imagePreviewContainer}>
                                        <Image source={{uri: `data:image/jpeg;base64,${book.coverImage}`}}
                                               style={styles.previewImage}/>
                                        <TouchableOpacity
                                            style={styles.removeImageButton}
                                            onPress={() => setBook(prev => ({...prev, coverImage: null}))}
                                        >
                                            <Ionicons name="close-circle" size={24} color="#ef4444"/>
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                    <View style={styles.imageOptionsContainer}>
                                        <TouchableOpacity onPress={takeCoverPhoto} style={styles.imageOptionButton}>
                                            <Ionicons name="camera" size={24} color="#4F46E5"/>
                                            <Text style={styles.imageOptionText}>Take Photo</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity onPress={pickCoverImage} style={styles.imageOptionButton}>
                                            <Ionicons name="image" size={24} color="#4F46E5"/>
                                            <Text style={styles.imageOptionText}>From Gallery</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}

                                {/* Title input with error */}
                                <View style={{marginBottom: 12}}>
                                    <Text style={styles.label}>Title *</Text>
                                    <View style={[
                                        styles.inputContainer,
                                        !book.title && errorMessage && styles.inputError
                                    ]}>
                                        <Ionicons name="text-outline" size={20} color="#6b7280"
                                                  style={styles.inputIcon}/>
                                        <TextInput
                                            style={styles.input}
                                            value={book.title}
                                            onChangeText={v => {
                                                setBook(prev => ({...prev, title: v}));
                                                if (v) setErrorMessage(""); // พิมพ์แล้วลบ error
                                            }}
                                        />
                                    </View>
                                    {!book.title && errorMessage ? (
                                        <Text style={styles.errorText}>Please enter Title</Text>
                                    ) : null}
                                </View>

                                {/* Inputs อื่น ๆ */}
                                {renderInput("Authors", book.authors, v => setBook(prev => ({
                                    ...prev,
                                    authors: v
                                })), "text", "people-outline")}
                                {renderInput("Publisher", book.publisher, v => setBook(prev => ({
                                    ...prev,
                                    publisher: v
                                })), "text", "business-outline")}
                                {renderInput("Year", book.year, v => setBook(prev => ({
                                    ...prev,
                                    year: v
                                })), "numeric", "calendar-outline")}
                                
                                {renderInput("Language", book.language, v => setBook(prev => ({
                                    ...prev,
                                    language: v
                                })), "text", "globe-outline")}

                                {renderInput("Binding", book.binding, v => setBook(prev => ({
                                    ...prev,
                                    binding: v
                                })), "text", "book-outline")}


                                {renderInput("ISBN", book.isbn, v => setBook(prev => ({
                                    ...prev,
                                    isbn: v
                                })), "numeric", "barcode-outline")}
                                {renderInput("Source", book.acquisitionSource, v => setBook(prev => ({
                                    ...prev,
                                    acquisitionSource: v
                                })), "text", "cart-outline")}
                                <View style={{marginBottom: 12}}>
                                    <Text style={styles.label}>Acquisition Date</Text>
                                    <TouchableOpacity onPress={() => setShowDatePicker(true)}
                                                      style={styles.datePickerButton}>
                                        <Text style={styles.datePickerText}>
                                            {book.acquisitionDate ? book.acquisitionDate : "Select acquisition date"}
                                        </Text>
                                        <Ionicons name="calendar-outline" size={20} color="#6b7280"
                                                  style={styles.datePickerIcon}/>
                                    </TouchableOpacity>
                                    {showDatePicker && (
                                        <DateTimePicker
                                            value={selectedDate}
                                            mode="date"
                                            display="default"
                                            onChange={handleDateChange}
                                            style={{width: "100%"}}
                                        />
                                    )}
                                </View>
                                {renderInput("Purchase Price", book.purchasePrice, v => setBook(prev => ({
                                    ...prev,
                                    purchasePrice: v
                                })), "numeric", "cash-outline")}

                                {/* Collection Selection */}
                                <View style={{marginBottom: 12}}>
                                    <Text style={styles.label}>Collection (Optional)</Text>

                                    {/* Existing collections */}
                                    {collections.length > 0 && (
                                        <View style={styles.collectionList}>
                                            {collections.map(collection => (
                                                <TouchableOpacity
                                                    key={collection.id}
                                                    style={[
                                                        styles.collectionItem,
                                                        book.collectionId === collection.id && styles.collectionItemSelected
                                                    ]}
                                                    onPress={() => setBook(prev => ({
                                                        ...prev,
                                                        collectionId: collection.id
                                                    }))}
                                                >
                                                    <Text style={[
                                                        styles.collectionItemText,
                                                        book.collectionId === collection.id && {color: '#fff'}
                                                    ]}>
                                                        {collection.name}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    )}

                                    {/* New collection input */}
                                    {showNewCollectionInput ? (
                                        <View style={styles.newCollectionContainer}>
                                            <TextInput
                                                style={styles.newCollectionInput}
                                                placeholder="Enter new collection name"
                                                value={newCollectionName}
                                                onChangeText={setNewCollectionName}
                                            />
                                            <TouchableOpacity
                                                style={[styles.primaryButton, {marginTop: 0, minWidth: 80}]}
                                                onPress={createNewCollection}
                                            >
                                                <Text style={styles.buttonText}>Create</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                onPress={() => {
                                                    setShowNewCollectionInput(false);
                                                    setNewCollectionName("");
                                                }}
                                                style={{marginLeft: 8}}
                                            >
                                                <Text style={styles.cancelText}>Cancel</Text>
                                            </TouchableOpacity>
                                        </View>
                                    ) : (
                                        <TouchableOpacity
                                            style={[styles.secondaryButton, {marginTop: 0}]}
                                            onPress={() => setShowNewCollectionInput(true)}
                                        >
                                            <Text style={styles.secondaryButtonText}>+ Add New Collection</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>

                                {/* Actions */}
                                <View style={styles.row}>
                                    <TouchableOpacity style={styles.secondaryButton} onPress={prevStep}>
                                        <Text style={styles.secondaryButtonText}>Back</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.primaryButton}
                                        onPress={() => {
                                            if (!book.title) {
                                                setErrorMessage("Please enter Title");
                                                return;
                                            }
                                            setErrorMessage("");
                                            nextStep();
                                        }}
                                    >
                                        <Text style={styles.buttonText}>Next</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}

                        {/* Step 3 */}
                        {book.step === 3 && (
                            <View>
                                <Text style={styles.reviewTitle}>Review Book Info</Text>

                                {/* Book Cover */}
                                <View style={styles.reviewImageContainer}>
                                    {book.coverImage ? (
                                        <Image source={{uri: `data:image/jpeg;base64,${book.coverImage}`}}
                                               style={styles.reviewImage}/>
                                    ) : (
                                        <View style={styles.noImagePlaceholder}>
                                            <Ionicons name="book-outline" size={40} color="#9ca3af"/>
                                            <Text style={styles.noImageText}>No Cover Image</Text>
                                        </View>
                                    )}
                                </View>

                                {/* Book Details */}
                                <View style={styles.reviewDetailsContainer}>
                                    {book.title && (
                                        <View style={styles.reviewDetailItem}>
                                            <View style={styles.reviewDetailIcon}>
                                                <Ionicons name="text-outline" size={18} color="#111111"/>
                                            </View>
                                            <View style={styles.reviewDetailContent}>
                                                <Text style={styles.reviewDetailLabel}>Title</Text>
                                                <Text style={styles.reviewDetailValue}>{book.title}</Text>
                                            </View>
                                        </View>
                                    )}

                                    {book.authors && (
                                        <View style={styles.reviewDetailItem}>
                                            <View style={styles.reviewDetailIcon}>
                                                <Ionicons name="people-outline" size={18} color="#111111"/>
                                            </View>
                                            <View style={styles.reviewDetailContent}>
                                                <Text style={styles.reviewDetailLabel}>Authors</Text>
                                                <Text style={styles.reviewDetailValue}>{book.authors}</Text>
                                            </View>
                                        </View>
                                    )}

                                    {book.publisher && (
                                        <View style={styles.reviewDetailItem}>
                                            <View style={styles.reviewDetailIcon}>
                                                <Ionicons name="business-outline" size={18} color="#111111"/>
                                            </View>
                                            <View style={styles.reviewDetailContent}>
                                                <Text style={styles.reviewDetailLabel}>Publisher</Text>
                                                <Text style={styles.reviewDetailValue}>{book.publisher}</Text>
                                            </View>
                                        </View>
                                    )}

                                    {book.year && (
                                        <View style={styles.reviewDetailItem}>
                                            <View style={styles.reviewDetailIcon}>
                                                <Ionicons name="calendar-outline" size={18} color="#111111"/>
                                            </View>
                                            <View style={styles.reviewDetailContent}>
                                                <Text style={styles.reviewDetailLabel}>Year</Text>
                                                <Text style={styles.reviewDetailValue}>{book.year}</Text>
                                            </View>
                                        </View>
                                    )}

                                    {book.isbn && (
                                        <View style={styles.reviewDetailItem}>
                                            <View style={styles.reviewDetailIcon}>
                                                <Ionicons name="barcode-outline" size={18} color="#111111"/>
                                            </View>
                                            <View style={styles.reviewDetailContent}>
                                                <Text style={styles.reviewDetailLabel}>ISBN</Text>
                                                <Text style={styles.reviewDetailValue}>{book.isbn}</Text>
                                            </View>
                                        </View>
                                    )}

                                    {book.language && (
                                        <View style={styles.reviewDetailItem}>
                                            <View style={styles.reviewDetailIcon}>
                                                <Ionicons name="language-outline" size={18} color="#111111"/>
                                            </View>
                                            <View style={styles.reviewDetailContent}>
                                                <Text style={styles.reviewDetailLabel}>Language</Text>
                                                <Text style={styles.reviewDetailValue}>{book.language}</Text>
                                            </View>
                                        </View>
                                    )}

                                    {book.binding && (
                                        <View style={styles.reviewDetailItem}>
                                            <View style={styles.reviewDetailIcon}>
                                                <Ionicons name="library-outline" size={18} color="#111111"/>
                                            </View>
                                            <View style={styles.reviewDetailContent}>
                                                <Text style={styles.reviewDetailLabel}>Binding</Text>
                                                <Text style={styles.reviewDetailValue}>{book.binding}</Text>
                                            </View>
                                        </View>
                                    )}

                                    {book.acquisitionSource && (
                                        <View style={styles.reviewDetailItem}>
                                            <View style={styles.reviewDetailIcon}>
                                                <Ionicons name="cart-outline" size={18} color="#111111"/>
                                            </View>
                                            <View style={styles.reviewDetailContent}>
                                                <Text style={styles.reviewDetailLabel}>Source</Text>
                                                <Text style={styles.reviewDetailValue}>{book.acquisitionSource}</Text>
                                            </View>
                                        </View>
                                    )}

                                    {book.acquisitionDate && (
                                        <View style={styles.reviewDetailItem}>
                                            <View style={styles.reviewDetailIcon}>
                                                <Ionicons name="calendar-outline" size={18} color="#111111"/>
                                            </View>
                                            <View style={styles.reviewDetailContent}>
                                                <Text style={styles.reviewDetailLabel}>Acquisition Date</Text>
                                                <Text style={styles.reviewDetailValue}>{book.acquisitionDate}</Text>
                                            </View>
                                        </View>
                                    )}

                                    {book.purchasePrice && (
                                        <View style={styles.reviewDetailItem}>
                                            <View style={styles.reviewDetailIcon}>
                                                <Ionicons name="cash-outline" size={18} color="#111111"/>
                                            </View>
                                            <View style={styles.reviewDetailContent}>
                                                <Text style={styles.reviewDetailLabel}>Purchase Price</Text>
                                                <Text style={styles.reviewDetailValue}>{book.purchasePrice}</Text>
                                            </View>
                                        </View>
                                    )}

                                    {/* Collection Info */}
                                    {book.collectionId && (
                                        <View style={styles.reviewDetailItem}>
                                            <View style={styles.reviewDetailIcon}>
                                                <Ionicons name="folder-outline" size={18} color="#111111"/>
                                            </View>
                                            <View style={styles.reviewDetailContent}>
                                                <Text style={styles.reviewDetailLabel}>Collection</Text>
                                                <Text style={styles.reviewDetailValue}>
                                                    {collections.find(c => c.id === book.collectionId)?.name || 'Unknown Collection'}
                                                </Text>
                                            </View>
                                        </View>
                                    )}
                                </View>

                                <View style={styles.row}>
                                    <TouchableOpacity style={styles.secondaryButton} onPress={prevStep}>
                                        <Text style={styles.secondaryButtonText}>Back</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
                                        onPress={saveBook}
                                        disabled={isLoading}
                                    >
                                        {isLoading ? (
                                            <>
                                                <ActivityIndicator size="small" color="#fff" style={{marginRight: 8}}/>
                                                <Text style={styles.buttonText}>Saving...</Text>
                                            </>
                                        ) : (
                                            <>

                                                <Text style={styles.buttonText}>Save Book</Text>
                                            </>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    </View>

                    {/* Custom Success Alert */}
                    <CustomAlert
                        visible={showSuccessAlert}
                        title="Successfully Saved! 🎉"
                        message={`Book "${book.title}" has been added to your collection`}
                        type="success"
                        onClose={() => {
                            setShowSuccessAlert(false);
                            setBook({...defaultBook, step: 1});
                        }}
                    />
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

// ================= STYLES =================
const styles = StyleSheet.create({
    container: {flex: 1, backgroundColor: "#f9fafb", padding: 16},
    progressContainer: {marginBottom: 16},
    progressHeader: {flexDirection: "row", justifyContent: "space-between", marginBottom: 6},
    progressText: {fontSize: 13, fontWeight: "600", color: "#374151"},
    progressBar: {height: 6, backgroundColor: "#e5e7eb", borderRadius: 8},
    progressFill: {height: 6, backgroundColor: "#4F46E5", borderRadius: 8},
    card: {
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 20,
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowOffset: {width: 0, height: 2},
        shadowRadius: 4,
        elevation: 2,
    },
    label: {fontSize: 14, fontWeight: "500", color: "#374151", marginBottom: 6},
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 8,
        marginBottom: 12,
        paddingHorizontal: 12,
        paddingVertical: 4,
    },
    inputIcon: {marginRight: 8},
    input: {flex: 1, paddingVertical: 10, fontSize: 15, color: "#111827"},
    orText: {textAlign: "center", marginVertical: 10, color: "#6b7280"},
    primaryButton: {
        backgroundColor: "#4F46E5",
        paddingVertical: 14,
        paddingHorizontal: 20,
        minWidth: 100,
        borderRadius: 10,
        marginTop: 8,
        alignItems: "center",
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowOffset: {width: 0, height: 2},
        shadowRadius: 3,
        elevation: 3,
    },
    buttonText: {color: "#fff", fontWeight: "600", fontSize: 15},
    buttonDisabled: {
        opacity: 0.6,
    },
    secondaryButton: {
        borderWidth: 1,
        borderColor: "#D1D5DB",
        paddingVertical: 14,
        paddingHorizontal: 20,
        minWidth: 100,
        borderRadius: 10,
        marginTop: 8,
        alignItems: "center",
        backgroundColor: "#F9FAFB",
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowOffset: {width: 0, height: 1},
        shadowRadius: 2,
        elevation: 1,
    },
    secondaryButtonText: {color: "#374151", fontWeight: "500", fontSize: 14},
    row: {flexDirection: "row", justifyContent: "space-between", marginTop: 20, gap: 10},
    imageButton: {
        width: 150,
        height: 220,
        backgroundColor: "#F3F4F6",
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 8,
        marginBottom: 16,
        alignSelf: "center",
    },
    buttonImage: {width: "100%", height: "100%", borderRadius: 8, resizeMode: "cover"},
    image: {width: 150, height: 220, marginVertical: 8, borderRadius: 8, alignSelf: "center"},
    reviewTitle: {fontSize: 16, fontWeight: "600", marginBottom: 12, textAlign: "center"},
    buttonGroup: {flexDirection: "row", marginVertical: 8, gap: 10},
    optionButton: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        backgroundColor: "#E5E7EB",
    },
    optionButtonSelected: {backgroundColor: "#4F46E5"},
    optionButtonText: {color: "#374151", fontWeight: "500"},
    optionButtonTextSelected: {color: "#fff", fontWeight: "600"},
    errorBox: {
        backgroundColor: "#FEE2E2",
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 12,
        marginTop: 8,
    },
    errorText: {
        color: "#B91C1C",
        fontSize: 14,
        textAlign: "center",
    },
    inputError: {
        borderColor: "#B91C1C",
    },
    collectionList: {
        marginTop: 12,
        marginBottom: 16,
    },
    collectionItem: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        backgroundColor: "#E5E7EB",
        marginBottom: 8,
    },
    collectionItemSelected: {
        backgroundColor: "#4F46E5",
    },
    collectionItemText: {
        color: "#374151",
        fontWeight: "500",
    },
    newCollectionContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 12,
        marginBottom: 16,
    },
    newCollectionInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: "#D1D5DB",
        borderRadius: 8,
        paddingVertical: 10,
        paddingHorizontal: 12,
        marginRight: 8,
    },
    cancelText: {
        color: "#6b7280",
        fontSize: 14,
        marginTop: 8,
        textAlign: "center",
    },
    // Review Section Styles
    reviewImageContainer: {
        width: "100%",
        height: 250,
        borderRadius: 12,
        overflow: "hidden",
        backgroundColor: "#f8fafc",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 20,
        borderWidth: 1,
        borderColor: "#e2e8f0",
    },
    reviewImage: {
        width: "100%",
        height: "100%",
        resizeMode: "cover",
    },
    noImagePlaceholder: {
        justifyContent: "center",
        alignItems: "center",
        gap: 8,
    },
    noImageText: {
        color: "#9ca3af",
        fontSize: 14,
        fontWeight: "500",
    },
    reviewDetailsContainer: {
        gap: 16,
        marginBottom: 20,
    },
    reviewDetailItem: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#f8fafc",
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 10,
        borderLeftWidth: 3,
        borderLeftColor: "#e2e8f0",
    },
    reviewDetailIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(255, 255, 255, 0.8)",
        marginRight: 12,
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowOffset: {width: 0, height: 1},
        shadowRadius: 2,
        elevation: 2,
    },
    reviewDetailContent: {
        flex: 1,
    },
    reviewDetailLabel: {
        fontSize: 12,
        fontWeight: "600",
        color: "#6b7280",
        textTransform: "uppercase",
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    reviewDetailValue: {
        fontSize: 15,
        fontWeight: "600",
        color: "#1f2937",
        lineHeight: 20,
    },
    // Date Picker Button Styles
    datePickerButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 12,
        marginBottom: 12,
        backgroundColor: "#fff",
    },
    datePickerText: {
        flex: 1,
        fontSize: 15,
        color: "#111827",
    },
    datePickerIcon: {
        marginLeft: 8,
    },
    imagePreviewContainer: {
        position: "relative",
        width: "100%",
        height: 220,
        borderRadius: 8,
        overflow: "hidden",
        marginBottom: 16,
    },
    previewImage: {
        width: "100%",
        height: "100%",
        resizeMode: "cover",
    },
    removeImageButton: {
        position: "absolute",
        top: 8,
        right: 8,
        backgroundColor: "#fff",
        borderRadius: 50,
        padding: 4,
        shadowColor: "#000",
        shadowOpacity: 0.2,
        shadowOffset: {width: 0, height: 2},
        shadowRadius: 4,
        elevation: 2,
    },
    imageOptionsContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 8,
        gap: 10,
        marginBottom: 8,
    },
    imageOptionButton: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 12,
        borderRadius: 8,
        backgroundColor: "#E5E7EB",
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowOffset: {width: 0, height: 1},
        shadowRadius: 2,
        elevation: 1,
    },
    imageOptionText: {
        marginLeft: 8,
        color: "#374151",
        fontWeight: "500",
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
