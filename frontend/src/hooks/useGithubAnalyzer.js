// hooks/useGitHubAnalyzer.js
// Custom hook that encapsulates all fetch state for the analyzer.
// Keeps App.jsx clean and makes the logic trivially testable.

import { useState, useCallback } from "react";
// Fixed path: pointing directly to your services directory instead of utils
import { analyzeProfile, fetchAllProfiles } from "../services/api"; 

export const useGitHubAnalyzer = () => {
  const [profile,  setProfile]  = useState(null);
  const [history,  setHistory]  = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);

  const analyze = useCallback(async (username) => {
    if (!username.trim()) return;
    setLoading(true);
    setError(null);
    setProfile(null);

    try {
      const { data } = await analyzeProfile(username.trim());
      setProfile(data.data);
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        (err.code === "ECONNABORTED" ? "Request timed out. Please try again." : "Something went wrong.");
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadHistory = useCallback(async () => {
    try {
      const { data } = await fetchAllProfiles();
      setHistory(data.data);
    } catch {
      /* history is non-critical; fail silently */
    }
  }, []);

  return { profile, history, loading, error, analyze, loadHistory };
};