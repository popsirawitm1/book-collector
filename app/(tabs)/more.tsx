import React, { useState } from "react";
import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Page = "Settings" | "Reports" | "Help" | null;

interface Colors {
  background: string;
  card: string;
  textPrimary: string;
  textSecondary: string;
  blue: string;
  green: string;
  yellow: string;
  border: string;
}

interface MainMoreScreenProps {
  setCurrentPage: React.Dispatch<React.SetStateAction<Page>>;
  colors: Colors;
}

interface MenuItemProps {
  title: string;
  icon: string;
  onPress: () => void;
  colors: Colors;
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const colors: Colors = {
    background: isDarkMode ? "#111827" : "#f3f4f6",
    card: isDarkMode ? "#1f2937" : "#fff",
    textPrimary: isDarkMode ? "#f9fafb" : "#111827",
    textSecondary: isDarkMode ? "#d1d5db" : "#6b7280",
    blue: "#2563eb",
    green: "#16a34a",
    yellow: "#eab308",
    border: isDarkMode ? "#374151" : "#e5e7eb",
  };

  const renderPage = () => {
    switch (currentPage) {
      case "Settings":
        return (
          <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
            <Text style={[styles.pageTitle, { color: colors.textPrimary }]}>
              Settings & Preferences
            </Text>

            <View style={[styles.card, { backgroundColor: colors.card }]}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Profile</Text>
              <Text style={[styles.itemText, { color: colors.textSecondary }]}>
                Username: Book Collector
              </Text>
              <Text style={[styles.itemText, { color: colors.textSecondary }]}>
                Email: collector@example.com
              </Text>
            </View>

            <View style={[styles.card, { backgroundColor: colors.card }]}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                App Preferences
              </Text>

              <TouchableOpacity
                style={[styles.exportButton, { backgroundColor: colors.blue }]}
                onPress={() => setIsDarkMode(!isDarkMode)}
              >
                <Text style={[styles.exportText, { color: "#fff" }]}>
                  Switch to {isDarkMode ? "Light" : "Dark"} Mode
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.backButton, { backgroundColor: colors.blue }]}
              onPress={() => setCurrentPage(null)}
            >
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>
          </ScrollView>
        );

      case "Reports":
        return (
          <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
            <Text style={[styles.pageTitle, { color: colors.textPrimary }]}>Reports & Export</Text>

            <View style={[styles.card, { backgroundColor: colors.card }]}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                Collection Summary
              </Text>
              <Text style={[styles.itemText, { color: colors.textSecondary }]}>Total Books: 0</Text>
              <Text style={[styles.itemText, { color: colors.textSecondary }]}>
                Collection Value: ฿0
              </Text>
              <Text style={[styles.itemText, { color: colors.textSecondary }]}>
                First Editions: 0
              </Text>
            </View>

            <View style={[styles.card, { backgroundColor: colors.card }]}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                Export Options
              </Text>
              <TouchableOpacity style={[styles.exportButton, { backgroundColor: colors.blue }]}>
                <Text style={styles.exportText}>Export as PDF</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.exportButton, { backgroundColor: colors.blue }]}>
                <Text style={styles.exportText}>Export as CSV</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.backButton, { backgroundColor: colors.blue }]}
              onPress={() => setCurrentPage(null)}
            >
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>
          </ScrollView>
        );

      case "Help":
        return (
          <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
            <Text style={[styles.pageTitle, { color: colors.textPrimary }]}>Help & Support</Text>

            <View style={[styles.card, { backgroundColor: colors.card }]}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>FAQ</Text>
              <Text style={[styles.itemText, { color: colors.textSecondary }]}>
                Q: How do I add a new book?
              </Text>
              <Text style={[styles.itemText, { color: colors.textSecondary }]}>
                A: Go to the collection page and tap 'Add Book'.
              </Text>
              <Text style={[styles.itemText, { color: colors.textSecondary }]}>
                Q: How do I export my collection?
              </Text>
              <Text style={[styles.itemText, { color: colors.textSecondary }]}>
                A: Go to Reports & Export and choose a format.
              </Text>
            </View>

            <View style={[styles.card, { backgroundColor: colors.card }]}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                Contact Support
              </Text>
              <Text style={[styles.itemText, { color: colors.textSecondary }]}>
                Email: support@example.com
              </Text>
              <Text style={[styles.itemText, { color: colors.textSecondary }]}>
                Phone: +66 1234 5678
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.backButton, { backgroundColor: colors.blue }]}
              onPress={() => setCurrentPage(null)}
            >
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>
          </ScrollView>
        );

      default:
        return <MainMoreScreen setCurrentPage={setCurrentPage} colors={colors} />;
    }
  };

  return renderPage();
}

function MainMoreScreen({ setCurrentPage, colors }: MainMoreScreenProps) {
  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Profile Card */}
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <View style={styles.profileRow}>
          <Ionicons name="person-circle-outline" size={60} color={colors.blue} />
          <View style={{ marginLeft: 12 }}>
            <Text style={[styles.name, { color: colors.textPrimary }]}>Book Collector</Text>
            <Text style={[styles.email, { color: colors.textSecondary }]}>
              collector@example.com
            </Text>
            <Text style={[styles.member, { color: colors.blue }]}>Premium Member</Text>
          </View>
        </View>
      </View>

      {/* Collection Overview */}
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          Collection Overview
        </Text>
        <View style={[styles.overviewRowLine, { borderBottomColor: colors.border }]}>
          <View style={styles.rowLeft}>
            <Ionicons name="book-outline" size={18} color={colors.blue} />
            <Text style={[styles.overviewLabel, { color: colors.textSecondary }]}>
              Total Books
            </Text>
          </View>
          <Text style={[styles.overviewValue, { color: colors.textPrimary }]}>0 copies</Text>
        </View>
        <View style={[styles.overviewRowLine, { borderBottomColor: colors.border }]}>
          <View style={styles.rowLeft}>
            <Ionicons name="cash-outline" size={18} color={colors.green} />
            <Text style={[styles.overviewLabel, { color: colors.textSecondary }]}>
              Collection Value
            </Text>
          </View>
          <Text style={[styles.overviewValue, { color: colors.textPrimary }]}>฿0</Text>
        </View>
        <View style={[styles.overviewRowLine, { borderBottomColor: colors.border }]}>
          <View style={styles.rowLeft}>
            <Ionicons name="star-outline" size={18} color={colors.yellow} />
            <Text style={[styles.overviewLabel, { color: colors.textSecondary }]}>
              First Editions
            </Text>
          </View>
          <Text style={[styles.overviewValue, { color: colors.textPrimary }]}>0 books</Text>
        </View>
      </View>

      {/* Menu */}
      <View style={[styles.menuCard, { backgroundColor: colors.card }]}>
        <MenuItem
          title="Settings & Preferences"
          icon="settings-outline"
          onPress={() => setCurrentPage("Settings")}
          colors={colors}
        />
        <MenuItem
          title="Reports & Export"
          icon="document-text-outline"
          onPress={() => setCurrentPage("Reports")}
          colors={colors}
        />
        <MenuItem
          title="Help & Support"
          icon="help-circle-outline"
          onPress={() => setCurrentPage("Help")}
          colors={colors}
        />
      </View>
    </ScrollView>
  );
}

function MenuItem({ title, icon, onPress, colors }: MenuItemProps) {
  return (
    <TouchableOpacity
      style={[styles.menuRow, { borderBottomColor: colors.border }]}
      onPress={onPress}
    >
      <View style={styles.menuLeft}>
        <Ionicons name={icon as any} size={22} color={colors.blue} />
        <Text style={[styles.menuText, { color: colors.textPrimary }]}>{title}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  card: {
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 3,
  },
  profileRow: { flexDirection: "row", alignItems: "center" },
  name: { fontSize: 16, fontWeight: "700" },
  email: { fontSize: 13, fontStyle: "italic" },
  member: { fontSize: 13, marginTop: 4, fontStyle: "italic" },
  sectionTitle: { fontSize: 15, fontWeight: "700", marginBottom: 12 },
  overviewRowLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowLeft: { flexDirection: "row", alignItems: "center" },
  overviewLabel: { marginLeft: 8, fontSize: 13, fontStyle: "italic" },
  overviewValue: { fontSize: 14, fontWeight: "700" },
  menuCard: { borderRadius: 16, marginHorizontal: 16, marginTop: 16, overflow: "hidden" },
  menuRow: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  menuLeft: { flexDirection: "row", alignItems: "center" },
  menuText: { marginLeft: 12, fontSize: 15, fontStyle: "italic" },
  pageTitle: { fontSize: 20, fontWeight: "700", margin: 20, textAlign: "center" },
  backButton: { padding: 12, borderRadius: 8, margin: 16 },
  backText: { color: "#fff", fontWeight: "700", textAlign: "center" },
  itemText: { fontSize: 14, marginBottom: 8, fontStyle: "italic" },
  exportButton: { padding: 12, borderRadius: 8, marginVertical: 6 },
  exportText: { fontWeight: "700", textAlign: "center" },
});
