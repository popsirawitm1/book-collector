// app/(tabs)/add.tsx
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect } from "expo-router";
import type { Auth } from "firebase/auth";
import { addDoc, collection } from "firebase/firestore";
import { useCallback, useState } from "react";
import { Alert, Button, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { auth, db } from "../../configs/firebase";
import { BookData, fetchBookByISBN, ScanModal, ScanResult } from "../lib/scan";

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

  useFocusEffect(
    useCallback(() => {
      setBook({ ...defaultBook });
    }, [])
  );

  const nextStep = () => setBook(prev => ({ ...prev, step: prev.step + 1 }));
  const prevStep = () => setBook(prev => ({ ...prev, step: prev.step - 1 }));

  // ================= FETCH FROM ISBN =================
  const fetchBook = async (isbn?: string) => {
    const query = isbn || book.isbn;
    if (!query) return;
    const bookData: BookData | null = await fetchBookByISBN(query);
    if (bookData) {
      setBook(prev => ({ ...prev, ...bookData }));
      setTimeout(nextStep, 100);
    } else {
      Alert.alert("ไม่พบหนังสือ", "ไม่พบข้อมูลจาก ISBN นี้");
    }
  };

  // ================= IMAGE PICKER =================
  const pickCoverImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      return Alert.alert("Permission Denied", "Please allow access to your photo library.");
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        base64: true, // สำคัญ! ใช้ base64 แทน uri
        allowsEditing: true,
        aspect: [150, 220],
        quality: 0.7,
      });

      if (!result.canceled && result.assets.length > 0) {
        setBook(prev => ({ ...prev, coverImage: result.assets[0].base64 || null }));
      }
    } catch (error) {
      console.error("ImagePicker error:", error);
      Alert.alert("Error picking image", (error as Error).message);
    }
  };

  const renderButtonGroup = (options: { label: string; value: string }[], value: string, setValue: (v: string) => void) => (
    <View style={{ flexDirection: "row", marginVertical: 8 }}>
      {options.map(opt => (
        <TouchableOpacity
          key={opt.value}
          onPress={() => setValue(opt.value)}
          style={{ backgroundColor: value === opt.value ? "blue" : "gray", paddingVertical: 8, paddingHorizontal: 16, borderRadius: 5, marginRight: 10 }}
        >
          <Text style={{ color: "white" }}>{opt.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  // ================= SAVE BOOK =================
  const saveBook = async () => {
    if (!book.title || !book.authors) {
      return Alert.alert("กรุณากรอก Title และ Authors ก่อนบันทึก");
    }
  if (!typedAuth.currentUser) return Alert.alert("Error", "User not logged in");

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
        coverImage: book.coverImage, // เก็บ Base64 ตรงๆ
        createdAt: new Date(),
      });

      Alert.alert("Saved", "Book data has been saved to Firestore!");
      setBook({ ...defaultBook, step: 1 });
    } catch (error: any) {
      console.error("Upload error:", error);
      Alert.alert("Upload error", error.message || "Failed to save book.");
    }
  };

  // ================= HANDLE SCAN RESULT =================
  const handleScan = (result: ScanResult) => {
    setBook(prev => ({ ...prev, isbn: result.isbn }));
    fetchBook(result.isbn);
    setScanVisible(false);
  };

  // ================= RENDER =================
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 200 }} keyboardShouldPersistTaps="handled">
      <Text style={styles.header}>Step {book.step} of 3</Text>

      {/* Step 1 */}
      {book.step === 1 && (
        <View>
          <Text>ISBN (Optional)</Text>
          <TextInput style={styles.input} placeholder="9780000000000" value={book.isbn} onChangeText={v => setBook(prev => ({ ...prev, isbn: v }))} keyboardType="numeric" />
          <Text>OR</Text>
          <TextInput style={styles.input} placeholder="Enter book title" value={book.title} onChangeText={v => setBook(prev => ({ ...prev, title: v }))} />

          <Button title="Fetch from ISBN" onPress={() => fetchBook()} />
          <Text> </Text>
          <Button title="Scan ISBN (Mobile)" onPress={() => setScanVisible(true)} />
          <Text> </Text>
          <Button title="Add Manually" onPress={nextStep} />

          <ScanModal visible={scanVisible} onClose={() => setScanVisible(false)} onScan={handleScan} />
        </View>
      )}

      {/* Step 2 */}
      {book.step === 2 && (
        <View>
          <Text>Cover Image</Text>
          <TouchableOpacity onPress={pickCoverImage} style={{ ...styles.imageButton, width: 150, height: 220, marginVertical: 8 }}>
            {book.coverImage ? (
              <Image source={{ uri: `data:image/jpeg;base64,${book.coverImage}` }} style={styles.buttonImage} />
            ) : (
              <Text style={styles.buttonText}>Pick Cover Image</Text>
            )}
          </TouchableOpacity>

          <Text>Title *</Text>
          <TextInput
            style={styles.input}
            value={book.title}
            onChangeText={v => setBook(prev => ({ ...prev, title: v }))}
          />

          <Text>Authors *</Text>
          <TextInput
            style={styles.input}
            value={book.authors}
            onChangeText={v => setBook(prev => ({ ...prev, authors: v }))}
          />

          <Text>Publisher</Text>
          <TextInput
            style={styles.input}
            value={book.publisher}
            onChangeText={v => setBook(prev => ({ ...prev, publisher: v }))}
          />

          <Text>Year</Text>
          <TextInput
            style={styles.input}
            value={book.year}
            onChangeText={v => setBook(prev => ({ ...prev, year: v }))}
            keyboardType="numeric"
          />

          <Text>ISBN</Text>
          <TextInput
            style={styles.input}
            value={book.isbn}
            onChangeText={v => setBook(prev => ({ ...prev, isbn: v }))}
            keyboardType="numeric"
            placeholder="9780000000000"
          />

          <Text>Language</Text>
          {renderButtonGroup(
            [
              { label: "English", value: "English" },
              { label: "Thai", value: "Thai" },
            ],
            book.language,
            v => setBook(prev => ({ ...prev, language: v }))
          )}

          <Text>Binding</Text>
          {renderButtonGroup(
            [
              { label: "Hardcover", value: "Hardcover" },
              { label: "Paperback", value: "Paperback" },
            ],
            book.binding,
            v => setBook(prev => ({ ...prev, binding: v }))
          )}

          <Text>Source</Text>
          <TextInput
            style={styles.input}
            value={book.acquisitionSource}
            onChangeText={v => setBook(prev => ({ ...prev, acquisitionSource: v }))}
          />

          <Text>Acquisition Date</Text>
          <TextInput
            style={styles.input}
            value={book.acquisitionDate}
            onChangeText={v => setBook(prev => ({ ...prev, acquisitionDate: v }))}
            placeholder="DD/MM/YYYY"
          />

          <Text>Purchase Price</Text>
          <TextInput
            style={styles.input}
            value={book.purchasePrice}
            onChangeText={v => setBook(prev => ({ ...prev, purchasePrice: v }))}
            keyboardType="numeric"
          />

          <View style={styles.buttonRow}>
            <Button title="Back" onPress={prevStep} />
            <Button title="Next" onPress={nextStep} />
          </View>
        </View>
      )}


      {/* Step 3 */}
      {book.step === 3 && (
        <View>
          <Text style={{ fontWeight: "bold", fontSize: 16, marginBottom: 8 }}>Review Book Info</Text>
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

          <View style={styles.buttonRow}>
            <Button title="Back" onPress={prevStep} />
            <Button title="Save Book" onPress={saveBook} />
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  header: { fontSize: 18, fontWeight: "bold", marginBottom: 16 },
  input: { borderWidth: 1, borderColor: "#ccc", padding: 8, marginVertical: 8, borderRadius: 4 },
  buttonRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 16 },
  imageButton: { backgroundColor: "#ccc", justifyContent: "center", alignItems: "center", borderRadius: 5 },
  buttonImage: { width: "100%", height: "100%", borderRadius: 5, resizeMode: "cover" },
  buttonText: { color: "white", fontWeight: "bold" },
  image: { width: 150, height: 220, marginVertical: 8, resizeMode: "cover" },
});
