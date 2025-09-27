// APP/lib/scan.tsx
import { Camera, CameraView } from "expo-camera";
import { useEffect, useState } from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const API_KEY = "AIzaSyAttXNRb0ao2E6UuLJ1D8v-qOKmw3_YCVU";
export interface BookData {
  isbn: string;
  title: string;
  authors: string;
  publisher: string;
  year: string;
  language: "English" | "Thai";
}

export interface ScanResult {
  isbn: string;
}

// ฟังก์ชันดึงข้อมูลหนังสือ (รองรับ ISBN หรือ Title)
export async function fetchBookByQuery(query: string): Promise<BookData | null> {
  if (!query || query.trim() === "") return null;

  const isISBN = /^\d{13}$/.test(query.trim());
  let apiUrl = "";

  if (isISBN) {
    apiUrl = `https://www.googleapis.com/books/v1/volumes?q=isbn:${query.trim()}&key=${API_KEY}`;
  } else {
    apiUrl = `https://www.googleapis.com/books/v1/volumes?q=intitle:${encodeURIComponent(query.trim())}&key=${API_KEY}`;
  }

  try {
    const response = await fetch(apiUrl);
    const data = await response.json();

    if (data.totalItems > 0 && data.items?.length) {
      const info = data.items[0].volumeInfo;

      // สำหรับ Title ตรวจสอบให้ตรงกับ input (case-insensitive)
      if (!isISBN && info.title?.toLowerCase() !== query.trim().toLowerCase()) {
        return null;
      }

      const isbn = info.industryIdentifiers?.find(
        (id: any) => id.type === "ISBN_13" 
      )?.identifier || (isISBN ? query.trim() : "");

      return {
        isbn,
        title: info.title || "",
        authors: info.authors?.join(", ") || "",
        publisher: info.publisher || "",
        year: info.publishedDate?.slice(0, 4) || "",
        language: info.language === "th" ? "Thai" : "English",
      };
    }

    return null; // ไม่เจอข้อมูล
  } catch (err) {
    console.error("Error fetching book:", err);
    return null;
  }
}

// Modal สำหรับ Scan ISBN
export function ScanModal({
  visible,
  onClose,
  onScan,
}: {
  visible: boolean;
  onClose: () => void;
  onScan: (result: ScanResult) => void;
}) {
  const [scanned, setScanned] = useState(false);
  const [cameraType, setCameraType] = useState<"back" | "front">("back");
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  // ขออนุญาตกล้อง
  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
    })();
  }, []);

  const toggleCamera = () => setCameraType(cameraType === "back" ? "front" : "back");

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (!scanned) {
      setScanned(true);
      onScan({ isbn: data });
      setTimeout(() => setScanned(false), 500);
      onClose();
    }
  };

  if (hasPermission === false) {
    return (
      <Modal visible={visible} animationType="slide">
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text>No access to camera</Text>
          <TouchableOpacity onPress={onClose} style={styles.button}>
            <Text style={styles.buttonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide">
      <View style={{ flex: 1 }}>
        {hasPermission && (
          <CameraView
            style={{ flex: 1 }}
            facing={cameraType}
            barcodeScannerSettings={{ barcodeTypes: ["ean13"] }}
            onBarcodeScanned={({ data }) => {
              if (data) {
                handleBarCodeScanned({ data });
              }
            }}
          />
        )}
        <View style={styles.overlay}>
          <View style={styles.scanArea} />
        </View>
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={toggleCamera}>
            <Text style={styles.buttonText}>สลับกล้อง</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ ...styles.button, marginTop: 10 }} onPress={onClose}>
            <Text style={styles.buttonText}>   ยกเลิก</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, justifyContent: "center", alignItems: "center" },
  scanArea: { width: 250, height: 250, borderWidth: 2, borderColor: "white", borderRadius: 12 },
  buttonContainer: { position: "absolute", bottom: 30, alignSelf: "center" },
  button: { backgroundColor: "black", paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
  buttonText: { color: "white", fontWeight: "bold" },
});
