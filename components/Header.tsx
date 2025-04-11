import { Card, CardContent } from "./common/card";
import useDashboardStore from "@/store/dashboardStore";
const Header: React.FC = () => {
  const playerAura = useDashboardStore((state) => state.player?.aura);
  const playerLevel = useDashboardStore((state) => state.player?.level);

  if (playerAura === undefined || playerLevel === undefined) {
    return null;
  }

  const progressPercentage = playerAura / playerLevel;

  return (
    <Card className="mb-8 border-none bg-transparent shadow-none">
      <CardContent className="p-6">
        <div className="flex items-center gap-3">
          {/* Level Icon */}
          <div className="w-6 h-6 rounded-full bg-cyan-600 border border-cyan-400/80 shadow-[0_0_4px_1px_rgba(74,222,246,0.5)] flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-white leading-none">
              {playerLevel}
            </span>
          </div>
          {/* Progress Bar Container */}
          <div className="relative w-full h-3 rounded-full bg-black/30 border border-cyan-400/50 shadow-[0_0_10px_2px_rgba(74,222,246,0.4)] overflow-hidden">
            {/* Inner container to handle padding */}
            <div className="absolute inset-y-0 left-1 right-1">
              {/* Progress Bar Fill */}
              <div
                className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-cyan-300 shadow-[0_0_6px_1px_rgba(110,231,255,0.9)] transition-all duration-500 ease-out"
                style={{
                  width: `calc(${progressPercentage}% - 0.5rem)`,
                }}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default Header;
