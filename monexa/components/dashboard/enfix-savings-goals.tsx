interface SavingsGoal {
  id: string;
  title: string;
  targetAmount: number;
  savedAmount: number;
}

interface EnfixSavingsGoalsProps {
  goals: SavingsGoal[];
}

export function EnfixSavingsGoals({ goals }: EnfixSavingsGoalsProps) {
  const colors = [
    { stroke: "#f43f5e", bg: "#ffe4e6" }, // rose/pink
    { stroke: "#10b981", bg: "#d1fae5" }, // emerald/green
    { stroke: "#3b82f6", bg: "#dbeafe" }, // blue
    { stroke: "#eab308", bg: "#fef9c3" }, // yellow
  ];

  const displayGoals = goals;

  return (
    <div className="w-full h-full">
      <h2 className="text-[#1e293b] font-bold text-lg mb-6">Saving Goals</h2>
      
      {displayGoals.length === 0 ? (
        <div className="flex items-center justify-center h-48 bg-white/50 rounded-3xl text-sm text-gray-400">
          No savings goals yet.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-y-10 gap-x-6">
          {displayGoals.slice(0, 4).map((goal, i) => {
          const percent = Math.min(Math.round((goal.savedAmount / goal.targetAmount) * 100) || 0, 100);
          const color = colors[i % colors.length];
          const radius = 40;
          const circumference = 2 * Math.PI * radius;
          const strokeDashoffset = circumference - (percent / 100) * circumference;

          return (
            <div key={goal.id} className="flex flex-col items-center justify-center">
              <div className="relative w-28 h-28 flex items-center justify-center">
                {/* Background Circle */}
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    fill="transparent"
                    stroke={color.bg}
                    strokeWidth="8"
                  />
                  {/* Progress Circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    fill="transparent"
                    stroke={color.stroke}
                    strokeWidth="8"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                {/* Center Text */}
                <span className={`absolute text-3xl font-bold`} style={{ color: color.stroke }}>
                  {percent}
                </span>
              </div>
              <p className="mt-3 text-sm font-bold text-[#1e293b]">{goal.title}</p>
            </div>
          );
        })}
        </div>
      )}
    </div>
  );
}
