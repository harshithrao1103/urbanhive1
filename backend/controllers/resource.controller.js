import Resource from "../models/Resource.js";
import sendMail from "../utils/sendEmail.js";
import User from "../models/User.js";

//  Centralized Points Utility
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
    console.log(" Updated user points:", user);
    return user;
  } catch (error) {
    console.error(" Error updating points:", error);
    throw error;
  }
}

// ➕ Add Resource (+10 points)
export const addResource = async (req, res) => {
  const { name, category, status, price, description, contact, imageBase64 } = req.body;

  try {
    const owner = req.user.id;

    const newResource = new Resource({
      name,
      category,
      status,
      price,
      description,
      contact,
      images: imageBase64,
      owner,
    });

    const savedResource = await newResource.save();

    await updatePoints(owner, 10, `Created resource: ${savedResource.name}`);

    const user = await User.findById(owner);
    sendMail(user.email, ` Resource added successfully! You earned 10 points.`);

    res.json({
      success: true,
      message: "Resource saved successfully",
      resource: savedResource,
    });
  } catch (err) {
    console.error(" Add Resource Error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// 🛒 Buy Resource (+10 points to buyer)
export const buyResource = async (req, res) => {
  try {
    const { resourceId } = req.body;
    const buyerId = req.user.id;

    const resource = await Resource.findById(resourceId);
    if (!resource) {
      return res.status(404).json({ success: false, message: "Resource not found" });
    }

    // Prevent self-purchase
    if (resource.owner.toString() === buyerId) {
      return res.status(400).json({ success: false, message: "You cannot buy your own resource" });
    }

    // Reward both buyer and seller
    await updatePoints(buyerId, 10, `Bought resource: ${resource.name}`);
    await updatePoints(resource.owner, 10, `Sold resource: ${resource.name}`);

    const buyer = await User.findById(buyerId);
    const seller = await User.findById(resource.owner);

    sendMail(buyer.email, `🎉 You bought ${resource.name} and earned 10 points!`);
    sendMail(seller.email, `🎉 Your resource ${resource.name} was sold. You earned 10 points!`);

    res.json({ success: true, message: "Resource purchased successfully" });
  } catch (error) {
    console.error(" Buy Resource Error:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// 🚮 Delete Resource
export const deleteResource = async (req, res) => {
  try {
    const resourceId = req.params.id;
    const userId = req.user.id;

    const resource = await Resource.findById(resourceId);
    if (!resource) {
      return res.status(404).json({ success: false, message: "Resource not found" });
    }

    if (resource.owner.toString() !== userId) {
      return res.status(403).json({ success: false, message: "Unauthorized action" });
    }

    await resource.deleteOne();

    res.status(200).json({ success: true, message: "Resource deleted successfully" });
  } catch (error) {
    console.error(" Delete Resource Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// 📦 Get All Resources
export const getResources = async (req, res) => {
  try {
    const resources = await Resource.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      message: "Resources fetched successfully",
      resources,
    });
  } catch (err) {
    console.error(" Fetch Resources Error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
