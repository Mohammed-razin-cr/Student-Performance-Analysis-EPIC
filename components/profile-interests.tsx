import { Badge } from "@/components/ui/badge";

export function ProfileInterests({ interests }: { interests: string[] }) {
  if (!interests || interests.length === 0) return null;
  return (
    <div className="mt-4">
      <div className="font-semibold text-white mb-1">Interests</div>
      <div className="flex flex-wrap gap-2">
        {interests.map((interest, i) => (
          <Badge key={i} variant="secondary" className="bg-primary/20 text-primary">{interest}</Badge>
        ))}
      </div>
    </div>
  );
}
