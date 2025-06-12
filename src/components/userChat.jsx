"use client"
import DjangoConfig from '@/config/config';
import { sendUserMessage } from '@/store/slices/chatSlice'; 
import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from "react-redux";
import Msgtype from './msgtype';
import Showpic from './showpic';



const UserChat = ({ user, notiuserchange }) => {
  const username = localStorage.getItem("username");
  const [roomName, setRoomName] = useState();
  const { messages, loading, error } = useSelector((state) => state.chat);
  const [lastmessage, setLastMessage] = useState();
  const [countunread, setCountUnread] = useState(0);
  const dispatch = useDispatch();
  const [image, setImage] = useState();

  const chatboxRef = useRef(null);
  const wsUrl = `${DjangoConfig.wsUrl}ws/chat/${username}/?username=${roomName}`;
  let chatSocket = useRef(null);

  useEffect(() => {
    setRoomName(user.username);
  }, [user]);

  useEffect(() => {
    // Connect WebSocket
    chatSocket.current = new WebSocket(wsUrl);

    chatSocket.current.onopen = () => console.log("WebSocket Connected!");

    chatSocket.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      dispatch(sendUserMessage(data.message));
      console.log(roomName);

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
    setCountUnread(0); // Reset count before calculation

    let unreadCount = 0;
    let lastMsg = null;

    messages.forEach((message) => {
      if (
        (message.sender.id === user.id && message.receiver.username === username) ||
        (message.receiver.id === user.id && message.sender.username === username)
      ) {
        lastMsg = message;
      }

      if (message.sender.id === user.id && message.receiver.username === username && !message.read) {
        unreadCount += 1;
      }
    });

    setLastMessage(lastMsg);
    setCountUnread(unreadCount); // Update unread count once


  }, [messages]);


  return (


    <div className="flex items-center gap-4 p-4 transition-all border-b border-gray-100 dark:border-gray-800 hover:bg-blue-50 dark:hover:bg-gray-900/50 cursor-pointer group rounded-2xl">
      {/* Group Icon (or Avatar if available) */}
      <div className="relative flex-shrink-0">
        <Showpic user={user} />
      </div>


      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-xl text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {user.username}
          </h3>
        </div>

        {lastmessage ? (
          <div
            className={`dark:text-gray-300  overflow-hidden text-ellipsis whitespace-nowrap
        ${lastmessage.read || lastmessage.sender.username === username ? "text-gray-600 text-sm" : "text-slate-900 text-xl"}
      `}
            style={{ maxWidth: "100%" }} // Ensures truncation works
          >

            <Msgtype msg={lastmessage} />
          </div>
        ) : (
          <p className="dark:text-gray-300 mt-0.5 text-gray-600 text-sm overflow-hidden text-ellipsis whitespace-nowrap">
            No messages yet
          </p>
        )}
      </div>


      {/* Unread Messages Badge */}
      {countunread > 0 && (
        <div className="flex-shrink-0 ml-4">
          <div className="px-2 py-1 min-w-[1.5rem] text-center bg-blue-500 dark:bg-blue-600 text-white text-xs font-medium rounded-full animate-in fade-in duration-200">
            {countunread}
          </div>
        </div>
      )}
    </div>

  );
}

export default UserChat;
