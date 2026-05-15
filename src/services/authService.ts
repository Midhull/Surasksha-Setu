import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { logger } from "./incidentLogger";

class AuthService {
  private async syncUserDoc(user: User) {
    try {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      
      const userData: any = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        provider: user.providerData[0]?.providerId || 'password',
        lastLoginAt: serverTimestamp(),
      };

      if (!userSnap.exists()) {
        userData.createdAt = serverTimestamp();
      }

      await setDoc(userRef, userData, { merge: true });
      logger.log('info', 'Auth', 'User profile synchronized');
    } catch (e) {
      console.error("Failed to sync user doc", e);
    }
  }

  handleAuthError(error: any): string {
    const code = error.code;
    logger.log('high', 'Auth', `Authentication error [${code}]: ${error.message}`);

    switch (code) {
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/user-disabled':
        return 'This account has been disabled. Please contact support.';
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'Incorrect email or password. Please try again.';
      case 'auth/email-already-in-use':
        return 'An account already exists with this email address.';
      case 'auth/weak-password':
        return 'Password must be at least 6 characters long.';
      case 'auth/popup-closed-by-user':
        return 'Sign-in was cancelled. Please try again.';
      case 'auth/network-request-failed':
        return 'Network connection lost. Please check your internet.';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }

  async registerUser(email: string, password: string): Promise<User> {
    try {
      logger.log('info', 'Auth', `Initiating registration for: ${email}`);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await this.syncUserDoc(userCredential.user);
      logger.log('info', 'Auth', 'Identity created successfully');
      return userCredential.user;
    } catch (error: any) {
      logger.log('high', 'Auth', `Registration failed [${error.code}]`);
      throw error;
    }
  }

  async loginUser(email: string, password: string): Promise<User> {
    try {
      logger.log('info', 'Auth', `Initiating session for: ${email}`);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await this.syncUserDoc(userCredential.user);
      logger.log('info', 'Auth', 'Login verified and profile synchronized');
      return userCredential.user;
    } catch (error: any) {
      logger.log('high', 'Auth', `Login failed [${error.code}]`);
      throw error;
    }
  }

  async loginWithGoogle(): Promise<User> {
    const provider = new GoogleAuthProvider();
    try {
      logger.log('info', 'Auth', 'Initializing Google Identity popup');
      const result = await signInWithPopup(auth, provider);
      await this.syncUserDoc(result.user);
      logger.log('info', 'Auth', 'Google session established');
      return result.user;
    } catch (error: any) {
      logger.log('high', 'Auth', `Google Identity failed [${error.code}]`);
      throw error;
    }
  }

  async logoutUser(): Promise<void> {
    try {
      logger.log('info', 'Auth', 'Terminating active session');
      await signOut(auth);
      logger.log('info', 'Auth', 'Session terminated successfully');
    } catch (error: any) {
      logger.log('high', 'Auth', `Logout failure [${error.code}]`);
      console.error("Logout error", error);
    }
  }

  onAuthChange(callback: (user: User | null) => void) {
    logger.log('info', 'Auth', 'Subscribing to authentication lifecycle events');
    return onAuthStateChanged(auth, (user) => {
      if (user) {
        logger.log('info', 'Auth', `Session active/restored: ${user.uid}`);
        this.syncUserDoc(user);
      } else {
        logger.log('info', 'Auth', 'No active session detected during state change');
      }
      callback(user);
    });
  }

  get currentUser(): User | null {
    return auth.currentUser;
  }
}

export const authService = new AuthService();
