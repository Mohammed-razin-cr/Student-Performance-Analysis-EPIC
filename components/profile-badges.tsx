import { useEffect, useState } from "react";
import { calculateUserBadges } from "@/lib/badges";
import { getStudentMarks, getStudentProfile, getFriendsList } from "@/lib/firestore";
import type { Badge as BadgeType } from "@/types/badges";
import { Trophy, Award } from "lucide-react";

export function ProfileBadges({ userId }: { userId: string }) {
  const [badges, setBadges] = useState<BadgeType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBadges = async () => {
      try {
        const [marks, profile, friends] = await Promise.all([
          getStudentMarks(userId),
          getStudentProfile(userId),
          getFriendsList(userId),
        ]);
        const earnedBadges = await calculateUserBadges(userId, marks, friends, profile);
        setBadges(earnedBadges);
      } catch (err) {
        setBadges([]);
      } finally {
        setLoading(false);
      }
    };
    fetchBadges();
  }, [userId]);

  if (loading) return <div className="py-4 text-center text-gray-400">Loading badges...</div>;
  if (badges.length === 0) return null;

  const levelTextColors = {
    bronze: 'text-orange-400',
    silver: 'text-gray-300',
    gold: 'text-yellow-400',
  };

  return (
    <div className="mt-4">
      <div className="flex items-center gap-2 mb-2">
        <Trophy className="h-5 w-5 text-primary" />
        <span className="font-semibold text-foreground dark:text-white">Achievements</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {badges.slice(0, 6).map((badge) => (
          <div key={badge.id} className="flex items-center gap-1 bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded-lg">
            <span className="text-xl">{badge.icon}</span>
            <span className="text-xs font-medium text-foreground dark:text-white">{badge.name}</span>
            <span className={`ml-1 text-xs ${levelTextColors[badge.level]}`}>{badge.level.toUpperCase()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
