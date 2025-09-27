
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect } from "expo-router";
import type { Auth } from "firebase/auth";
import { addDoc, collection } from "firebase/firestore";
import { useCallback, useState } from "react";
import { Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
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
};

export default function Add() {
  const [book, setBook] = useState({ ...defaultBook });
  const [scanVisible, setScanVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState(""); // สำหรับข้อความสีแดง

  useFocusEffect(
    useCallback(() => {
      setBook({ ...defaultBook });
      setErrorMessage("");
    }, [])
  );

  const nextStep = () => {
    setErrorMessage(""); // ล้าง error ทุกครั้ง
    setBook(prev => ({ ...prev, step: prev.step + 1 }));
  };
  const prevStep = () => {
    setErrorMessage("");
    setBook(prev => ({ ...prev, step: prev.step - 1 }));
  };

  // ================= FETCH FROM ISBN or TITLE =================
  const fetchBook = async (query?: string) => {
    const search = query || book.isbn || book.title;
    if (!search) return;

    const bookData: BookData | null = await fetchBookByQuery(search);
    if (bookData) {
      setBook(prev => ({ ...prev, ...bookData }));
      setErrorMessage("");
      setTimeout(nextStep, 100);
    } else {
      setErrorMessage("ไม่พบข้อมูลจาก ISBN/Title นี้");
    }
  };

  // ================= IMAGE PICKER =================
  const pickCoverImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      return setErrorMessage("Permission Denied: Please allow access to your photo library.");
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        base64: true,
        allowsEditing: true,
        aspect: [150, 220],
        quality: 0.7,
      });

      if (!result.canceled && result.assets.length > 0) {
        setBook(prev => ({ ...prev, coverImage: result.assets[0].base64 || null }));
      }
    } catch (error) {
      console.error("ImagePicker error:", error);
      setErrorMessage((error as Error).message);
    }
  };

  // ================= SAVE BOOK =================
  const saveBook = async () => {
    if (!book.title) {
      setErrorMessage("กรุณากรอก Title ก่อนบันทึก");
      setBook(prev => ({ ...prev, step: 2 })); // กลับไป Step 2
      return;
    }
    if (!typedAuth.currentUser) {
      setErrorMessage("User not logged in");
      setBook(prev => ({ ...prev, step: 2 }));
      return;
    }

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
        createdAt: new Date(),
      });

      setErrorMessage(""); // ล้างข้อความ error
      setBook({ ...defaultBook, step: 1 });
    } catch (error: any) {
      console.error("Upload error:", error);
      setErrorMessage(error.message || "Failed to save book.");
      setBook(prev => ({ ...prev, step: 2 }));
    }
  };

  // ================= HANDLE SCAN RESULT =================
  const handleScan = (result: ScanResult) => {
    setBook(prev => ({ ...prev, isbn: result.isbn }));
    fetchBook(result.isbn);
    setScanVisible(false);
  };

  // ================= RENDER INPUT REUSABLE =================
  const renderInput = (label: string, value: string, onChange: (v: string) => void, type: "text" | "numeric", icon: any) => (
    <View style={{ marginBottom: 12 }}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputContainer}>
        <Ionicons name={icon} size={20} color="#6b7280" style={styles.inputIcon} />
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
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 120 }} keyboardShouldPersistTaps="handled">
      {/* Progress Header */}
      <View style={styles.progressContainer}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressText}>Step {book.step} of {totalSteps}</Text>
          <Text style={styles.progressText}>{progressPercent}%</Text>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
        </View>
      </View>

      {/* Card */}
      <View style={styles.card}>
        {/* Step 1 */}
        {book.step === 1 && (
          <View>
            <Text style={styles.label}>ISBN (Optional)</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="barcode-outline" size={20} color="#6b7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="9780000000000"
                value={book.isbn}
                onChangeText={v => setBook(prev => ({ ...prev, isbn: v }))}
                keyboardType="numeric"
              />
            </View>
            <Text style={styles.orText}>OR</Text>
            <Text style={styles.label}>Title (Optional)</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="book-outline" size={20} color="#6b7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter book title"
                value={book.title}
                onChangeText={v => setBook(prev => ({ ...prev, title: v }))}
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

            <ScanModal visible={scanVisible} onClose={() => setScanVisible(false)} onScan={handleScan} />
          </View>
        )}

        {/* Step 2 */}
        {book.step === 2 && (
          <View>
            <Text style={styles.label}>Cover Image</Text>
            <TouchableOpacity onPress={pickCoverImage} style={styles.imageButton}>
              {book.coverImage ? (
                <Image source={{ uri: `data:image/jpeg;base64,${book.coverImage}` }} style={styles.buttonImage} />
              ) : (
                <Text style={{ color: "#6b7280" }}>Pick Cover Image</Text>
              )}
            </TouchableOpacity>

            {/* Title input with error */}
            <View style={{ marginBottom: 12 }}>
              <Text style={styles.label}>Title *</Text>
              <View style={[
                styles.inputContainer,
                !book.title && errorMessage && styles.inputError
              ]}>
                <Ionicons name="text-outline" size={20} color="#6b7280" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={book.title}
                  onChangeText={v => {
                    setBook(prev => ({ ...prev, title: v }));
                    if (v) setErrorMessage(""); // พิมพ์แล้วลบ error
                  }}
                />
              </View>
              {!book.title && errorMessage ? (
                <Text style={styles.errorText}>กรุณากรอก Title</Text>
              ) : null}
            </View>

            {/* Inputs อื่น ๆ */}
            {renderInput("Authors", book.authors, v => setBook(prev => ({ ...prev, authors: v })), "text", "people-outline")}
            {renderInput("Publisher", book.publisher, v => setBook(prev => ({ ...prev, publisher: v })), "text", "business-outline")}
            {renderInput("Year", book.year, v => setBook(prev => ({ ...prev, year: v })), "numeric", "calendar-outline")}
            {renderInput("ISBN", book.isbn, v => setBook(prev => ({ ...prev, isbn: v })), "numeric", "barcode-outline")}
            {renderInput("Source", book.acquisitionSource, v => setBook(prev => ({ ...prev, acquisitionSource: v })), "text", "cart-outline")}
            {renderInput("Acquisition Date", book.acquisitionDate, v => setBook(prev => ({ ...prev, acquisitionDate: v })), "text", "calendar-outline")}
            {renderInput("Purchase Price", book.purchasePrice, v => setBook(prev => ({ ...prev, purchasePrice: v })), "numeric", "cash-outline")}

            {/* Actions */}
            <View style={styles.row}>
              <TouchableOpacity style={styles.secondaryButton} onPress={prevStep}>
                <Text style={styles.secondaryButtonText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => {
                  if (!book.title) {
                    setErrorMessage("กรุณากรอก Title");
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
            {book.coverImage && <Image source={{ uri: `data:image/jpeg;base64,${book.coverImage}` }} style={styles.image} />}
            <Text>ISBN: {book.isbn}</Text>
            <Text>Title: {book.title}</Text>
            <Text>Authors: {book.authors}</Text>
            <Text>Publisher: {book.publisher}</Text>
            <Text>Year: {book.year}</Text>
            <Text>Language: {book.language}</Text>
            <Text>Binding: {book.binding}</Text>
            <Text>Source: {book.acquisitionSource}</Text>
            <Text>Acquisition Date: {book.acquisitionDate}</Text>
            <Text>Purchase Price: {book.purchasePrice}</Text>

            <View style={styles.row}>
              <TouchableOpacity style={styles.secondaryButton} onPress={prevStep}>
                <Text style={styles.secondaryButtonText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryButton} onPress={saveBook}>
                <Text style={styles.buttonText}>Save Book</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

// ================= STYLES =================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb", padding: 16 },
  progressContainer: { marginBottom: 16 },
  progressHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  progressText: { fontSize: 13, fontWeight: "600", color: "#374151" },
  progressBar: { height: 6, backgroundColor: "#e5e7eb", borderRadius: 8 },
  progressFill: { height: 6, backgroundColor: "#4F46E5", borderRadius: 8 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  label: { fontSize: 14, fontWeight: "500", color: "#374151", marginBottom: 6 },
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
  inputIcon: { marginRight: 8 },
  input: { flex: 1, paddingVertical: 10, fontSize: 15, color: "#111827" },
  orText: { textAlign: "center", marginVertical: 10, color: "#6b7280" },
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
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
    elevation: 3,
  },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 15 },
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
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 1,
  },
  secondaryButtonText: { color: "#374151", fontWeight: "500", fontSize: 14 },
  row: { flexDirection: "row", justifyContent: "space-between", marginTop: 20, gap: 10 },
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
  buttonImage: { width: "100%", height: "100%", borderRadius: 8, resizeMode: "cover" },
  image: { width: 150, height: 220, marginVertical: 8, borderRadius: 8, alignSelf: "center" },
  reviewTitle: { fontSize: 16, fontWeight: "600", marginBottom: 12, textAlign: "center" },
  buttonGroup: { flexDirection: "row", marginVertical: 8, gap: 10 },
  optionButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#E5E7EB",
  },
  optionButtonSelected: { backgroundColor: "#4F46E5" },
  optionButtonText: { color: "#374151", fontWeight: "500" },
  optionButtonTextSelected: { color: "#fff", fontWeight: "600" },
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
  }
});