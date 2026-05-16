import { collection, doc, setDoc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from './firebase';
import { BADGE_DEFINITIONS, Badge, BadgeLevel } from '@/types/badges';
import type { StudentMarks, Friend, StudentProfile } from '@/types/firestore';

// Calculate which badges a user has earned
export const calculateUserBadges = async (
  userId: string,
  marks: StudentMarks | null,
  friends: Friend[],
  profile: StudentProfile | null
): Promise<Badge[]> => {
  const badges: Badge[] = [];

  // Calculate stats from user data
  const stats = {
    perfectScores: calculatePerfectScores(marks),
    subjectsAbove90: calculateSubjectsAbove(marks, 90),
    allSubjectsAbove90: checkAllSubjectsAbove(marks, 90),
    attendancePercent: calculateAttendancePercent(marks),
    friendCount: friends.length,
    traitsComplete: checkTraitsComplete(profile),
    traitsAndMedical: checkTraitsAndMedical(profile),
    fullProfileComplete: checkFullProfileComplete(profile),
    semesterAverage: calculateSemesterAverage(marks),
    improvement: calculateImprovement(marks),
    failToExcellence: checkFailToExcellence(marks),
    passingStreak: calculatePassingStreak(marks),
    diverseFriends: checkDiverseFriends(friends),
    diverseCount: calculateDiverseCount(friends),
  };

  // Check each badge definition
  for (const badgeDef of BADGE_DEFINITIONS) {
    // Check gold first, then silver, then bronze
    let earnedLevel: BadgeLevel | null = null;

    if (checkCriteria(badgeDef.levels.gold.criteria, stats)) {
      earnedLevel = 'gold';
    } else if (checkCriteria(badgeDef.levels.silver.criteria, stats)) {
      earnedLevel = 'silver';
    } else if (checkCriteria(badgeDef.levels.bronze.criteria, stats)) {
      earnedLevel = 'bronze';
    }

    if (earnedLevel) {
      badges.push({
        id: `${badgeDef.id}-${earnedLevel}`,
        name: badgeDef.name,
        description: badgeDef.description,
        icon: badgeDef.icon,
        level: earnedLevel,
        category: badgeDef.category,
        earned: true,
        requirement: badgeDef.levels[earnedLevel].requirement,
      });
    }
  }

  return badges;
};

// Helper: Check if criteria are met
const checkCriteria = (criteria: any, stats: any): boolean => {
  for (const [key, value] of Object.entries(criteria)) {
    if (typeof value === 'boolean') {
      if (stats[key] !== value) return false;
    } else if (typeof value === 'number') {
      if (stats[key] < value) return false;
    }
  }
  return true;
};

// Calculation helpers
const calculatePerfectScores = (marks: StudentMarks | null): number => {
  if (!marks?.subjects) return 0;
  return marks.subjects.filter(s => {
    const totalMarks = (s.internal1?.total || 0) + (s.internal2?.total || 0) + (s.semester?.total || 0);
    const obtainedMarks = (s.internal1?.obtained || 0) + (s.internal2?.obtained || 0) + (s.semester?.obtained || 0);
    return obtainedMarks === totalMarks && totalMarks > 0;
  }).length;
};

const calculateSubjectsAbove = (marks: StudentMarks | null, threshold: number): number => {
  if (!marks?.subjects) return 0;
  return marks.subjects.filter(s => {
    const totalMarks = (s.internal1?.total || 0) + (s.internal2?.total || 0) + (s.semester?.total || 0);
    const obtainedMarks = (s.internal1?.obtained || 0) + (s.internal2?.obtained || 0) + (s.semester?.obtained || 0);
    return totalMarks > 0 && (obtainedMarks / totalMarks) * 100 >= threshold;
  }).length;
};

const checkAllSubjectsAbove = (marks: StudentMarks | null, threshold: number): boolean => {
  if (!marks?.subjects || marks.subjects.length === 0) return false;
  return marks.subjects.every(s => {
    const totalMarks = (s.internal1?.total || 0) + (s.internal2?.total || 0) + (s.semester?.total || 0);
    const obtainedMarks = (s.internal1?.obtained || 0) + (s.internal2?.obtained || 0) + (s.semester?.obtained || 0);
    return totalMarks > 0 && (obtainedMarks / totalMarks) * 100 >= threshold;
  });
};

const calculateAttendancePercent = (marks: StudentMarks | null): number => {
  if (!marks?.attendance || marks.attendance.length === 0) return 0;
  const present = marks.attendance.filter(a => a.status === 'present').length;
  const total = marks.attendance.length;
  return total > 0 ? (present / total) * 100 : 0;
};

const checkTraitsComplete = (profile: StudentProfile | null): boolean => {
  if (!profile?.traits) return false;
  const { conscientiousness, openness, agreeableness } = profile.traits;
  return !!(conscientiousness && openness && agreeableness);
};

const checkTraitsAndMedical = (profile: StudentProfile | null): boolean => {
  return checkTraitsComplete(profile) && !!(profile?.medicalHistory);
};

const checkFullProfileComplete = (profile: StudentProfile | null): boolean => {
  if (!profile) return false;
  return !!(
    profile.traits &&
    profile.medicalHistory &&
    profile.areasOfInterest &&
    profile.socialContacts
  );
};

const calculateSemesterAverage = (marks: StudentMarks | null): number => {
  if (!marks?.subjects || marks.subjects.length === 0) return 0;
  const total = marks.subjects.reduce((sum, s) => {
    const totalMarks = (s.internal1?.total || 0) + (s.internal2?.total || 0) + (s.semester?.total || 0);
    const obtainedMarks = (s.internal1?.obtained || 0) + (s.internal2?.obtained || 0) + (s.semester?.obtained || 0);
    return sum + (totalMarks > 0 ? (obtainedMarks / totalMarks) * 100 : 0);
  }, 0);
  return total / marks.subjects.length;
};

const calculateImprovement = (marks: StudentMarks | null): number => {
  // Placeholder - would need historical data
  return 0;
};

const checkFailToExcellence = (marks: StudentMarks | null): boolean => {
  // Placeholder - would need historical data
  return false;
};

const calculatePassingStreak = (marks: StudentMarks | null): number => {
  // Placeholder - would need semester data
  if (!marks?.subjects || marks.subjects.length === 0) return 0;
  const allPassing = marks.subjects.every(s => {
    const totalMarks = (s.internal1?.total || 0) + (s.internal2?.total || 0) + (s.semester?.total || 0);
    const obtainedMarks = (s.internal1?.obtained || 0) + (s.internal2?.obtained || 0) + (s.semester?.obtained || 0);
    return totalMarks > 0 && (obtainedMarks / totalMarks) * 100 >= 40;
  });
  return allPassing ? 1 : 0;
};

const checkDiverseFriends = (friends: Friend[]): boolean => {
  // Check if friends are from different programs (would need friend data to include program)
  return friends.length >= 2;
};

const calculateDiverseCount = (friends: Friend[]): number => {
  // Placeholder - would need friend program data
  return 0;
};

// Save user badges to Firestore
export const saveUserBadges = async (userId: string, badges: Badge[]): Promise<void> => {
  const badgesRef = doc(db, 'users', userId, 'achievements', 'badges');
  await setDoc(badgesRef, {
    badges,
    updatedAt: new Date(),
  });
};

// Get user badges from Firestore
export const getUserBadges = async (userId: string): Promise<Badge[]> => {
  const badgesRef = doc(db, 'users', userId, 'achievements', 'badges');
  const badgesSnap = await getDoc(badgesRef);
  
  if (badgesSnap.exists()) {
    return badgesSnap.data().badges || [];
  }
  
  return [];
};

// Get badge progress for next level
export const getBadgeProgress = (
  badgeId: string,
  currentLevel: BadgeLevel | null,
  stats: any
): number => {
  const badgeDef = BADGE_DEFINITIONS.find(b => b.id === badgeId);
  if (!badgeDef) return 0;

  const nextLevel = currentLevel === null ? 'bronze' : currentLevel === 'bronze' ? 'silver' : currentLevel === 'silver' ? 'gold' : null;
  if (!nextLevel) return 100;

  const criteria = badgeDef.levels[nextLevel].criteria;
  // Calculate progress based on first numeric criteria
  for (const [key, value] of Object.entries(criteria)) {
    if (typeof value === 'number' && stats[key] !== undefined) {
      return Math.min(100, (stats[key] / value) * 100);
    }
  }

  return 0;
};
