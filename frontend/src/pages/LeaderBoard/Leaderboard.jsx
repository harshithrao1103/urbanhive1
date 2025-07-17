import React, { useEffect, useState } from "react";
import axios from "axios";

const colors = ["bg-yellow-400", "bg-gray-400", "bg-amber-700"]; // Top 3 colors

const Leaderboard = () => {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    axios
      .get("http://localhost:8000/api/auth/leaderboard")
      .then((res) => setUsers(res.data.users))
      .catch((err) => console.error("Failed to load leaderboard", err));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-r from-emerald-50 to-teal-50 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">🏆 Leaderboard</h1>
      <div className="max-w-3xl mx-auto space-y-4">
        {users.map((user, index) => (
          <div
            key={user._id}
            className={`flex justify-between items-center px-6 py-4 rounded-lg shadow-md text-black ${
              index < 3 ? colors[index] : "bg-white text-black"
            }`}
          >
            <span className="font-semibold">
              {index + 1}. {user.name}
            </span>
            <span className="font-semibold">{user.points} pts</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Leaderboard;
