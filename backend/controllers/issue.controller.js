import Issues from "../models/Issue.js";
import User from "../models/User.js";
import sendMail from "../utils/sendEmail.js";

// ✅ Centralized Points Utility
async function updatePoints(userId, pointsToAdd, reason) {
  try {
    const user = await User.findOneAndUpdate(
      { _id: userId },
      {
        $inc: { points: pointsToAdd },
        $push: {
          logs: {
            pointsAdded: pointsToAdd,
            reason,
            date: new Date(),
          },
        },
      },
      { new: true }
    );
    console.log("✅ Updated user points:", user);
    return user;
  } catch (error) {
    console.error("❌ Error updating points:", error);
    throw error;
  }
}

// 🚨 Report an Issue
export const reportIssue = async (req, res) => {
  try {
    const { issueType, description, location, priority } = req.body;
    const createdBy = req.user.id;

    const newIssue = new Issues({
      createdBy,
      issueType,
      description,
      location,
      priority,
    });

    await newIssue.save();

    const points = 10;
    const user = await updatePoints(createdBy, points, "Raised a civic issue");

    sendMail(user.email, `Issue reported successfully. You earned ${points} points.`);

    res.status(201).json({
      success: true,
      message: "Issue reported successfully!",
      issue: newIssue,
    });
  } catch (error) {
    console.error("❌ Error reporting issue:", error);
    res.status(500).json({
      success: false,
      message: "Failed to report issue",
      details: error.message,
    });
  }
};

// 📥 Get All Issues
export const getAllIssues = async (req, res) => {
  try {
    const issues = await Issues.find().populate("createdBy", "name");
    res.status(200).json({
      success: true,
      issues,
      message: "Issues returned successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch issues",
      details: error.message,
    });
  }
};

// 📍 Get Nearby Issues
export const getNearbyIssues = async (req, res) => {
  try {
    const { longitude, latitude, radius } = req.query;
    if (!longitude || !latitude || !radius) {
      return res.status(400).json({
        success: false,
        message: "Missing required query parameters",
      });
    }

    const issues = await Issues.find({
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(longitude), parseFloat(latitude)],
          },
          $maxDistance: parseInt(radius),
        },
      },
    });

    res.status(200).json({ success: true, issues });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch nearby issues",
      details: error.message,
    });
  }
};

// 🛠️ Update Issue Status
export const updateIssueStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const updatedIssue = await Issues.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!updatedIssue) {
      return res.status(404).json({
        success: false,
        message: "Issue not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Issue status updated successfully",
      issue: updatedIssue,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update issue status",
      details: error.message,
    });
  }
};
