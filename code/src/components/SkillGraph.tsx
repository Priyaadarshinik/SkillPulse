import { useMemo } from "react";
import { Card } from "./ui/card";
import { TrendingUp, Code } from "lucide-react";

interface Repository {
  languages: any; // Json type from Supabase
}

interface SkillGraphProps {
  repositories: Repository[];
}

export const SkillGraph = ({ repositories }: SkillGraphProps) => {
  const skills = useMemo(() => {
    const languageCounts: Record<string, number> = {};
    
    repositories.forEach(repo => {
      if (repo.languages && typeof repo.languages === 'object') {
        Object.keys(repo.languages).forEach(lang => {
          languageCounts[lang] = (languageCounts[lang] || 0) + 1;
        });
      }
    });

    const total = repositories.length || 1;
    
    return Object.entries(languageCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6)
      .map(([name, count]) => ({
        name,
        level: Math.round((count / total) * 100),
        icon: Code,
        color: count % 2 === 0 ? "text-primary" : "text-accent",
      }));
  }, [repositories]);

  return (
    <Card className="p-6 bg-card border-border sticky top-8">
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="w-5 h-5 text-accent" />
        <h3 className="text-lg font-semibold">Your Skills</h3>
      </div>

      <div className="space-y-6">
        {skills.map((skill) => {
          const Icon = skill.icon;
          return (
            <div key={skill.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${skill.color}`} />
                  <span className="text-sm font-medium">{skill.name}</span>
                </div>
                <span className="text-sm text-muted-foreground">{skill.level}%</span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-hero transition-all duration-1000 ease-out rounded-full"
                  style={{ width: `${skill.level}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 pt-6 border-t border-border">
        <p className="text-xs text-muted-foreground text-center">
          Skills analyzed from your GitHub repositories
        </p>
      </div>
    </Card>
  );
};
