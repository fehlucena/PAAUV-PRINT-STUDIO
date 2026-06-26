import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import { LabelConfig } from "../types";
import { handleFirestoreError, OperationType } from "./firestoreUtils";

export const loadPresetsFromDB = async (userId: string): Promise<Record<string, LabelConfig>> => {
  const path = `users/${userId}/settings/presets`;
  try {
    const docRef = doc(db, "users", userId, "settings", "presets");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as Record<string, LabelConfig>;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
  return {};
};

export const savePresetsToDB = async (userId: string, presets: Record<string, LabelConfig>) => {
  const path = `users/${userId}/settings/presets`;
  try {
    await setDoc(doc(db, "users", userId, "settings", "presets"), presets);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const loadDefaultPresetFromDB = async (userId: string): Promise<LabelConfig | null> => {
  const path = `users/${userId}/settings/defaultPreset`;
  try {
    const docRef = doc(db, "users", userId, "settings", "defaultPreset");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as LabelConfig;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
  return null;
};

export const saveDefaultPresetToDB = async (userId: string, config: LabelConfig) => {
  const path = `users/${userId}/settings/defaultPreset`;
  try {
    await setDoc(doc(db, "users", userId, "settings", "defaultPreset"), config);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};
