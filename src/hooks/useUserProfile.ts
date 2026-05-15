import { useState, useEffect } from 'react';
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import { UserProfile } from "../types/user";
import { User } from 'firebase/auth';

export const useUserProfile = (user: User | null) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const userRef = doc(db, "users", user.uid);
    const unsub = onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        setProfile(doc.data() as UserProfile);
      } else {
        setProfile({
          uid: user.uid,
          name: user.displayName || "Anonymous Operative",
          email: user.email || "",
          photoURL: user.photoURL || undefined,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
      setLoading(false);
    }, (error) => {
      console.error("Error listening to user profile:", error);
      setLoading(false);
    });

    return unsub;
  }, [user]);

  return { profile, loading };
};
