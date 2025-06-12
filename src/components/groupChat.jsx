"use client"
import DjangoConfig from '@/config/config';
import { sendGroupMessage } from '@/store/slices/groupChatSlice'; 
import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from "react-redux";
import Msgtype from './msgtype';
import Showpic from './showpic';

const GroupChat = ({ group }) => {
  if (group === undefined) {
    return null; // or some fallback UI
  }
  const { messages } = useSelector((state) => state.groupChat);
  const [lastmessage, setLastMessage] = useState("");
  const [lastsender, setLastSender] = useState("");
  const dispatch = useDispatch();
  const [username, setUsername] = useState("");
  const [countunread, setCountUnread] = useState(0);
  const wsUrl = `${DjangoConfig.wsUrl}ws/chatgroup/${group.group_name}/?username=${username}`;
  let chatSocket = useRef(null);


  useEffect(() => {
    // Connect WebSocket
    chatSocket.current = new WebSocket(wsUrl);

    chatSocket.current.onopen = () => console.log("WebSocket Connected!");

    chatSocket.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      dispatch(sendGroupMessage(data.message));
      console.log(data.message);

      if (document.hidden) {
        const senderName = data.message.sender.username;
        const messageContent = data.message.content;
        const messageId = data.message.id;
        const chatUrl = `/chat/${senderName}/`;  // 👈 Adjust this to your actual chat route
      
        const showNotification = () => {
          const notification = new Notification(`New Message from ${senderName}`, {
            body: `${senderName}: ${messageContent}`,
            tag: `chat-message-${messageId}`,
            icon: "/logo.jpg", // favicon or any icon
            badge: "/logo.jpg"
          });
      
          notification.onclick = () => {
            // 👇 Open a new tab or bring to focus
            window.open(chatUrl, '_blank');
            notification.close();
          };
      
          // Auto-close after 2 seconds
          setTimeout(() => notification.close(), 2000);
        };
      
        if (Notification.permission === "granted") {
          showNotification();
        } else if (Notification.permission !== "denied") {
          Notification.requestPermission().then(permission => {
            if (permission === "granted") {
              showNotification();
            }
          });
        }
      }
      
    };

    chatSocket.current.onclose = () => console.log("WebSocket Disconnected!");

    return () => {
      chatSocket.current.close();
    };
  }, [wsUrl]);

  useEffect(() => {
    const tempUsername = localStorage.getItem("username") || "";
    setUsername(tempUsername);
  }, []);

  useEffect(() => {
    let count = 0;
    let lastMsg = null;

    messages.forEach((message) => {
      if (message.group_name.id === group.id) {
        lastMsg = message;
        if (message.sender.username !== username && message.user_has_read === false) {
          count += 1;
        }
      }
    });

    if (lastMsg) {
      setLastMessage(lastMsg);
      setLastSender(lastMsg.sender.username);
    }

    setCountUnread(count);
  }, [messages]);





  return (
    <div className="flex items-center gap-3 p-4 border-b border-gray-200 hover:bg-gray-100 cursor-pointer group rounded-2xl">
      {/* Group Icon or Avatar */}
      <div className="relative flex-shrink-0">
        <Showpic user={group} />
      </div>

      {/* Chat Details */}
      <div className="flex-1 min-w-0">

        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {group.group_name}
          </h3>
        </div>
        <div className='flex'>
          <span className="text-green-500 text-lg ml-2">{lastsender}~</span>

          <span className={`dark:text-gray-300 mt-0.5 ml-2 block text-ellipsis overflow-hidden whitespace-nowrap
               ${!lastmessage.user_has_read && lastsender !== username ? "text-lg text-slate-900" : "text-sm text-slate-600"}`}
          >
            <Msgtype msg={lastmessage} />
          </span>
        </div>
      </div>



      {/* Unread Messages Badge */}
      {countunread > 0 && (
        <div className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
          {countunread}
        </div>
      )}
    </div>

  );
}

export default GroupChat;
