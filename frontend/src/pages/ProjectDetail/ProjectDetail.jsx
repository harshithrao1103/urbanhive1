// ProjectDetail.jsx
import {
  assignProject,
  getProject,
  requestProject,
  completeProject,
} from "../../components/redux/projectSlice";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, Link } from "react-router-dom";
import Map, { Marker } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { getUser } from "../../components/redux/authSlice";
import { toast } from "sonner";
import socket from "../../utils/socket";

const defaultCenter = { lat: 20.5937, lng: 78.9629 };

function ProjectDetail() {
  const { id: projectId } = useParams();
  const { user } = useSelector((state) => state.auth);
  const { project, isLoading } = useSelector((state) => state.project);
  const dispatch = useDispatch();

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  useEffect(() => {
    dispatch(getProject(projectId));
  }, [dispatch, projectId]);

  useEffect(() => {
    if (!user?._id && user?.id) {
      dispatch(getUser(user.id));
    }
  }, [dispatch, user?.id]);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/chat/${projectId}`
        );
        const data = await response.json();
        setMessages(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("❌ Error fetching messages:", error);
        setMessages([]);
      }
    };

    fetchMessages();
    socket.emit("joinProject", projectId);
    socket.on("newMessage", (message) => {
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      socket.off("newMessage");
    };
  }, [projectId]);

  const handleRequest = async () => {
    try {
      await dispatch(requestProject(project._id));
      toast.success("Project requested successfully");
    } catch (error) {
      toast.error("Failed to request project");
    }
  };

  const handleAssign = (userId) => {
    dispatch(assignProject({ projectId: project._id, userId }))
      .then(() => toast.success("Project assigned successfully"))
      .catch(() => toast.error("Failed to assign project"));
  };

  const sendMessage = () => {
    if (newMessage.trim()) {
      socket.emit("sendMessage", {
        projectId,
        sender_name: user.name,
        sender: user._id,
        text: newMessage,
      });
      setNewMessage("");
    }
  };

  const joinProject = () => {
    console.log("User joining project... (not yet implemented)");
  };

  const handleComplete = async () => {
    try {
      await dispatch(completeProject(project._id));
      toast.success("Project marked as completed");
      dispatch(getProject(project._id));
    } catch (error) {
      toast.error("Failed to mark project as completed");
    }
  };

  if (isLoading || !project || !user?._id) {
    return (
      <h1 className="text-center text-2xl font-bold text-gray-700">
        Loading...
      </h1>
    );
  }

  const latitude = parseFloat(
    project?.location?.coordinates?.lat || defaultCenter.lat
  );
  const longitude = parseFloat(
    project?.location?.coordinates?.lng || defaultCenter.lng
  );

  const isMember = project?.members?.some((memberId) => memberId === user._id);
  const isOwner = user._id === project.createdBy;

  return (
    <div className="flex h-screen p-6 bg-gray-100">
      <div className="w-2/3 bg-white p-6 shadow-md rounded-lg flex flex-col">
        <h2 className="text-4xl font-extrabold text-gray-900 mb-4 flex justify-between items-center">
          {project.title}
          <div className="flex flex-row gap-2">
            <button
              className={`${
                project.status === "completed"
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700"
              } text-white text-lg font-semibold px-6 py-3 rounded-xl shadow-lg transition-all duration-300`}
              disabled={project.status === "completed"}
            >
              <Link to="/donations">Contribute</Link>
            </button>
            {user.role === "gov_official" && project.level === "large" && (
              <button
                onClick={handleRequest}
                className="bg-green-600 hover:bg-green-700 text-white text-lg font-semibold px-6 py-3 rounded-xl shadow-lg transition-all duration-300"
              >
                Request to Assign
              </button>
            )}
            {isOwner && project.status !== "completed" && (
              <button
                onClick={handleComplete}
                className="bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold px-6 py-3 rounded-xl shadow-lg transition-all duration-300"
              >
                Mark as Completed
              </button>
            )}
          </div>
        </h2>

        <p className="text-lg text-gray-700 italic border-l-4 border-emerald-500 pl-4">
          {project.description}
        </p>

        {project.images?.length > 0 ? (
          <img
            src={project.images[0]}
            alt="Project"
            className="mt-6 w-full h-48 object-cover rounded-lg shadow-md"
          />
        ) : (
          <p className="text-gray-500 mt-6">No images available</p>
        )}

        <div className="grid grid-cols-2 gap-6 mt-6 text-lg">
          <div className="bg-gray-100 p-4 rounded-lg shadow">
            <span className="block text-gray-500 text-sm">Funding Goal</span>
            <span className="font-semibold">{project.fundingGoal} USD</span>
          </div>
          <div className="bg-gray-100 p-4 rounded-lg shadow">
            <span className="block text-gray-500 text-sm">Members</span>
            <span className="font-semibold">
              {project.members?.length || "N/A"}
            </span>
          </div>
          <div className="bg-gray-100 p-4 rounded-lg shadow">
            <span className="block text-gray-500 text-sm">Start Date</span>
            <span className="font-semibold">
              {new Date(project.startDate).toLocaleDateString()}
            </span>
          </div>
          <div className="bg-gray-100 p-4 rounded-lg shadow">
            <span className="block text-gray-500 text-sm">End Date</span>
            <span className="font-semibold">
              {new Date(project.endDate).toLocaleDateString()}
            </span>
          </div>
          <div className="col-span-2 bg-gray-100 p-4 rounded-lg shadow text-center">
            <span className="block text-gray-500 text-sm">Category</span>
            <span className="font-semibold capitalize">
              {project.category}
            </span>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-2xl font-bold mb-4">Project Location</h3>
          <Map
            initialViewState={{ longitude, latitude, zoom: 12 }}
            style={{ width: "100%", height: "350px" }}
            mapboxAccessToken="pk.eyJ1Ijoic2lyaWRldm9qdSIsImEiOiJjbHloZGdqYjIwMzVjMmtzYXowNjNzajRtIn0.5_fULxohRjzyjl9cKOL_mQ"
            mapStyle="mapbox://styles/mapbox/streets-v11"
          >
            <Marker longitude={longitude} latitude={latitude} color="red" />
          </Map>
        </div>
      </div>

      <div className="w-1/3 h-fit p-6 bg-gradient-to-r from-emerald-600 to-teal-600 text-white flex flex-col rounded-lg shadow-lg">
        {project.requests &&
          project.requests
            .filter((id) => id !== user._id)
            .map((id) => (
              <div key={id} className="mb-2 p-2 border-b border-gray-300">
                <strong>Request from {id || "Unknown"}:</strong> Requested to
                join.
                {isOwner && (
                  <>
                    <button
                      onClick={() => handleAssign(id)}
                      className="ml-2 bg-green-500 px-4 py-2 rounded-lg"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => toast.info("Declined (not implemented)")}
                      className="ml-2 bg-red-500 px-4 py-2 rounded-lg"
                    >
                      Decline
                    </button>
                  </>
                )}
              </div>
            ))}

        <h2 className="text-2xl font-bold mb-4">
          {isMember ? "Chat" : "Join to chat"}
        </h2>

        {isMember ? (
          <>
            <div className="h-64 overflow-y-auto bg-white text-black p-2 rounded-md shadow-inner">
              {messages.length > 0 ? (
                messages.map((msg, index) => (
                  <div
                    key={index}
                    className="mb-2 p-2 border-b border-gray-300"
                  >
                    <strong>{msg.sender_name || "Unknown"}:</strong>{" "}
                    {msg.text}
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No messages yet</p>
              )}
            </div>

            <div className="mt-4 flex">
              <input
                type="text"
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="w-full p-2 rounded-lg text-gray-800"
              />
              <button
                className="ml-2 bg-green-500 px-4 py-2 rounded-lg"
                onClick={sendMessage}
              >
                Send
              </button>
            </div>
          </>
        ) : (
          <div
            onClick={joinProject}
            className="mt-6 bg-red-300 text-black px-6 py-3 rounded-lg font-semibold shadow-lg transition-all duration-300"
          >
            Join to Chat
          </div>
        )}
      </div>
    </div>
  );
}

export default ProjectDetail;
