import Resource from "../models/Resource.js";
import sendMail from "../utils/sendEmail.js";
import User from "../models/User.js";
async function updatePoints(userId, pointsToAdd, reason) {
  try {
    const user = await User.findOneAndUpdate(
      { _id: userId },
      {
        $inc: { points: pointsToAdd }, // Increment points
        $push: { // Add log entry
          logs: {
            pointsAdded: pointsToAdd,
            reason,
            date: new Date(),
          },
        },
      },
      { new: true } // Return the updated document
    );

    console.log('Updated user points:', user);
    return user;
  } catch (error) {
    console.error('Error updating points:', error);
    throw error;
  }
}

export const deleteResource = async (req, res) => {
  try {
    const resourceId = req.params.id;
    const userId = req.user.id;

    const resource = await Resource.findById(resourceId);
    if (!resource) {
      return res.status(404).json({ message: "Resource not found" });
    }

    if (resource.owner.toString() !== userId) {
      return res.status(403).json({ message: "You do not have permission to delete this resource" });
    }

    await resource.deleteOne(); // ✅ Fixed here

    return res.status(200).json({ message: "Resource deleted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
}
//resouce adding
export const addResource = async (req, res) => {
  const { name, category, status, price, images, description, contact } = req.body;

  try {
    const owner = req.user.id;
    const newResource = new Resource({
      name,
      category,
      owner,
      status,
      price,
      images,
      description,
      contact // ✅ Save contact
    });

    const savedResource = await newResource.save();
    const user = await User.findById(owner);
    let points = 0;

    if (price == 0) {
      updatePoints(owner, 500, `500 Points added for the free Resource: ${savedResource.name}`);
      points = 500;
    } else if (price > 0 && price <= 5000) {
      updatePoints(owner, 250, `250 Points added for the Resource: ${savedResource.name}`);
      points = 250;
    } else {
      updatePoints(owner, 50, `50 Points added for the Resource: ${savedResource.name}`);
      points = 50;
    }

    user.points += points;
    await user.save();

    sendMail(user.email, `Resource added successfully. You've earned ${points} points!`);
    res.json({ message: "Resource saved successfully", resource: savedResource });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};


//fetch resources
export const getResources = async (req, res) => {
  try {
    const resources = await Resource.find().sort({ createdAt: -1 });
    res.json({
      message: "Resources fetched successfully",
      resources,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};
