import React, { useEffect, useState } from 'react';
import axios from 'axios';
import InterviewDashboardCard from './InterviewDashboardCard';

const API_BASE = "http://localhost:8000";

function InterviewerDashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('score');
  const [sortOrder, setSortOrder] = useState('desc');
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [candidateDetails, setCandidateDetails] = useState(null);

  // Fetch all candidates on mount
  useEffect(() => {
    axios.get(`${API_BASE}/candidates`)
      .then(res => setCandidates(res.data))
      .catch(() => setCandidates([]));
  }, []);

  // Fetch details for selected candidate
  useEffect(() => {
    if (selectedCandidate) {
      axios.get(`${API_BASE}/candidates/${selectedCandidate.id}`)
        .then(res => setCandidateDetails(res.data))
        .catch(() => setCandidateDetails(null));
    }
  }, [selectedCandidate]);

  const sortedAndFilteredCandidates = [...candidates]
    .filter((candidate) =>
      candidate.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const order = sortOrder === 'asc' ? 1 : -1;
      return (a[sortField] > b[sortField] ? 1 : -1) * order;
    });

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Candidates Dashboard</h1>
        <input
          type="text"
          placeholder="Search candidates..."
          className="border rounded-md px-4 py-2 w-64"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('name')}
              >
                Name
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('score')}
              >
                Score
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Summary
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedAndFilteredCandidates.map((candidate, index) => (
              <tr key={index}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{candidate.name}</div>
                  <div className="text-sm text-gray-500">{candidate.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{candidate.score}%</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900 max-w-xs truncate">
                    {candidate.summary}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    className="text-indigo-600 hover:text-indigo-900"
                    onClick={() => setSelectedCandidate(candidate)}
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Candidate Details Card */}
      {candidateDetails && (
        <InterviewDashboardCard
          candidate={candidateDetails.candidate}
          interviews={candidateDetails.interviews}
        />
      )}
    </div>
  );
}

export default InterviewerDashboard;