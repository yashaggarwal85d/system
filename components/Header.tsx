import { Player } from "@/lib/interfaces/player";
import { Card, CardContent } from "./ui/card";
import { Progress } from "./ui/progress";

interface TopBarProps {
    player: Player
  }
  
const Header: React.FC<TopBarProps> = ({ player }) => (
    <Card className="mb-8 bg-transparent">
        <CardContent className="p-6">
        <div className="flex flex-col items-center gap-2">
            <span className="text-lg font-bold text-[#4ADEF6]">{player.title}</span>
            <Progress 
            value={(player.aura / player.auraToNextLevel) * 100} 
            className="w-full bg-white/20 border-white/20 mt-1" 
            />
        </div>
        </CardContent>
    </Card>
);

export default Header