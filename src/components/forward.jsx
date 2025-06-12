"use client";

import DjangoConfig from "@/config/config";
import { Forward, Send, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { sendUserMessage } from "@/store/slices/chatSlice";
import Showpic from "./showpic";

const ForwardMessage = ({ users, toggleforward, message }) => {
    console.log(users);
    const dispatch = useDispatch();
    const [username, setUsername] = useState("");
    const [selectedUsers, setSelectedUsers] = useState([]);

    // Load username from localStorage
    useEffect(() => {
        if (!username) {
            const storedUsername = localStorage.getItem("username");
            setUsername(storedUsername);
        }
    }, []);

    // Setup WebSocket listeners for all users
    useEffect(() => {
        if (!username || !users || users.length === 0) return;

        const sockets = users.map(user => {
            const ws = new WebSocket(`${DjangoConfig.wsUrl}ws/chat/${user.username}/?username=${username}`);

            ws.onopen = () => console.log(`Connected to ${user.username}'s WebSocket`);
            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                dispatch(sendUserMessage(data.message));
            };
            ws.onclose = () => console.log(`Disconnected from ${user.username}'s WebSocket`);

            return { user, socket: ws };
        });

        return () => {
            sockets.forEach(({ socket }) => socket.close());
        };
    }, [users, username]);

    // Toggle user selection for broadcast
    const toggleUserSelection = (userToToggle) => {
        setSelectedUsers((prev) =>
            prev.includes(userToToggle)
                ? prev.filter((u) => u !== userToToggle)
                : [...prev, userToToggle]
        );
    };

    // Send broadcast message
    const sendMessage = () => {
        if (!message || selectedUsers.length === 0 || !username) return;

        selectedUsers.forEach((receiverUsername) => {
            const ws = new WebSocket(`${DjangoConfig.wsUrl}ws/chat/${receiverUsername}/?username=${username}`);

            ws.onopen = () => {
                const messageData = {
                    message: message,
                    sender: username,
                    receiver: receiverUsername,
                };
                ws.send(JSON.stringify(messageData));
                ws.close();
            };
        });

        // Optionally close modal after sending
        toggleforward();
    };

    return (
        <div className="left-0 absolute w-full mx-auto flex flex-col h-screen bg-black/40 z-[99] justify-center backdrop-blur-md transition-opacity duration-300">
            <div className="h-[40vh] md:w-[60vw] w-full mx-auto bg-white rounded-3xl relative p-6">
                <div className="absolute top-0 right-0 hover:text-red-500 p-2 cursor-pointer">
                    <X onClick={toggleforward} size={18} />
                </div>

                <div className="p-4 bg-white z-50">
                    <h2 className="text-lg font-semibold mb-4">Select users to broadcast:</h2>

                    <div className="mb-6 max-h-40 overflow-y-auto border border-gray-200 p-3 rounded-lg">
                        { users && users.map((user) => (
                            <label key={user.username} className="flex items-center gap-2 mb-2">
                                <input
                                    type="checkbox"
                                    value={user.username}
                                    checked={selectedUsers.includes(user.username)}
                                    onChange={() => toggleUserSelection(user.username)}
                                />
                                <Showpic user={user} />
                                <span>{user.username}</span>
                            </label>
                        ))}
                    </div>

                    <div className="flex items-center justify-end">
                        <button
                            onClick={sendMessage}
                            className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 focus:outline-none"
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForwardMessage;
