export type BadgeLevel = 'bronze' | 'silver' | 'gold';

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  level: BadgeLevel;
  category: 'academic' | 'social' | 'attendance' | 'prediction' | 'elite';
  earned: boolean;
  earnedDate?: Date;
  progress?: number; // 0-100
  requirement: string;
}

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'academic' | 'social' | 'attendance' | 'prediction' | 'elite';
  levels: {
    bronze: { requirement: string; criteria: any };
    silver: { requirement: string; criteria: any };
    gold: { requirement: string; criteria: any };
  };
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    id: 'perfect-score',
    name: 'Perfect Score',
    description: 'Score perfectly in exams',
    icon: '🏆',
    category: 'academic',
    levels: {
      bronze: { requirement: 'Score 100% in 1 subject', criteria: { perfectScores: 1 } },
      silver: { requirement: 'Score 100% in 3 subjects', criteria: { perfectScores: 3 } },
      gold: { requirement: 'Score 100% in 5 subjects', criteria: { perfectScores: 5 } },
    },
  },
  {
    id: 'subject-master',
    name: 'Subject Master',
    description: 'Master your subjects with excellence',
    icon: '📚',
    category: 'academic',
    levels: {
      bronze: { requirement: 'Score 90%+ in 1 subject', criteria: { subjectsAbove90: 1 } },
      silver: { requirement: 'Score 90%+ in 3 subjects', criteria: { subjectsAbove90: 3 } },
      gold: { requirement: 'Score 90%+ in all subjects', criteria: { allSubjectsAbove90: true } },
    },
  },
  {
    id: 'attendance-champion',
    name: 'Attendance Champion',
    description: 'Maintain excellent attendance',
    icon: '🎯',
    category: 'attendance',
    levels: {
      bronze: { requirement: '85%+ attendance', criteria: { attendancePercent: 85 } },
      silver: { requirement: '95%+ attendance', criteria: { attendancePercent: 95 } },
      gold: { requirement: '100% attendance', criteria: { attendancePercent: 100 } },
    },
  },
  {
    id: 'social-connector',
    name: 'Social Connector',
    description: 'Build your network',
    icon: '🤝',
    category: 'social',
    levels: {
      bronze: { requirement: 'Connect with 5+ friends', criteria: { friendCount: 5 } },
      silver: { requirement: 'Connect with 10+ friends', criteria: { friendCount: 10 } },
      gold: { requirement: 'Connect with 25+ friends', criteria: { friendCount: 25 } },
    },
  },
  {
    id: 'popular-student',
    name: 'Popular Student',
    description: 'Become well-known in your network',
    icon: '👥',
    category: 'social',
    levels: {
      bronze: { requirement: 'Have 15+ friends', criteria: { friendCount: 15 } },
      silver: { requirement: 'Have 25+ friends', criteria: { friendCount: 25 } },
      gold: { requirement: 'Have 50+ friends', criteria: { friendCount: 50 } },
    },
  },
  {
    id: 'self-aware-scholar',
    name: 'Self-Aware Scholar',
    description: 'Complete your personality profile',
    icon: '🧠',
    category: 'elite',
    levels: {
      bronze: { requirement: 'Complete traits profile', criteria: { traitsComplete: true } },
      silver: { requirement: 'Complete traits + medical history', criteria: { traitsAndMedical: true } },
      gold: { requirement: 'Complete all profile sections', criteria: { fullProfileComplete: true } },
    },
  },
  {
    id: 'prediction-master',
    name: 'Prediction Master',
    description: 'Match AI predictions accurately',
    icon: '🎯',
    category: 'prediction',
    levels: {
      bronze: { requirement: 'Match prediction within 10%', criteria: { predictionAccuracy: 10 } },
      silver: { requirement: 'Match prediction within 5%', criteria: { predictionAccuracy: 5 } },
      gold: { requirement: 'Match prediction within 2%', criteria: { predictionAccuracy: 2 } },
    },
  },
  {
    id: 'trend-breaker',
    name: 'Trend Breaker',
    description: 'Exceed AI predictions',
    icon: '📊',
    category: 'prediction',
    levels: {
      bronze: { requirement: 'Score 5%+ above prediction', criteria: { exceedBy: 5 } },
      silver: { requirement: 'Score 10%+ above prediction', criteria: { exceedBy: 10 } },
      gold: { requirement: 'Score 15%+ above prediction', criteria: { exceedBy: 15 } },
    },
  },
  {
    id: 'comeback-warrior',
    name: 'Comeback Warrior',
    description: 'Recover from poor performance',
    icon: '⚔️',
    category: 'academic',
    levels: {
      bronze: { requirement: 'Improve by 10%+ in a subject', criteria: { improvement: 10 } },
      silver: { requirement: 'Improve by 20%+ in a subject', criteria: { improvement: 20 } },
      gold: { requirement: 'Improve from failing to 80%+', criteria: { failToExcellence: true } },
    },
  },
  {
    id: 'semester-legend',
    name: 'Semester Legend',
    description: 'Outstanding semester performance',
    icon: '👑',
    category: 'academic',
    levels: {
      bronze: { requirement: '80%+ average for semester', criteria: { semesterAverage: 80 } },
      silver: { requirement: '90%+ average for semester', criteria: { semesterAverage: 90 } },
      gold: { requirement: '95%+ average for semester', criteria: { semesterAverage: 95 } },
    },
  },
  {
    id: 'no-failures',
    name: 'No Failures',
    description: 'Pass all your subjects',
    icon: '✅',
    category: 'academic',
    levels: {
      bronze: { requirement: 'Pass all subjects (1 semester)', criteria: { passingStreak: 1 } },
      silver: { requirement: 'Pass all subjects (2 semesters)', criteria: { passingStreak: 2 } },
      gold: { requirement: 'Pass all subjects (full year)', criteria: { passingStreak: 3 } },
    },
  },
  {
    id: 'network-builder',
    name: 'Network Builder',
    description: 'Diversify your connections',
    icon: '🌐',
    category: 'social',
    levels: {
      bronze: { requirement: 'Have friends from both programs', criteria: { diverseFriends: true } },
      silver: { requirement: 'Have 5+ friends from each program', criteria: { diverseCount: 5 } },
      gold: { requirement: 'Have 10+ friends from each program', criteria: { diverseCount: 10 } },
    },
  },
  {
    id: 'perfect-student',
    name: 'Perfect Student',
    description: 'The ultimate achievement',
    icon: '💎',
    category: 'elite',
    levels: {
      bronze: { requirement: '85%+ grades + 90%+ attendance', criteria: { grades: 85, attendance: 90 } },
      silver: { requirement: '90%+ grades + 95%+ attendance + 10+ friends', criteria: { grades: 90, attendance: 95, friends: 10 } },
      gold: { requirement: '95%+ grades + 100% attendance + 25+ friends + full profile', criteria: { grades: 95, attendance: 100, friends: 25, fullProfile: true } },
    },
  },
];
