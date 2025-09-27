import React, { useEffect, useState } from "react";
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
} from "react-native";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { auth, db } from "../../configs/firebase";
import { collection, onSnapshot, query, where } from "firebase/firestore";

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
}

const FILTER_TABS = [
  { label: "All", value: "all" },
  { label: "Hardcover", value: "hardcover" },
  { label: "First Editions", value: "first" },
];

export default function BookPage() {
  const navigation = useNavigation<NavigationProp<any>>();
  const [search, setSearch] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("all");
  const [filterVisible, setFilterVisible] = useState<boolean>(false);

  // ฟิลเตอร์เพิ่มเติม
  const [authorFilter, setAuthorFilter] = useState<string>("");
  const [yearFilter, setYearFilter] = useState<string>("");

  // State สำหรับหนังสือที่ดึงมาจาก Firestore
  const [books, setBooks] = useState<Book[]>([]);

  // ดึงข้อมูลหนังสือจาก Firestore
  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(
      collection(db, "books"),
      where("userId", "==", auth.currentUser.uid)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: Book[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        title: doc.data().title || "",
        author: doc.data().authors || "",
        publisher: doc.data().publisher || "",
        year: doc.data().year || "",
        image: doc.data().coverImage
          ? `data:image/jpeg;base64,${doc.data().coverImage}`
          : "https://i.ibb.co/3WpzD7y/book-open.jpg",
        price: Number(doc.data().purchasePrice) || 0,
        condition: doc.data().condition || "",
        edition: doc.data().edition || "",
        type: doc.data().binding || "",
        shelf: doc.data().shelf || "",
        read: false, // ปรับตาม field จริงถ้ามี
      }));
      setBooks(data);
    });
    return () => unsubscribe();
  }, []);

  // ฟิลเตอร์ logic
  const filteredBooks = books.filter((book) => {
    const matchSearch =
      book.title.toLowerCase().includes(search.toLowerCase()) ||
      book.author.toLowerCase().includes(search.toLowerCase());

    let matchTab = true;
    if (activeTab === "hardcover") matchTab = book.type.toLowerCase() === "hardcover";
    if (activeTab === "first") matchTab = book.edition.toLowerCase().includes("first");

    const matchAuthor = authorFilter ? book.author.toLowerCase().includes(authorFilter.toLowerCase()) : true;
    const matchYear = yearFilter ? book.year === yearFilter : true;

    return matchSearch && matchTab && matchAuthor && matchYear;
  });

  const resetFilter = () => {
    setAuthorFilter("");
    setYearFilter("");
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      {/* Header + Book count + Filter button */}
      <View style={styles.headerRow}>
        <Text style={styles.bookCount}>
          {filteredBooks.length} of {books.length} books
        </Text>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setFilterVisible(true)}
        >
          <Ionicons name="filter" size={20} color="#fff" style={{ marginRight: 6 }} />
          <Text style={styles.filterButtonText}>Filter</Text>
        </TouchableOpacity>
      </View>

      {/* Search bar */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color="#9ca3af" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search books, authors..."
          placeholderTextColor="#9ca3af"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Filter Tabs */}
      <View style={{ flexDirection: "row", marginHorizontal: 16, marginTop: 16 }}>
        {FILTER_TABS.map((tab) => (
          <TouchableOpacity
            key={tab.value}
            onPress={() => setActiveTab(tab.value)}
            style={[styles.tab, activeTab === tab.value && styles.tabActive]}
          >
            <Text style={{ color: activeTab === tab.value ? "#fff" : "#555", fontWeight: "bold" }}>
              {tab.label} (
              {tab.value === "all"
                ? books.length
                : books.filter((b) => {
                    if (tab.value === "hardcover") return b.type.toLowerCase() === "hardcover";
                    if (tab.value === "first") return b.edition.toLowerCase().includes("first");
                    return true;
                  }).length}
              )
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Filter Modal */}
      <Modal visible={filterVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.title}>Filter Options</Text>
            <Text style={styles.label}>Author</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter author name"
              value={authorFilter}
              onChangeText={setAuthorFilter}
            />
            <Text style={styles.label}>Published Year</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 1987"
              value={yearFilter}
              onChangeText={setYearFilter}
              keyboardType="numeric"
            />
            <View style={styles.buttonRow}>
              <Button title="Apply" onPress={() => setFilterVisible(false)} />
              <Button title="Reset" onPress={resetFilter} />
            </View>
            <Button title="Close" onPress={() => setFilterVisible(false)} />
          </View>
        </View>
      </Modal>

      {/* Books */}
      <ScrollView style={{ marginTop: 16, paddingHorizontal: 16 }}>
        {filteredBooks.length === 0 ? (
          <Text style={{ textAlign: "center", marginTop: 32, color: "#888" }}>No books found.</Text>
        ) : (
          filteredBooks.map((book) => (
            <TouchableOpacity key={book.id} style={styles.card} onPress={() => navigation.navigate("BookDetail", { book })}>
              <Image source={{ uri: book.image }} style={styles.image} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.bookTitle}>{book.title}</Text>
                <Text style={styles.bookAuthor}>{book.author}</Text>
                <Text style={styles.bookPublisher}>
                  {book.publisher} • {book.year}
                </Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 4 }}>
                  {book.edition ? <Text style={styles.badge}>{book.edition}</Text> : null}
                  {book.type ? <Text style={styles.badge}>{book.type}</Text> : null}
                  {book.condition ? <Text style={styles.badgeGreen}>{book.condition}</Text> : null}
                </View>
                <Text style={styles.price}>฿{book.price}</Text>
                <Text style={styles.shelf}>{book.shelf}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginTop: 16,
  },
  bookCount: {
    fontSize: 16,
    color: "#555",
    fontWeight: "bold",
  },
  filterButton: {
    backgroundColor: "#6366f1",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#6366f1",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  filterButtonText: {
    fontWeight: "bold",
    color: "#fff",
    fontSize: 15,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    backgroundColor: "#f3f4f6",
    borderRadius: 20,
    marginRight: 8,
  },
  tabActive: {
    backgroundColor: "#6366f1",
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    alignItems: "center",
  },
  image: { width: 70, height: 100, borderRadius: 8 },
  bookTitle: { fontSize: 16, fontWeight: "600" },
  bookAuthor: { fontSize: 14, color: "#6b7280" },
  bookPublisher: { fontSize: 13, color: "#888" },
  badge: {
    backgroundColor: "#6366f1",
    color: "#fff",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 6,
    fontSize: 12,
    marginTop: 2,
  },
  badgeGreen: {
    backgroundColor: "#d1fae5",
    color: "#059669",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 6,
    fontSize: 12,
    marginTop: 2,
  },
  price: { color: "#eab308", fontWeight: "bold", marginTop: 6, fontSize: 16 },
  shelf: { color: "#888", fontSize: 13, marginTop: 2 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    width: "80%",
    elevation: 5,
  },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 20, textAlign: "center" },
  label: { fontSize: 16, marginTop: 12 },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 8, marginTop: 4 },
  buttonRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 24, marginBottom: 12 },
  searchBar: {
    marginHorizontal: 16,
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    borderRadius: 10,
    paddingHorizontal: 8,
  },
  searchInput: {
    marginLeft: 8,
    flex: 1,
    color: "#111",
  },
});