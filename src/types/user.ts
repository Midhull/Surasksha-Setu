import { Timestamp } from "firebase/firestore";

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  phone?: string;
  role?: string;
  bio?: string;
  photoURL?: string;
  provider?: string;
  createdAt: Timestamp | any;
  updatedAt: Timestamp | any;
  lastLoginAt?: Timestamp | any;
}
