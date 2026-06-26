import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import { LabelConfig } from "../types";

export const loadPresetsFromDB = async (): Promise<Record<string, LabelConfig>> => {
  try {
    const docRef = doc(db, "settings", "presets");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as Record<string, LabelConfig>;
    }
  } catch (error) {
    console.error("Error loading presets:", error);
  }
  return {};
};

export const savePresetsToDB = async (presets: Record<string, LabelConfig>) => {
  try {
    await setDoc(doc(db, "settings", "presets"), presets);
  } catch (error) {
    console.error("Error saving presets:", error);
  }
};

export const loadDefaultPresetFromDB = async (): Promise<LabelConfig | null> => {
  try {
    const docRef = doc(db, "settings", "defaultPreset");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as LabelConfig;
    }
  } catch (error) {
    console.error("Error loading default preset:", error);
  }
  return null;
};

export const saveDefaultPresetToDB = async (config: LabelConfig) => {
  try {
    await setDoc(doc(db, "settings", "defaultPreset"), config);
  } catch (error) {
    console.error("Error saving default preset:", error);
  }
};
