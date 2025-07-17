// 📁 project.controller.js
import Project from "../models/Project.js";
import sendMail from "../utils/sendEmail.js";
import User from "../models/User.js";

// 🎯 Utility to update points with logs
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

// ✅ Add Project
export const addProject = async (req, res) => {
  const {
    title,
    description,
    category,
    startDate,
    endDate,
    images,
    fundingGoal,
    city,
  } = req.body;

  try {
    const createdBy = req.user.id;

    let level;
    if (fundingGoal <= 10000) level = "small";
    else if (fundingGoal <= 100000) level = "medium";
    else level = "large";

    const newProject = new Project({
      title,
      description,
      category,
      startDate,
      endDate,
      createdBy,
      images,
      fundingGoal,
      level,
      location: { city },
    });

    const savedProject = await newProject.save();

    const pointsMap = { small: 10, medium: 15, large: 20 };
    const points = pointsMap[level];

    const user = await updatePoints(createdBy, points, `Project created: ${title}`);
    sendMail(user.email, `Project created successfully. You earned ${points} points.`);

    res.json({
      success: true,
      project: savedProject,
      message: "Project created successfully",
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ✅ Get All Projects
export const getAllProjects = async (req, res) => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      project: projects,
      message: "Projects fetched successfully",
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ✅ Join Project
export const joinProject = async (req, res) => {
  const { projectId } = req.params;

  try {
    const updatedProject = await Project.findByIdAndUpdate(
      projectId,
      { $push: { members: req.user.id } },
      { new: true }
    );

    const funding = updatedProject.fundingGoal;
    const points = funding <= 10000 ? 2 : funding <= 100000 ? 5 : 10;

    const user = await updatePoints(req.user.id, points, `Joined project: ${updatedProject.title}`);
    sendMail(user.email, `Project joined successfully. You earned ${points} points.`);

    res.json({
      success: true,
      project: updatedProject,
      message: "Project joined successfully",
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ✅ Get Project by ID
export const getProject = async (req, res) => {
  const { projectId } = req.params;
  try {
    const project = await Project.findById(projectId);
    res.json({ success: true, project, message: "Project fetched successfully" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ✅ Request to Join Project
export const requestProject = async (req, res) => {
  const { projectId } = req.body;

  try {
    const updatedProject = await Project.findByIdAndUpdate(
      projectId,
      { $push: { requests: req.user.id } },
      { new: true }
    );

    const user = await User.findById(req.user.id);
    sendMail(user.email, "Request sent successfully");

    res.json({
      success: true,
      project: updatedProject,
      message: "Request sent successfully",
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ✅ Assign Project
export const assignProject = async (req, res) => {
  const { userId } = req.body;
  const { id } = req.params;

  try {
    const updatedProject = await Project.findByIdAndUpdate(
      id,
      {
        $push: { assignedTo: userId },
        $pull: { requests: userId },
      },
      { new: true }
    );

    const user = await User.findById(userId);
    sendMail(user.email, "Project assigned successfully");

    res.json({
      success: true,
      project: updatedProject,
      message: "Project assigned successfully",
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ✅ Mark Project as Completed
export const completeProject = async (req, res) => {
  const { projectId } = req.params;

  try {
    const project = await Project.findByIdAndUpdate(
      projectId,
      { status: "completed" },
      { new: true }
    );

    if (!project)
      return res.status(404).json({ message: "Project not found" });

    await updatePoints(
      project.createdBy,
      25,
      `Completed project: ${project.title}`
    );

    res.json({
      success: true,
      message: "Project marked as completed",
      project,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
