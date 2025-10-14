import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { useTournamentData } from '../hooks/useTournamentData';
import dataRefreshManager from '../utils/dataRefresh';

const DataConsistencyChecker = ({ showDetails = false }) => {
  const { topPerformers, standings, playerStats, matches, loading, lastUpdated } = useTournamentData();
  const [consistencyStatus, setConsistencyStatus] = useState({
    isConsistent: true,
    issues: [],
    lastCheck: null
  });
  const [isChecking, setIsChecking] = useState(false);

  const checkDataConsistency = () => {
    const issues = [];
    const now = new Date();

    // Check if data is recent (within last 5 minutes)
    if (lastUpdated && (now - lastUpdated) > 300000) {
      issues.push({
        type: 'stale',
        message: 'Data may be outdated (last updated more than 5 minutes ago)',
        severity: 'warning'
      });
    }

    // Check if top performers data is consistent with player stats
    if (topPerformers?.topRunScorers?.length > 0 && playerStats?.length > 0) {
      const topScorer = topPerformers.topRunScorers[0];
      const playerStat = playerStats.find(p => p.name === topScorer.name);
      
      if (!playerStat || playerStat.runs !== topScorer.runs) {
        issues.push({
          type: 'inconsistent',
          message: 'Top run scorer data does not match player statistics',
          severity: 'error'
        });
      }
    }

    // Check if standings data exists when matches are completed
    const completedMatches = matches?.filter(m => m.status === 'completed') || [];
    if (completedMatches.length > 0 && (!standings || standings.length === 0)) {
      issues.push({
        type: 'missing',
        message: 'No standings data found despite completed matches',
        severity: 'error'
      });
    }

    // Check if player stats exist when matches are completed
    if (completedMatches.length > 0 && (!playerStats || playerStats.length === 0)) {
      issues.push({
        type: 'missing',
        message: 'No player statistics found despite completed matches',
        severity: 'error'
      });
    }

    // Check for empty top performers when player stats exist
    if (playerStats?.length > 0 && 
        (!topPerformers?.topRunScorers?.length && !topPerformers?.topWicketTakers?.length)) {
      issues.push({
        type: 'missing',
        message: 'No top performers data found despite player statistics',
        severity: 'warning'
      });
    }

    setConsistencyStatus({
      isConsistent: issues.filter(i => i.severity === 'error').length === 0,
      issues,
      lastCheck: now
    });
  };

  const handleRefresh = async () => {
    setIsChecking(true);
    try {
      await dataRefreshManager.triggerCompleteRefresh(true, 'consistency-checker');
      setTimeout(() => {
        checkDataConsistency();
        setIsChecking(false);
      }, 2000); // Wait for data to propagate
    } catch (error) {
      console.error('Error refreshing data:', error);
      setIsChecking(false);
    }
  };

  useEffect(() => {
    if (!loading) {
      checkDataConsistency();
    }
  }, [topPerformers, standings, playerStats, matches, loading, lastUpdated]);

  if (loading) {
    return (
      <div className="flex items-center space-x-2 text-gray-500">
        <RefreshCw className="w-4 h-4 animate-spin" />
        <span className="text-sm">Checking data consistency...</span>
      </div>
    );
  }

  const errorIssues = consistencyStatus.issues.filter(i => i.severity === 'error');
  const warningIssues = consistencyStatus.issues.filter(i => i.severity === 'warning');

  return (
    <div className="bg-white rounded-lg border p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          {consistencyStatus.isConsistent ? (
            <CheckCircle className="w-5 h-5 text-green-500" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-red-500" />
          )}
          <h3 className="font-semibold text-gray-900">
            Data Consistency {consistencyStatus.isConsistent ? 'Good' : 'Issues Found'}
          </h3>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isChecking}
          className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
          <span>{isChecking ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
        <div className="bg-blue-50 rounded p-2 text-center">
          <div className="font-semibold text-blue-900">{matches?.length || 0}</div>
          <div className="text-blue-700">Total Matches</div>
        </div>
        <div className="bg-green-50 rounded p-2 text-center">
          <div className="font-semibold text-green-900">{standings?.length || 0}</div>
          <div className="text-green-700">Teams in Standings</div>
        </div>
        <div className="bg-purple-50 rounded p-2 text-center">
          <div className="font-semibold text-purple-900">{playerStats?.length || 0}</div>
          <div className="text-purple-700">Player Stats</div>
        </div>
        <div className="bg-orange-50 rounded p-2 text-center">
          <div className="font-semibold text-orange-900">
            {(topPerformers?.topRunScorers?.length || 0) + (topPerformers?.topWicketTakers?.length || 0)}
          </div>
          <div className="text-orange-700">Top Performers</div>
        </div>
      </div>

      {/* Issues */}
      {(errorIssues.length > 0 || warningIssues.length > 0) && showDetails && (
        <div className="space-y-2">
          {errorIssues.map((issue, index) => (
            <div key={index} className="flex items-start space-x-2 p-2 bg-red-50 border border-red-200 rounded">
              <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-red-800">{issue.message}</span>
            </div>
          ))}
          {warningIssues.map((issue, index) => (
            <div key={index} className="flex items-start space-x-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
              <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-yellow-800">{issue.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* Last updated info */}
      {lastUpdated && (
        <div className="mt-3 text-xs text-gray-500">
          Last updated: {lastUpdated.toLocaleTimeString()}
          {consistencyStatus.lastCheck && (
            <span className="ml-2">
              • Checked: {consistencyStatus.lastCheck.toLocaleTimeString()}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default DataConsistencyChecker;