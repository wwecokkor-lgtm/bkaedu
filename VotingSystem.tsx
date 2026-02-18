
import React, { useState, useEffect } from 'react';
import { Poll } from './types';
import { useAuth } from './AuthContext';
import { voteOnPoll, checkUserVote, subscribeToPolls } from './api';

const VotingSystem = () => {
  const { userProfile } = useAuth();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [userVotes, setUserVotes] = useState<{[pollId: string]: string}>({});
  const [loadingVote, setLoadingVote] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToPolls(setPolls);
    return () => unsubscribe();
  }, []);

  // Check which polls user has voted on
  useEffect(() => {
    if (userProfile && polls.length > 0) {
      polls.forEach(async (poll) => {
        if (!userVotes[poll.id]) {
           const vote = await checkUserVote(poll.id, userProfile.uid);
           if (vote) {
             setUserVotes(prev => ({ ...prev, [poll.id]: vote }));
           }
        }
      });
    }
  }, [polls, userProfile]);

  const handleVote = async (pollId: string, optionId: string) => {
    if (!userProfile) return alert("Please login to vote");
    if (userVotes[pollId]) return;

    setLoadingVote(pollId);
    const result = await voteOnPoll(pollId, optionId, userProfile.uid);
    
    if (result.success) {
      setUserVotes(prev => ({ ...prev, [pollId]: optionId }));
    } else {
      alert(result.message || "Voting failed");
    }
    setLoadingVote(null);
  };

  const getPercentage = (count: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((count / total) * 100);
  };

  if (polls.length === 0) return null;

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
        <i className="fas fa-poll text-blue-600 mr-3"></i> Community Polls
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {polls.filter(p => p.isActive).map(poll => {
          const hasVoted = !!userVotes[poll.id];
          const isExpired = Date.now() > poll.expiryDate;
          const showResults = hasVoted || isExpired;

          return (
            <div key={poll.id} className="bg-white rounded-xl shadow-md border border-gray-100 p-6 hover:shadow-lg transition">
               <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-bold text-gray-900">{poll.title}</h3>
                  {isExpired && <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded">Expired</span>}
               </div>
               <p className="text-gray-500 text-sm mb-6">{poll.description}</p>

               <div className="space-y-3">
                  {poll.options.map(option => {
                     const percent = getPercentage(option.voteCount, poll.totalVotes);
                     const isSelected = userVotes[poll.id] === option.id;

                     return (
                        <div key={option.id} className="relative">
                           {/* Result Bar Background */}
                           {showResults && (
                              <div className="absolute inset-0 bg-blue-50 rounded-lg overflow-hidden h-full">
                                 <div 
                                   className={`h-full transition-all duration-1000 ${isSelected ? 'bg-blue-200' : 'bg-gray-200'}`} 
                                   style={{ width: `${percent}%` }}
                                 ></div>
                              </div>
                           )}

                           <button 
                             disabled={showResults || loadingVote === poll.id}
                             onClick={() => handleVote(poll.id, option.id)}
                             className={`relative w-full flex justify-between items-center p-3 rounded-lg border-2 transition z-10 ${
                               isSelected 
                                 ? 'border-blue-600 text-blue-800' 
                                 : showResults 
                                   ? 'border-transparent text-gray-700' 
                                   : 'border-gray-200 hover:border-blue-400 hover:bg-gray-50'
                             }`}
                           >
                              <span className="font-bold text-sm flex items-center">
                                 {isSelected && <i className="fas fa-check-circle text-blue-600 mr-2"></i>}
                                 {option.text}
                              </span>
                              {showResults && (
                                 <span className="font-bold text-sm">{percent}%</span>
                              )}
                           </button>
                        </div>
                     );
                  })}
               </div>

               <div className="mt-4 pt-4 border-t flex justify-between text-xs text-gray-500">
                  <span>Total Votes: {poll.totalVotes}</span>
                  <span>Ends: {new Date(poll.expiryDate).toLocaleDateString()}</span>
               </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default VotingSystem;
