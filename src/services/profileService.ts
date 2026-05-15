import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { updateProfile } from "firebase/auth";
import { db, storage, auth } from "../lib/firebase";
import { UserProfile } from "../types/user";
import { logger } from "./incidentLogger";

class ProfileService {
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const userRef = doc(db, "users", uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        return userSnap.data() as UserProfile;
      }
      return null;
    } catch (error) {
      logger.log('high', 'Profile', `Failed to fetch profile: ${uid}`);
      throw error;
    }
  }

  async updateProfileData(uid: string, data: Partial<UserProfile>): Promise<void> {
    try {
      const userRef = doc(db, "users", uid);
      const updatePayload = {
        ...data,
        updatedAt: serverTimestamp(),
      };

      await updateDoc(userRef, updatePayload);
      
      // If name or photoURL is updated, sync with Firebase Auth profile
      if (auth.currentUser && (data.name || data.photoURL)) {
        await updateProfile(auth.currentUser, {
          displayName: data.name || auth.currentUser.displayName,
          photoURL: data.photoURL || auth.currentUser.photoURL,
        });
      }

      logger.log('info', 'Profile', `Profile updated for: ${uid}`);
    } catch (error) {
      logger.log('high', 'Profile', `Failed to update profile: ${uid}`);
      throw error;
    }
  }

  async uploadAvatar(uid: string, file: File): Promise<string> {
    try {
      const storageRef = ref(storage, `avatars/${uid}/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      await this.updateProfileData(uid, { photoURL: downloadURL });
      
      logger.log('info', 'Profile', `Avatar uploaded for: ${uid}`);
      return downloadURL;
    } catch (error) {
      logger.log('high', 'Profile', `Avatar upload failed: ${uid}`);
      throw error;
    }
  }
}

export const profileService = new ProfileService();
