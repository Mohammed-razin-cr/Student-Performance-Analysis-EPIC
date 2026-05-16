import { Badge } from "@/components/ui/badge";

export function ProfileSkills({ skills }: { skills: string[] }) {
  if (!skills || skills.length === 0) return null;
  return (
    <div className="mt-4">
      <div className="font-semibold text-white mb-1">Skills</div>
      <div className="flex flex-wrap gap-2">
        {skills.map((skill, i) => (
          <Badge key={i} variant="secondary" className="bg-primary/20 text-primary">{skill}</Badge>
        ))}
      </div>
    </div>
  );
}
