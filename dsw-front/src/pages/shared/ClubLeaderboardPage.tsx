import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Award, 
  Medal, 
  Search, 
  Filter, 
  TrendingUp, 
  Users, 
  CheckCircle2, 
  Sparkles, 
  ArrowUpRight,
  ShieldCheck,
  Zap,
  RefreshCw
} from 'lucide-react';
import { apiRequest } from '../../lib/api';
import { useNavigate } from 'react-router-dom';

interface ClubRanking {
  rank: number;
  id: string;
  name: string;
  category: string;
  faculty_id: string;
  faculty_name: string;
  total_points: number;
  tasks_completed: number;
  total_members: number;
  is_active: boolean;
}

export const ClubLeaderboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [rankings, setRankings] = useState<ClubRanking[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const fetchRankings = async () => {
    setLoading(true);
    try {
      const data = await apiRequest<ClubRanking[]>('/clubs/leaderboard/rankings', 'GET', undefined, false, true);
      setRankings(data || []);
      setLastRefreshed(new Date());
    } catch (err) {
      console.error('Failed to fetch club leaderboard rankings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRankings();
  }, []);

  const categories = ['all', 'Technical', 'Cultural', 'Sports', 'Literary', 'Social & Welfare', 'Academic & Innovation'];

  const filteredRankings = rankings.filter((club) => {
    const matchesSearch = club.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (club.faculty_name && club.faculty_name.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || club.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const topThree = rankings.slice(0, 3);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8 space-y-8">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-blue-700 to-purple-800 text-white p-6 md:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-12 w-48 h-48 bg-amber-400/20 rounded-full blur-xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-amber-300 font-medium text-xs tracking-wider uppercase">
              <Trophy className="w-3.5 h-3.5" /> Official University Club Standings
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
              Student Club Leaderboard
            </h1>
            <p className="text-blue-100 max-w-2xl text-sm md:text-base leading-relaxed">
              Points are awarded transparently by the Directorate of Student Welfare based on verified task submissions, event execution, community outreach, and active member participation.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchRankings}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-sm font-semibold backdrop-blur-md border border-white/10 shadow-sm"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={() => {
                const currentPath = window.location.pathname;
                if (currentPath.startsWith('/admin')) navigate('/admin/clubs');
                else if (currentPath.startsWith('/faculty')) navigate('/faculty/clubs');
                else navigate('/student/clubs');
              }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-400 text-slate-900 hover:bg-amber-300 active:scale-95 transition-all text-sm font-bold shadow-lg shadow-amber-500/20"
            >
              <Users className="w-4 h-4" />
              Explore All Clubs
            </button>
          </div>
        </div>
      </div>

      {/* Top 3 Podium (when available) */}
      {topThree.length >= 1 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          {/* Rank 2 - Silver */}
          {topThree[1] ? (
            <div className="md:order-1 order-2 bg-gradient-to-b from-slate-100 to-white dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-md relative flex flex-col justify-between hover:shadow-xl transition-all duration-300 transform md:translate-y-4">
              <div className="flex items-center justify-between">
                <span className="w-10 h-10 rounded-2xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center font-black text-lg shadow-inner">
                  #2
                </span>
                <span className="px-3 py-1 bg-slate-200/70 dark:bg-slate-700 text-slate-800 dark:text-slate-300 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                  <Medal className="w-3.5 h-3.5 text-slate-400" /> Silver Tier
                </span>
              </div>
              <div className="my-6 text-center space-y-2">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-slate-400 to-slate-200 text-slate-900 flex items-center justify-center font-black text-2xl shadow-lg">
                  {topThree[1].name.charAt(0)}
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white line-clamp-1">{topThree[1].name}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{topThree[1].category} Club</p>
                <div className="pt-2 inline-block">
                  <span className="text-3xl font-black text-slate-800 dark:text-slate-100">{topThree[1].total_points}</span>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 ml-1">pts</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-4 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> {topThree[1].tasks_completed} Tasks Done</div>
                <div className="flex items-center gap-1.5"><Users className="w-4 h-4 text-blue-500" /> {topThree[1].total_members} Members</div>
              </div>
            </div>
          ) : (
            <div className="hidden md:block md:order-1" />
          )}

          {/* Rank 1 - Gold */}
          {topThree[0] && (
            <div className="md:order-2 order-1 bg-gradient-to-b from-amber-50 to-white dark:from-amber-950/40 dark:to-slate-900 border-2 border-amber-300 dark:border-amber-500/50 rounded-3xl p-6 shadow-xl relative flex flex-col justify-between hover:shadow-2xl transition-all duration-300">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-amber-400 text-slate-950 text-xs font-black rounded-full uppercase tracking-wider shadow-md flex items-center gap-1">
                <Trophy className="w-3.5 h-3.5 fill-current" /> Champion Leader
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-2xl shadow-lg shadow-amber-400/30">
                  #1
                </span>
                <span className="px-3 py-1 bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Gold Tier
                </span>
              </div>
              <div className="my-6 text-center space-y-2">
                <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 flex items-center justify-center font-black text-3xl shadow-xl ring-4 ring-amber-400/20">
                  {topThree[0].name.charAt(0)}
                </div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white line-clamp-1">{topThree[0].name}</h3>
                <p className="text-xs font-medium text-amber-700 dark:text-amber-400">{topThree[0].category} Club</p>
                <div className="pt-2 inline-block">
                  <span className="text-4xl font-black text-amber-600 dark:text-amber-400">{topThree[0].total_points}</span>
                  <span className="text-sm font-bold text-slate-500 dark:text-slate-400 ml-1">pts</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-4 border-t border-amber-200/50 dark:border-slate-800/80 text-xs text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-1.5 font-medium"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> {topThree[0].tasks_completed} Tasks Done</div>
                <div className="flex items-center gap-1.5 font-medium"><Users className="w-4 h-4 text-blue-500" /> {topThree[0].total_members} Members</div>
              </div>
            </div>
          )}

          {/* Rank 3 - Bronze */}
          {topThree[2] ? (
            <div className="md:order-3 order-3 bg-gradient-to-b from-orange-50 to-white dark:from-slate-800 dark:to-slate-900 border border-orange-200 dark:border-slate-800 rounded-3xl p-6 shadow-md relative flex flex-col justify-between hover:shadow-xl transition-all duration-300 transform md:translate-y-6">
              <div className="flex items-center justify-between">
                <span className="w-10 h-10 rounded-2xl bg-amber-700/20 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200 flex items-center justify-center font-black text-lg">
                  #3
                </span>
                <span className="px-3 py-1 bg-amber-100/60 dark:bg-amber-950 text-amber-800 dark:text-amber-300 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                  <Medal className="w-3.5 h-3.5 text-amber-700" /> Bronze Tier
                </span>
              </div>
              <div className="my-6 text-center space-y-2">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-amber-700 to-orange-400 text-white flex items-center justify-center font-black text-2xl shadow-lg">
                  {topThree[2].name.charAt(0)}
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white line-clamp-1">{topThree[2].name}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{topThree[2].category} Club</p>
                <div className="pt-2 inline-block">
                  <span className="text-3xl font-black text-amber-800 dark:text-amber-300">{topThree[2].total_points}</span>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 ml-1">pts</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-4 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> {topThree[2].tasks_completed} Tasks Done</div>
                <div className="flex items-center gap-1.5"><Users className="w-4 h-4 text-blue-500" /> {topThree[2].total_members} Members</div>
              </div>
            </div>
          ) : (
            <div className="hidden md:block md:order-3" />
          )}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search clubs by name or coordinator..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {cat === 'all' ? 'All Categories' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Leaderboard Rankings Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Active Club Standings</h2>
              <p className="text-xs text-slate-500">Updated continuously based on verified submissions</p>
            </div>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            {filteredRankings.length} {filteredRankings.length === 1 ? 'Club' : 'Clubs'} Listed
          </span>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-4">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-medium text-slate-500">Calculating standings...</p>
          </div>
        ) : filteredRankings.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <Trophy className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
            <h4 className="text-base font-bold text-slate-700 dark:text-slate-300">No clubs found</h4>
            <p className="text-xs text-slate-400">Try adjusting your search query or category filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="py-4 px-6 font-bold w-16">Rank</th>
                  <th className="py-4 px-6 font-bold">Club Details</th>
                  <th className="py-4 px-6 font-bold">Faculty Coordinator</th>
                  <th className="py-4 px-6 font-bold text-center">Tasks Completed</th>
                  <th className="py-4 px-6 font-bold text-center">Active Members</th>
                  <th className="py-4 px-6 font-bold text-right">Total Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredRankings.map((club) => {
                  const isTopOne = club.rank === 1;
                  const isTopTwo = club.rank === 2;
                  const isTopThree = club.rank === 3;

                  return (
                    <tr
                      key={club.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group"
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          {isTopOne ? (
                            <span className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-sm shadow-md">
                              1
                            </span>
                          ) : isTopTwo ? (
                            <span className="w-8 h-8 rounded-xl bg-slate-300 dark:bg-slate-600 text-slate-900 dark:text-white flex items-center justify-center font-black text-sm">
                              2
                            </span>
                          ) : isTopThree ? (
                            <span className="w-8 h-8 rounded-xl bg-amber-700/30 text-amber-900 dark:text-amber-200 flex items-center justify-center font-black text-sm">
                              3
                            </span>
                          ) : (
                            <span className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center font-bold text-sm">
                              {club.rank}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-black text-sm flex items-center justify-center uppercase shrink-0">
                            {club.name.substring(0, 2)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                              {club.name}
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-semibold">
                                {club.category}
                              </span>
                            </div>
                            <div className="text-xs text-slate-400 font-mono mt-0.5">
                              ID: {club.id.substring(0, 8)}...
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            {club.faculty_name || 'Assigned Faculty'}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-semibold text-xs border border-emerald-200 dark:border-emerald-800/40">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {club.tasks_completed}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className="inline-flex items-center gap-1 text-slate-700 dark:text-slate-300 font-medium text-xs">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          {club.total_members}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40">
                          <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                          <span className="text-base font-black text-amber-700 dark:text-amber-400">
                            {club.total_points}
                          </span>
                          <span className="text-xs font-bold text-amber-600/80">PTS</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
export default ClubLeaderboardPage;
