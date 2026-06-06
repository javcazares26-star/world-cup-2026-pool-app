// Map of team names to their flag emojis
export const TEAM_FLAGS: Record<string, string> = {
  // Group A
  "Mexico": "🇲🇽",
  "Canada": "🇨🇦",
  "USA": "🇺🇸",

  // Group B
  "Argentina": "🇦🇷",
  "Paraguay": "🇵🇾",
  "Peru": "🇵🇪",
  "Bolivia": "🇧🇴",

  // Group C
  "Brazil": "🇧🇷",
  "Colombia": "🇨🇴",
  "Venezuela": "🇻🇪",
  "Ecuador": "🇪🇨",

  // Group D
  "Uruguay": "🇺🇾",
  "Chile": "🇨🇱",
  "Panama": "🇵🇦",
  "Costa Rica": "🇨🇷",

  // Group E
  "Japan": "🇯🇵",
  "Australia": "🇦🇺",
  "South Korea": "🇰🇷",
  "Uzbekistan": "🇺🇿",

  // Group F
  "Morocco": "🇲🇦",
  "Portugal": "🇵🇹",
  "Croatia": "🇭🇷",
  "New Zealand": "🇳🇿",

  // Group G
  "Spain": "🇪🇸",
  "Netherlands": "🇳🇱",
  "Norway": "🇳🇴",
  "Saudi Arabia": "🇸🇦",

  // Group H
  "France": "🇫🇷",
  "England": "🇬🇧",
  "Belgium": "🇧🇪",
  "Turkey": "🇹🇷",

  // Group I
  "Germany": "🇩🇪",
  "Switzerland": "🇨🇭",
  "Tunisia": "🇹🇳",
  "Egypt": "🇪🇬",

  // Group J
  "Italy": "🇮🇹",
  "Ukraine": "🇺🇦",
  "Greece": "🇬🇷",
  "Scotland": "🇬🇧",

  // Group K
  "Ireland": "🇮🇪",
  "Bosnia/Herzeg.": "🇧🇦",
  "Bosnia and Herzegovina": "🇧🇦",
  "Serbia": "🇷🇸",
  "Cyprus": "🇨🇾",

  // Group L
  "Qatar": "🇶🇦",
  "Senegal": "🇸🇳",
  "South Africa": "🇿🇦",
  "Ghana": "🇬🇭",

  // Additional common names
  "Czech Rep.": "🇨🇿",
  "Czech Republic": "🇨🇿",
  "Curacao": "🇨🇼",
  "Curaçao": "🇨🇼",
  "Cape Verde": "🇨🇻",
  "Iran": "🇮🇷",
  "Iraq": "🇮🇶",
  "Ivory Coast": "🇨🇮",
  "Haiti": "🇭🇹",
};

export function getTeamFlag(teamName: string): string {
  return TEAM_FLAGS[teamName] || "🏳️";
}
