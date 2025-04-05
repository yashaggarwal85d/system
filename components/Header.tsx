import { Player } from "@/lib/interfaces/player";
import { Card, CardContent } from "./common/card";

interface TopBarProps {
  player: Player;
}

const Header: React.FC<TopBarProps> = ({ player }) => {
  const progressPercentage = (player.aura / player.auraToNextLevel) * 100;

  return (
    <Card className="mb-8 border-none bg-transparent shadow-none">
      <CardContent className="p-6">
        <div className="flex flex-col items-center gap-3">
          <div className="relative w-full h-3 rounded-full bg-black/30 border border-cyan-400/50 shadow-[0_0_10px_2px_rgba(74,222,246,0.4)] overflow-hidden">
            <div
              className="absolute top-1/2 left-1 h-1 -translate-y-1/2 rounded-full bg-cyan-300 shadow-[0_0_6px_1px_rgba(110,231,255,0.9)] transition-all duration-500 ease-out"
              style={{
                width: `calc(${progressPercentage}% - 0.5rem)`,
              }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default Header;
