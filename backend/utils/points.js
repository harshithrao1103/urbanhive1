// backend/utils/points.js
import User from '../models/User.js';

// Generic point adder
export const addPoints = async (userId, amount, reason) => {
  const user = await User.findById(userId);
  if (!user) return;

  user.points += amount;
  user.logs.push({
    pointsAdded: amount,
    reason,
    date: new Date()
  });

  await user.save();
};

// Daily login points (only once per day)
export const addDailyLoginPoints = async (userId) => {
  const user = await User.findById(userId);
  if (!user) return;

  const today = new Date().toDateString();
  const alreadyLogged = user.logs.some(
    (log) => log.reason === "Daily Login" && new Date(log.date).toDateString() === today
  );

  if (!alreadyLogged) {
    user.points += 1;
    user.logs.push({
      pointsAdded: 1,
      reason: "Daily Login",
      date: new Date()
    });
    await user.save();
  }
};
