// import Resource from "../models/Resource.js";
// import sendMail from "../utils/sendEmail.js";
// import User from "../models/User.js";
// async function updatePoints(userId, pointsToAdd, reason) {
//   try {
//     const user = await User.findOneAndUpdate(
//       { _id: userId },
//       {
//         $inc: { points: pointsToAdd }, // Increment points
//         $push: { // Add log entry
//           logs: {
//             pointsAdded: pointsToAdd,
//             reason,
//             date: new Date(),
//           },
//         },
//       },
//       { new: true } // Return the updated document
//     );

//     console.log('Updated user points:', user);
//     return user;
//   } catch (error) {
//     console.error('Error updating points:', error);
//     throw error;
//   }
// }

// export const deleteResource = async (req, res) => {
//   try {
//     const resourceId = req.params.id;
//     const userId = req.user.id;

//     const resource = await Resource.findById(resourceId);
//     if (!resource) {
//       return res.status(404).json({ message: "Resource not found" });
//     }

//     if (resource.owner.toString() !== userId) {
//       return res.status(403).json({ message: "You do not have permission to delete this resource" });
//     }

//     await resource.deleteOne(); // ✅ Fixed here

//     return res.status(200).json({ message: "Resource deleted successfully" });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ message: "Server error" });
//   }
// }
// //resouce adding
// export const addResource = async (req, res) => {
//   const { name, category, status, price, description, contact, imageBase64 } = req.body;

//   try {
//     const owner = req.user.id;
//     const newResource = new Resource({
//       name,
//       category,
//       status,
//       price,
//       description,
//       contact, // ✅ Save contact
//       images:imageBase64,
//       owner:req.user.id
//     });

//     const savedResource = await newResource.save();
//     const user = await User.findById(owner);
//     let points = 0;

//     if (price == 0) {
//       updatePoints(owner, 500, `500 Points added for the free Resource: ${savedResource.name}`);
//       points = 500;
//     } else if (price > 0 && price <= 5000) {
//       updatePoints(owner, 250, `250 Points added for the Resource: ${savedResource.name}`);
//       points = 250;
//     } else {
//       updatePoints(owner, 50, `50 Points added for the Resource: ${savedResource.name}`);
//       points = 50;
//     }

//     user.points += points;
//     await user.save();

//     sendMail(user.email, `Resource added successfully. You've earned ${points} points!`);
//     res.json({ message: "Resource saved successfully", resource: savedResource });
//   } catch (err) {
//     console.error(err.message);
//     res.status(500).send("Server error");
//   }
// };


// //fetch resources
// export const getResources = async (req, res) => {
//   try {
//     const resources = await Resource.find().sort({ createdAt: -1 });
//     res.json({
//       message: "Resources fetched successfully",
//       resources,
//     });
//   } catch (err) {
//     console.error(err.message);
//     res.status(500).send("Server error");
//   }
// };

import Resource from "../models/Resource.js";
import sendMail from "../utils/sendEmail.js";
import User from "../models/User.js";

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
    console.log("Updated user points:", user);
    return user;
  } catch (error) {
    console.error("Error updating points:", error);
    throw error;
  }
}

// 🚮 Delete Resource
export const deleteResource = async (req, res) => {
  try {
    const resourceId = req.params.id;
    const userId = req.user.id;

    const resource = await Resource.findById(resourceId);
    if (!resource) {
      return res.status(404).json({ message: "Resource not found" });
    }

    if (resource.owner.toString() !== userId) {
      return res
        .status(403)
        .json({ message: "You do not have permission to delete this resource" });
    }

    await resource.deleteOne();

    return res.status(200).json({ message: "Resource deleted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

// ➕ Add Resource
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
      owner: req.user.id,
    });

    const savedResource = await newResource.save();

    let points = 0;
    if (price == 0) {
      await updatePoints(owner, 500, `500 Points added for the free Resource: ${savedResource.name}`);
      points = 500;
    } else if (price > 0 && price <= 5000) {
      await updatePoints(owner, 250, `250 Points added for the Resource: ${savedResource.name}`);
      points = 250;
    } else {
      await updatePoints(owner, 50, `50 Points added for the Resource: ${savedResource.name}`);
      points = 50;
    }

    const user = await User.findById(owner);
    sendMail(user.email, `Resource added successfully. You've earned ${points} points!`);

    res.json({ message: "Resource saved successfully", resource: savedResource });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

// 📦 Get All Resources
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
