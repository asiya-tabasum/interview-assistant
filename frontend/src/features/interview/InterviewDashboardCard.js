import React from "react";

function InterviewDashboardCard({ candidate, interviews }) {
  if (!candidate) return null;
  return (
    <div className="p-6 bg-white rounded shadow mt-4">
      <h2 className="text-xl font-bold mb-2">{candidate.name}</h2>
      <div className="mb-2">Email: {candidate.email}</div>
      <div className="mb-2">Phone: {candidate.phone}</div>
      <div className="mb-2">Score: {candidate.score ?? "N/A"}</div>
      <div className="mb-4">Summary: {candidate.summary}</div>
      <h3 className="font-semibold mb-2">Interview Q&A</h3>
      <ul className="space-y-2">
        {interviews && interviews.length > 0 ? (
          interviews.map((item, idx) => (
            <li key={idx} className="border-b pb-2">
              <div className="font-medium">Q: {item.question}</div>
              <div className="ml-2">A: {item.answer}</div>
              <div className="ml-2 text-xs text-gray-500">
                Score: {item.score} | Difficulty: {item.difficulty} | Time: {item.time_spent}s
              </div>
            </li>
          ))
        ) : (
          <li>No interview data.</li>
        )}
      </ul>
    </div>
  );
}

export default InterviewDashboardCard;