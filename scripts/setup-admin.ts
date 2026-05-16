/**
 * Admin Setup Script
 * Run this script to set up admin user and sample data
 * 
 * Usage: 
 * 1. First register a new user via the app (this creates the auth user)
 * 2. Get their user ID from Firebase Console
 * 3. Run: npx ts-node --project tsconfig.scripts.json scripts/setup-admin.ts
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, updateDoc, Timestamp, collection, getDocs } from 'firebase/firestore';

// Firebase config - same as lib/firebase.ts
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ============================================
// SAMPLE DATA
// ============================================

const sampleStudents = [
  {
    name: "Razin Ahmed",
    email: "p18mt24s1260100@eastpoint.ac.in",
    department: "MCA",
    school: "East Point College of Higher Education",
    age: 20,
    studentId: "P18MT24S1260100",
  },
  {
    name: "Priya Sharma",
    email: "priya.sharma@eastpoint.ac.in",
    department: "MCA",
    school: "East Point College of Higher Education",
    age: 19,
    studentId: "P18MT24S1260101",
  },
  {
    name: "Rahul Kumar",
    email: "rahul.kumar@eastpoint.ac.in",
    department: "MBA",
    school: "East Point College of Higher Education",
    age: 21,
    studentId: "P18MT24S1260102",
  },
  {
    name: "Ananya Gupta",
    email: "ananya.gupta@eastpoint.ac.in",
    department: "MCA",
    school: "East Point College of Higher Education",
    age: 20,
    studentId: "P18MT24S1260103",
  },
  {
    name: "Mohammed Faisal",
    email: "mohammed.faisal@eastpoint.ac.in",
    department: "MBA",
    school: "East Point College of Higher Education",
    age: 22,
    studentId: "P18MT24S1260104",
  },
];

const sampleMarks = [
  { subject: "Mathematics", marksObtained: 85, totalMarks: 100 },
  { subject: "Physics", marksObtained: 78, totalMarks: 100 },
  { subject: "Chemistry", marksObtained: 82, totalMarks: 100 },
  { subject: "English", marksObtained: 90, totalMarks: 100 },
  { subject: "Computer Science", marksObtained: 95, totalMarks: 100 },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

async function makeUserAdmin(userId: string) {
  console.log(`Making user ${userId} an admin...`);
  
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    role: 'admin',
    updatedAt: Timestamp.now(),
  });
  
  console.log('✅ User is now an admin!');
}

async function addSampleStudent(studentData: typeof sampleStudents[0], index: number) {
  const fakeUserId = `sample_student_${index + 1}`;
  const now = Timestamp.now();
  
  // Create user document
  const userRef = doc(db, 'users', fakeUserId);
  await setDoc(userRef, {
    id: fakeUserId,
    name: studentData.name,
    email: studentData.email,
    role: 'student',
    studentId: studentData.studentId,
    department: studentData.department,
    school: studentData.school,
    age: studentData.age,
    skills: ['Problem Solving', 'Team Work', 'Communication'],
    interests: ['Sports', 'Reading', 'Coding'],
    parentInfo: {
      mother: `${studentData.name.split(' ')[0]}'s Mother`,
      father: `${studentData.name.split(' ')[0]}'s Father`,
    },
    createdAt: now,
    updatedAt: now,
  });
  
  // Create student marks
  const marksRef = doc(db, 'studentMarks', fakeUserId);
  const exams = sampleMarks.map((mark, i) => ({
    examName: `Mid Term ${i + 1}`,
    subject: mark.subject,
    marksObtained: mark.marksObtained + Math.floor(Math.random() * 10 - 5), // Randomize a bit
    totalMarks: mark.totalMarks,
    percentage: mark.marksObtained + Math.floor(Math.random() * 10 - 5),
    date: new Date(2025, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString(),
  }));
  
  const totalMarks = exams.reduce((sum, e) => sum + e.marksObtained, 0);
  const totalPossible = exams.reduce((sum, e) => sum + e.totalMarks, 0);
  
  await setDoc(marksRef, {
    userId: fakeUserId,
    studentId: studentData.studentId,
    studentName: studentData.name,
    department: studentData.department,
    exams,
    attendance: [
      { date: '2025-01-15', status: 'present', subject: 'Mathematics' },
      { date: '2025-01-16', status: 'present', subject: 'Physics' },
      { date: '2025-01-17', status: 'absent', subject: 'Chemistry', remarks: 'Medical leave' },
      { date: '2025-01-18', status: 'present', subject: 'English' },
      { date: '2025-01-19', status: 'late', subject: 'Computer Science' },
    ],
    totalMarks,
    totalPercentage: Math.round((totalMarks / totalPossible) * 100),
    rank: index + 1,
    lastUpdated: now,
  });
  
  console.log(`✅ Added student: ${studentData.name}`);
}

async function listAllUsers() {
  console.log('\n📋 All Users in Database:');
  console.log('='.repeat(50));
  
  const usersRef = collection(db, 'users');
  const snapshot = await getDocs(usersRef);
  
  if (snapshot.empty) {
    console.log('No users found in database.');
    return;
  }
  
  snapshot.forEach((doc) => {
    const data = doc.data();
    console.log(`ID: ${doc.id}`);
    console.log(`  Name: ${data.name || data.displayName || 'N/A'}`);
    console.log(`  Email: ${data.email}`);
    console.log(`  Role: ${data.role || 'student'}`);
    console.log('-'.repeat(50));
  });
}

// ============================================
// MAIN EXECUTION
// ============================================

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  console.log('\n🚀 EPIC Admin Setup Script\n');
  
  switch (command) {
    case 'make-admin':
      const userId = args[1];
      if (!userId) {
        console.log('Usage: npx ts-node scripts/setup-admin.ts make-admin <userId>');
        console.log('\nTo get userId:');
        console.log('1. Go to Firebase Console > Authentication > Users');
        console.log('2. Copy the User UID of the user you want to make admin');
        return;
      }
      await makeUserAdmin(userId);
      break;
      
    case 'add-sample-students':
      console.log('Adding sample students...\n');
      for (let i = 0; i < sampleStudents.length; i++) {
        await addSampleStudent(sampleStudents[i], i);
      }
      console.log('\n✅ All sample students added!');
      break;
      
    case 'list-users':
      await listAllUsers();
      break;
      
    default:
      console.log('Available commands:');
      console.log('  make-admin <userId>    - Make a user an admin');
      console.log('  add-sample-students    - Add sample student data');
      console.log('  list-users             - List all users in database');
      console.log('\nExample:');
      console.log('  npx ts-node scripts/setup-admin.ts make-admin abc123xyz');
      break;
  }
}

main().catch(console.error);
