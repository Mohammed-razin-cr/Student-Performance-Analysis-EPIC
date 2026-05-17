/**
 * Firestore Helper Functions
 * CRUD operations for all collections
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  addDoc,
  DocumentData,
  QueryConstraint,
} from 'firebase/firestore';
import { db } from './firebase';
import type {
  User,
  CreateUser,
  UpdateUser,
  StudentProfile,
  CreateStudentProfile,
  UpdateStudentProfile,
  Prediction,
  CreatePrediction,
  Analytics,
  CreateAnalytics,
  UpdateAnalytics,
  Notification,
  UserSettings,
  StudentMarks,
  CreateStudentMarks,
  StudentActivityMarks,
  ActivityMarks,
} from '@/types/firestore';

// ============================================
// USER OPERATIONS
// ============================================

export const createUserDocument = async (userId: string, userData: CreateUser): Promise<void> => {
  const userRef = doc(db, 'users', userId);
  const now = Timestamp.now();
  
  await setDoc(userRef, {
    id: userId,
    ...userData,
    createdAt: now,
    updatedAt: now,
  });
};

export const getUserDocument = async (userId: string): Promise<User | null> => {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  
  if (userSnap.exists()) {
    return userSnap.data() as User;
  }
  return null;
};

export const updateUserDocument = async (userId: string, updates: Partial<CreateUser>): Promise<void> => {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    ...updates,
    updatedAt: Timestamp.now(),
  });
};

export const deleteUserDocument = async (userId: string): Promise<void> => {
  const userRef = doc(db, 'users', userId);
  await deleteDoc(userRef);
};

// ============================================
// STUDENT PROFILE OPERATIONS
// ============================================

export const createStudentProfile = async (userId: string, profileData: Omit<CreateStudentProfile, 'userId'>): Promise<void> => {
  const profileRef = doc(db, 'studentProfiles', userId);
  const now = Timestamp.now();
  
  await setDoc(profileRef, {
    userId,
    ...profileData,
    createdAt: now,
    updatedAt: now,
  });
};

export const getStudentProfile = async (userId: string): Promise<StudentProfile | null> => {
  // First try the standard pattern: document ID == userId
  const profileRef = doc(db, 'studentProfiles', userId);
  const profileSnap = await getDoc(profileRef);
  
  if (profileSnap.exists()) {
    return profileSnap.data() as StudentProfile;
  }
  
  // Fallback: query by userId field (handles older docs with auto-generated IDs)
  const q = query(
    collection(db, 'studentProfiles'),
    where('userId', '==', userId),
    limit(1)
  );
  const querySnap = await getDocs(q);
  if (!querySnap.empty) {
    return querySnap.docs[0].data() as StudentProfile;
  }
  
  return null;
};

export const updateStudentProfile = async (userId: string, updates: Partial<Omit<StudentProfile, 'userId' | 'createdAt' | 'updatedAt'>>): Promise<void> => {
  // Try the standard document ID first
  const profileRef = doc(db, 'studentProfiles', userId);
  const profileSnap = await getDoc(profileRef);

  if (profileSnap.exists()) {
    await updateDoc(profileRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
    return;
  }

  // Fallback: find the doc by userId field (auto-generated ID docs)
  const q = query(
    collection(db, 'studentProfiles'),
    where('userId', '==', userId),
    limit(1)
  );
  const querySnap = await getDocs(q);
  if (!querySnap.empty) {
    const existingDocRef = querySnap.docs[0].ref;
    await updateDoc(existingDocRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
    return;
  }

  // No document found — create one at the correct location
  await setDoc(profileRef, {
    userId,
    ...updates,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
};

// ============================================
// PREDICTION OPERATIONS
// ============================================

export const savePrediction = async (predictionData: CreatePrediction): Promise<string> => {
  const predictionsRef = collection(db, 'predictions');
  const docRef = await addDoc(predictionsRef, {
    ...predictionData,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
};

export const getPrediction = async (predictionId: string): Promise<Prediction | null> => {
  const predictionRef = doc(db, 'predictions', predictionId);
  const predictionSnap = await getDoc(predictionRef);
  
  if (predictionSnap.exists()) {
    return { id: predictionSnap.id, ...predictionSnap.data() } as Prediction;
  }
  return null;
};

export const getUserPredictions = async (userId: string, limitCount: number = 10): Promise<Prediction[]> => {
  const predictionsRef = collection(db, 'predictions');
  const q = query(
    predictionsRef,
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Prediction));
};

export const getLatestPrediction = async (userId: string): Promise<Prediction | null> => {
  const predictions = await getUserPredictions(userId, 1);
  return predictions.length > 0 ? predictions[0] : null;
};

// ============================================
// ANALYTICS OPERATIONS
// ============================================

export const createAnalytics = async (userId: string, analyticsData: Omit<CreateAnalytics, 'userId'>): Promise<void> => {
  const analyticsRef = doc(db, 'analytics', userId);
  
  await setDoc(analyticsRef, {
    userId,
    ...analyticsData,
    lastUpdated: Timestamp.now(),
  });
};

export const getAnalytics = async (userId: string): Promise<Analytics | null> => {
  const analyticsRef = doc(db, 'analytics', userId);
  const analyticsSnap = await getDoc(analyticsRef);
  
  if (analyticsSnap.exists()) {
    return analyticsSnap.data() as Analytics;
  }
  return null;
};

export const updateAnalytics = async (userId: string, updates: Partial<Omit<Analytics, 'userId'>>): Promise<void> => {
  const analyticsRef = doc(db, 'analytics', userId);
  await updateDoc(analyticsRef, {
    ...updates,
    lastUpdated: Timestamp.now(),
  });
};

// ============================================
// NOTIFICATION OPERATIONS
// ============================================

export const createNotification = async (notificationData: Omit<Notification, 'id' | 'createdAt'>): Promise<string> => {
  const notificationsRef = collection(db, 'notifications');
  const docRef = await addDoc(notificationsRef, {
    ...notificationData,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
};

export const getUserNotifications = async (userId: string, unreadOnly: boolean = false): Promise<Notification[]> => {
  const notificationsRef = collection(db, 'notifications');
  const constraints: QueryConstraint[] = [
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
  ];
  
  if (unreadOnly) {
    constraints.push(where('read', '==', false));
  }
  
  const q = query(notificationsRef, ...constraints);
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Notification));
};

export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  const notificationRef = doc(db, 'notifications', notificationId);
  await updateDoc(notificationRef, { read: true });
};

// ============================================
// SETTINGS OPERATIONS
// ============================================

export const getUserSettings = async (userId: string): Promise<UserSettings | null> => {
  const settingsRef = doc(db, 'settings', userId);
  const settingsSnap = await getDoc(settingsRef);
  
  if (settingsSnap.exists()) {
    return settingsSnap.data() as UserSettings;
  }
  return null;
};

export const updateUserSettings = async (userId: string, settings: Partial<Omit<UserSettings, 'userId'>>): Promise<void> => {
  const settingsRef = doc(db, 'settings', userId);
  await setDoc(settingsRef, {
    userId,
    ...settings,
    updatedAt: Timestamp.now(),
  }, { merge: true });
};

// ============================================
// BATCH OPERATIONS
// ============================================

export const initializeNewStudent = async (
  userId: string,
  userData: CreateUser,
  profileData: Omit<CreateStudentProfile, 'userId'>
): Promise<void> => {
  // Create user document
  await createUserDocument(userId, userData);
  
  // Create student profile
  await createStudentProfile(userId, profileData);
  
  // Initialize analytics with empty data
  await createAnalytics(userId, {
    performanceData: [],
    attendanceData: [],
    skillsData: [],
    gradeDistribution: [],
    activityTrend: [],
  });
  
  // Create default settings
  await updateUserSettings(userId, {
    notifications: {
      email: true,
      predictions: true,
      reports: true,
      assignments: true,
      grades: true,
    },
    theme: 'dark',
    language: 'en',
    timezone: 'Asia/Kolkata',
  });
};

// ============================================
// QUERY HELPERS
// ============================================

export const getAllStudents = async (): Promise<User[]> => {
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('role', '==', 'student'));
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as User));
};

export const getAllFaculty = async (): Promise<User[]> => {
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('role', '==', 'faculty'));
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as User));
};

export const getStudentsByDepartment = async (department: string): Promise<User[]> => {
  const usersRef = collection(db, 'users');
  const q = query(
    usersRef,
    where('role', '==', 'student'),
    where('department', '==', department)
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as User));
};

// ============================================
// MARKS & ATTENDANCE OPERATIONS
// ============================================

export const saveStudentMarks = async (marksData: CreateStudentMarks): Promise<void> => {
  const marksRef = doc(db, 'studentMarks', marksData.userId);
  await setDoc(marksRef, {
    ...marksData,
    lastUpdated: Timestamp.now(),
  });
};

export const getStudentMarks = async (userId: string): Promise<StudentMarks | null> => {
  const marksRef = doc(db, 'studentMarks', userId);
  const marksSnap = await getDoc(marksRef);
  
  if (marksSnap.exists()) {
    return marksSnap.data() as StudentMarks;
  }
  return null;
};

export const getAllStudentMarks = async (): Promise<StudentMarks[]> => {
  const marksRef = collection(db, 'studentMarks');
  const q = query(marksRef, orderBy('totalPercentage', 'desc'));
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => doc.data() as StudentMarks);
};

export const getStudentMarksByDepartment = async (department: string): Promise<StudentMarks[]> => {
  const marksRef = collection(db, 'studentMarks');
  const q = query(
    marksRef,
    where('department', '==', department),
    orderBy('totalPercentage', 'desc')
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => doc.data() as StudentMarks);
};

export const updateStudentMarks = async (userId: string, marks: Partial<CreateStudentMarks>): Promise<void> => {
  const marksRef = doc(db, 'studentMarks', userId);
  await updateDoc(marksRef, {
    ...marks,
    lastUpdated: Timestamp.now(),
  });
};

export const deleteStudentMarks = async (userId: string): Promise<void> => {
  const marksRef = doc(db, 'studentMarks', userId);
  await deleteDoc(marksRef);
};

// ============================================
// FRIEND REQUEST OPERATIONS
// ============================================

import type { FriendRequest, Friend } from '@/types/firestore';

// Search user by Student ID (checks both 'usn' and 'studentId' fields)
export const searchUserByUsn = async (searchInput: string): Promise<User | null> => {
  const usersRef = collection(db, 'users');
  const searchValue = searchInput.trim().toLowerCase();
  
  // First try searching by 'usn' field (lowercase)
  const q1 = query(usersRef, where('usn', '==', searchValue));
  const snapshot1 = await getDocs(q1);
  if (!snapshot1.empty) {
    return { id: snapshot1.docs[0].id, ...snapshot1.docs[0].data() } as User;
  }
  
  // Try searching by 'studentId' field (lowercase)
  const q2 = query(usersRef, where('studentId', '==', searchValue));
  const snapshot2 = await getDocs(q2);
  if (!snapshot2.empty) {
    return { id: snapshot2.docs[0].id, ...snapshot2.docs[0].data() } as User;
  }
  
  // Try with original case (studentId might be stored with original case)
  const q3 = query(usersRef, where('studentId', '==', searchInput.trim()));
  const snapshot3 = await getDocs(q3);
  if (!snapshot3.empty) {
    return { id: snapshot3.docs[0].id, ...snapshot3.docs[0].data() } as User;
  }
  
  return null;
};

// Send friend request
export const sendFriendRequest = async (
  senderId: string,
  senderName: string,
  senderUsn: string,
  senderPhotoURL: string | undefined,
  receiverId: string,
  receiverName: string,
  receiverUsn: string
): Promise<string> => {
  const now = Timestamp.now();
  
  // Check if request already exists
  const existingRequest = await checkExistingFriendRequest(senderId, receiverId);
  if (existingRequest) {
    throw new Error('Friend request already sent');
  }
  
  // Check if already friends
  const alreadyFriends = await checkIfFriends(senderId, receiverId);
  if (alreadyFriends) {
    throw new Error('Already friends');
  }
  
  const requestsRef = collection(db, 'friendRequests');
  const docRef = await addDoc(requestsRef, {
    senderId,
    senderName,
    senderUsn,
    senderPhotoURL: senderPhotoURL || null,
    receiverId,
    receiverName,
    receiverUsn,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
  });
  
  return docRef.id;
};

// Check if friend request already exists
export const checkExistingFriendRequest = async (senderId: string, receiverId: string): Promise<FriendRequest | null> => {
  const requestsRef = collection(db, 'friendRequests');
  
  // Get all requests where senderId is sender, filter status client-side
  const q1 = query(
    requestsRef,
    where('senderId', '==', senderId)
  );
  
  // Get all requests where receiverId is sender (reverse check), filter status client-side
  const q2 = query(
    requestsRef,
    where('senderId', '==', receiverId)
  );
  
  const [snapshot1, snapshot2] = await Promise.all([getDocs(q1), getDocs(q2)]);
  
  // Filter client-side to check receiverId and status
  const match1 = snapshot1.docs.find(doc => {
    const data = doc.data();
    return data.receiverId === receiverId && data.status === 'pending';
  });
  if (match1) {
    return { id: match1.id, ...match1.data() } as FriendRequest;
  }
  
  const match2 = snapshot2.docs.find(doc => {
    const data = doc.data();
    return data.receiverId === senderId && data.status === 'pending';
  });
  if (match2) {
    return { id: match2.id, ...match2.data() } as FriendRequest;
  }
  
  return null;
};

// Check if already friends (checks current user's friends subcollection)
export const checkIfFriends = async (userId1: string, userId2: string): Promise<boolean> => {
  // Check if userId2 is in userId1's friends list using direct document read
  const friendRef = doc(db, 'users', userId1, 'friends', userId2);
  const friendSnap = await getDoc(friendRef);
  return friendSnap.exists();
};

// Get pending friend requests received by user
export const getPendingFriendRequests = async (userId: string): Promise<FriendRequest[]> => {
  console.log("getPendingFriendRequests called for userId:", userId);
  const requestsRef = collection(db, 'friendRequests');
  // Use single where clause, filter status client-side to avoid composite index
  const q = query(
    requestsRef,
    where('receiverId', '==', userId)
  );
  
  const querySnapshot = await getDocs(q);
  console.log("Raw docs found:", querySnapshot.docs.length);
  querySnapshot.docs.forEach(doc => {
    console.log("Doc:", doc.id, doc.data());
  });
  
  const requests = querySnapshot.docs
    .map(doc => ({
      id: doc.id,
      ...doc.data()
    } as FriendRequest))
    .filter(req => req.status === 'pending');
  
  console.log("Filtered pending requests:", requests.length);
  
  // Sort client-side
  return requests.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
};

// Get sent friend requests
export const getSentFriendRequests = async (userId: string): Promise<FriendRequest[]> => {
  const requestsRef = collection(db, 'friendRequests');
  // Use single where clause, filter status client-side to avoid composite index
  const q = query(
    requestsRef,
    where('senderId', '==', userId)
  );
  
  const querySnapshot = await getDocs(q);
  const requests = querySnapshot.docs
    .map(doc => ({
      id: doc.id,
      ...doc.data()
    } as FriendRequest))
    .filter(req => req.status === 'pending');
  
  // Sort client-side
  return requests.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
};

// Accept friend request
export const acceptFriendRequest = async (requestId: string): Promise<void> => {
  const requestRef = doc(db, 'friendRequests', requestId);
  const requestSnap = await getDoc(requestRef);
  
  if (!requestSnap.exists()) {
    throw new Error('Friend request not found');
  }
  
  const request = requestSnap.data() as FriendRequest;
  const now = Timestamp.now();
  
  // Update request status
  await updateDoc(requestRef, {
    status: 'accepted',
    updatedAt: now,
  });
  
  // Add to sender's friends subcollection
  const senderFriendsRef = doc(db, 'users', request.senderId, 'friends', request.receiverId);
  await setDoc(senderFriendsRef, {
    friendId: request.receiverId,
    friendName: request.receiverName,
    friendUsn: request.receiverUsn,
    addedAt: now,
  });
  
  // Add to receiver's friends subcollection
  const receiverFriendsRef = doc(db, 'users', request.receiverId, 'friends', request.senderId);
  await setDoc(receiverFriendsRef, {
    friendId: request.senderId,
    friendName: request.senderName,
    friendUsn: request.senderUsn,
    friendPhotoURL: request.senderPhotoURL || null,
    addedAt: now,
  });
};

// Reject friend request
export const rejectFriendRequest = async (requestId: string): Promise<void> => {
  const requestRef = doc(db, 'friendRequests', requestId);
  
  await updateDoc(requestRef, {
    status: 'rejected',
    updatedAt: Timestamp.now(),
  });
};

// Get user's friends list
export const getFriendsList = async (userId: string): Promise<Friend[]> => {
  const friendsRef = collection(db, 'users', userId, 'friends');
  
  const querySnapshot = await getDocs(friendsRef);
  const friends = querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Friend));
  
  // Sort client-side to avoid needing composite index
  return friends.sort((a, b) => b.addedAt.toMillis() - a.addedAt.toMillis());
};

// Remove friend
export const removeFriend = async (userId: string, friendId: string): Promise<void> => {
  // Remove from user's friends
  const userFriendRef = doc(db, 'users', userId, 'friends', friendId);
  await deleteDoc(userFriendRef);
  
  // Remove from friend's friends
  const friendUserRef = doc(db, 'users', friendId, 'friends', userId);
  await deleteDoc(friendUserRef);
};

// Get user profile by ID (for viewing friend's profile)
export const getUserById = async (userId: string): Promise<User | null> => {
  return getUserDocument(userId);
};

// ============================================
// ACTIVITY MARKS OPERATIONS
// ============================================

export const saveStudentActivityMarks = async (
  userId: string,
  marks: Omit<StudentActivityMarks, 'lastUpdated'>
): Promise<void> => {
  const activityRef = doc(db, 'studentActivityMarks', userId);
  
  await setDoc(activityRef, {
    ...marks,
    lastUpdated: Timestamp.now(),
  });
};

export const updateStudentActivityMarks = async (
  userId: string,
  updates: Partial<Omit<StudentActivityMarks, 'lastUpdated'>>
): Promise<void> => {
  const activityRef = doc(db, 'studentActivityMarks', userId);
  
  await updateDoc(activityRef, {
    ...updates,
    lastUpdated: Timestamp.now(),
  });
};

export const getStudentActivityMarks = async (userId: string): Promise<StudentActivityMarks | null> => {
  const activityRef = doc(db, 'studentActivityMarks', userId);
  const docSnap = await getDoc(activityRef);
  
  if (docSnap.exists()) {
    return docSnap.data() as StudentActivityMarks;
  }
  
  return null;
};

export const getAllStudentActivityMarks = async (): Promise<StudentActivityMarks[]> => {
  const activityRef = collection(db, 'studentActivityMarks');
  const querySnapshot = await getDocs(activityRef);
  
  return querySnapshot.docs.map(doc => ({
    ...doc.data()
  } as StudentActivityMarks));
};

export const addActivityMarkEntry = async (
  userId: string,
  activityMark: ActivityMarks
): Promise<void> => {
  const activityRef = doc(db, 'studentActivityMarks', userId);
  
  await updateDoc(activityRef, {
    marks: activityMark,
    lastUpdated: Timestamp.now(),
  });
};
