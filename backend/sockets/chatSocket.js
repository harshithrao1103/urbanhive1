import Project from "../models/Project.js";
import User from "../models/User.js";
import sendEmail from "../utils/sendEmail.js";

const chatSocket = (io) => {
  io.on("connection", (socket) => {
    console.log("✅ User connected:", socket.id);

    socket.on("joinProject", (projectId) => {
      socket.join(projectId);
      console.log(`🔗 User joined project chat: ${projectId}`);
    });

    socket.on("sendMessage", async ({ projectId, sender_name, sender, text }) => {
      console.log(`📨 Message from ${sender}: ${text}`);
      const message = {
        projectId,
        sender_name,
        sender,
        text,
        timestamp: new Date(),
      };

      try {
        const ChatMessage = (await import("../models/Chat.js")).default;
        const newMessage = new ChatMessage(message);
        await newMessage.save();
        console.log("✅ Message saved to DB:", newMessage);

        io.to(projectId).emit("newMessage", message);

        // ✅ EMAIL NOTIFICATION STARTS HERE

        const project = await Project.findById(projectId).populate("members"); // or 'joinedUsers'
        const senderUser = await User.findById(sender);

        if (project?.members && senderUser) {
          const recipients = project.members.filter(
            (member) => member._id.toString() !== sender
          );

          for (const recipient of recipients) {
            const emailText = `${senderUser.name} sent a new message in "${project.name}":\n\n"${text}"`;

            await sendEmail(
              recipient.email,
              `New message in ${project.name}`,
              emailText
            );
          }
        }

      } catch (error) {
        console.error("❌ Error in sendMessage:", error);
      }
    });

    socket.on("disconnect", () => {
      console.log("❌ User disconnected:", socket.id);
    });
  });
};

export default chatSocket;
