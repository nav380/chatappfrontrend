"use client";

import DjangoConfig from "@/config/config";
import { deletegroupmessages, fatchmoregroupmessages, markGroupMessageRead } from "@/store/Thunks/thunks";
import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import {  ChevronLeft,  CirclePause, CornerUpRight, Edit,  Mic, Paperclip, Scan, Send, SendHorizontal, SquareArrowRight, Users, X } from "lucide-react";
import AutoSizer from "react-virtualized-auto-sizer";
import { VariableSizeList as List } from "react-window";
import Linkify from 'react-linkify';
import axios from "axios";
import FileDownloader from "./download";
import Refmessage from "./refmessage";
import Showpic from "./showpic";
import Msgtype from "./msgtype";
import useFileTypes from "@/utils/filetype";
import formatTime, { formatDate } from "@/utils/formatdate";
import FileInput from "./fileinput";

const Groupchatshow = ({ room, back, zoomToogle, allusers , allgroups}) => {
  const [file, setFile] = useState(null);
  const [openfile, setOpenFile] = useState(false);
  const [referencedMessage, setReferencedMessage] = useState(null);
  const [fileUrl, setFileUrl] = useState("");
  const username = typeof window !== "undefined" ? localStorage.getItem("username") : null;
  const [inputMessage, setInputMessage] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const dispatch = useDispatch();
  const router = useRouter();
  const listRef = useRef(null);
  const rowHeights = useRef({});
  const chatSocket = useRef(null);
  const wsUrl = `${DjangoConfig.wsUrl}ws/chatgroup/${room.group_name}/?username=${username}`;
  const { messages, loading } = useSelector((state) => state.groupChat);
  const [allMessages, setAllMessages] = useState([])
  const isAdmin = room?.admins?.some((admin) => admin.username === username);
  const [hasNewMessages, setHasNewMessages] = useState(true);
  const [isScroll, setScroll] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const mediaRecorderRef = useRef(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [ismic, setISMic] = useState(false);
  let timer = null;
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedMessage, setHighlightedMessage] = useState(null);
  const [zoom, setZoom] = useState(false);




  useEffect(() => {
    if (page && hasMore) {
      dispatch(fatchmoregroupmessages({ group_id: room.id, page })).then((res) => {
        if (res.payload.length < 20) {
          setHasMore(false);
        }
      });
    }
  }, [page]);

  useEffect(() => {
    if (messages) {
      const temp = messages.filter((msg) => msg.group_name.id === room.id)
      setAllMessages(temp)

    }

  }, [messages, room])


  useEffect(() => {
    if (!isScroll) {
      listRef.current?.scrollToItem(allMessages.length - 1, "smart");
    } else {
      // Maintain the current scroll position when fetching older messages
      listRef.current?.resetAfterIndex(0);
    }
    if (allMessages.some(msg => !msg.user_has_read && msg.sender.username != username && msg.group_name.id === room.id)) {
      dispatch(markGroupMessageRead(room.id));
    }
  }, [allMessages]);

  useEffect(() => {
    setPage(1)
    setHasMore(true);
    chatSocket.current = new WebSocket(wsUrl);
    chatSocket.current.onopen = () => console.log("WebSocket Connected!");
    chatSocket.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setHasNewMessages(true);
    };
    chatSocket.current.onclose = () => console.log("WebSocket Disconnected!");
    listRef.current?.scrollToItem(allMessages.length - 1, "smart");
    return () => chatSocket.current.close();

  }, [room]);

  useEffect(() => {
    if (fileUrl) {
      // Once the fileUrl is set, send the message
      setInputMessage(fileUrl);
      sendMessage();
      setFile(null);
    }
  }, [fileUrl]);

  useEffect(() => {
    if (isRecording) {
      timer = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (timer) clearInterval(timer);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isRecording]);

  const getRowHeight = (index) => rowHeights.current[index] || 80;


  const handleItemsRendered = ({ visibleStartIndex, visibleStopIndex }) => {
    if (visibleStartIndex === 0 && !loading) {
      setScroll(true);  // User scrolled up, enable manual scroll control
      setPage((prevPage) => prevPage + 1);
    }

    // Detect when user scrolls to the bottom
    if (visibleStopIndex === allMessages.length - 1) {
      setScroll(false); // Reset scroll behavior to auto-scroll on new messages
    }
  };

  const sendMessage = () => {
    if (!inputMessage.trim()) return;
    chatSocket.current.send(
      JSON.stringify({
        message: inputMessage,
        username,
        room_name: room.group_name,
        reference: referencedMessage ? referencedMessage.id : null,
      })
    );
    setInputMessage("");
    setReferencedMessage(null);
  };

  const startRecording = async () => {
    if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      alert("Your browser does not support audio recording.");
      return;
    }
  
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.start();
  
      const audioChunks = [];
      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };
  
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
        setAudioBlob(audioBlob);
      };
  
      setIsRecording(true);
    } catch (err) {
      console.error("Recording failed:", err);
      alert("Could not start recording. Please allow microphone access.");
    }
  };
  

  const stopRecording = () => {
    mediaRecorderRef.current.stop();
    setIsRecording(false);
  };




  const sendAudioToBackend = async () => {
    setRecordingTime(0);
    if (!audioBlob) return;

    const formData = new FormData();
    formData.append('file', audioBlob, 'recording.mp3');

    try {
      const response = await axios.post(
        `${DjangoConfig.apiUrl}upload_file/`,
        formData,
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (response.status === 201) {
        setInputMessage(response.data.file_url);
        setFileUrl(response.data.file_url);
      }
    } catch (error) {
      console.error('Error uploading file', error);
    }

    setAudioBlob(null);
    setISMic(false);
  };

  const audioclose = async () => {
    setRecordingTime(0);
    setAudioBlob(null);
    setISMic(false);
  };


  // Detect @username
  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputMessage(value);

    const words = value.split(" ");
    const lastWord = words[words.length - 1];

    if (lastWord.startsWith("@")) {
      const search = lastWord.slice(1).toLowerCase();
      const filteredUsers = room.members;
      setSuggestions(filteredUsers);
      setShowSuggestions(filteredUsers.length > 0);
    } else {
      setShowSuggestions(false);
    }
  };

  // Insert mention when clicked
  const handleMentionClick = (username) => {
    const words = inputMessage.split(" ");
    words[words.length - 1] = `@${username} `; // Replace last word with mention
    setInputMessage(words.join(" "));
    setShowSuggestions(false);
  };


  const scrollToMessage = (messageId) => {
    const messageIndex = allMessages.findIndex((msg) => msg.id === messageId);

    if (messageIndex !== -1 && listRef.current) {
      listRef.current.scrollToItem(messageIndex, "smart");

      // Ensure the state updates immediately
      setHighlightedMessage((prev) => {
        console.log("Highlighting message:", messageId);  // Log the correct ID
        return messageId;
      });

      setTimeout(() => {
        setHighlightedMessage((prev) => {
          console.log("Removing highlight:", prev); // Logs before resetting
          return null;
        });
      }, 3000); // Remove highlight after 5 seconds
    }
  };



  const Row = useCallback(({ index, style }) => {
    const msg = allMessages[index];
    const isCurrentUser = useMemo(() => msg.sender.username === username, [msg.sender.username, username]);
    const showDate = useMemo(() => {
      return index === 0 || new Date(msg.timestamp).toDateString() !== new Date(allMessages[index - 1]?.timestamp).toDateString();
    }, [index, msg.timestamp, allMessages]);
    const fileExtension = useMemo(() => {
      try {
        if (msg.content.startsWith("http")) {
          const urlObj = new URL(msg.content);
          return urlObj.pathname.split(".").pop().toLowerCase();
        }
      } catch {
        return "";
      }
      return msg.content.split(".").pop().toLowerCase();
    }, [msg.content]);




    const fileTypes = useFileTypes();

    const messageType = Object.keys(fileTypes).find(type => fileTypes[type].includes(fileExtension)) || "text";

    return (
      <div style={{ ...style, height: "auto", paddingBottom: "5px" }}
        ref={(el) => {
          if (el) {
            const height = el.getBoundingClientRect().height;
            if (rowHeights.current[index] !== height) {
              rowHeights.current[index] = height;
              listRef.current?.resetAfterIndex(index, true);
            }
          }
        }}
        key={msg.id}>
        {showDate && (
          <div className="text-center text-gray-600 text-sm my-2 font-semibold">
            {formatDate(msg.timestamp)}
          </div>
        )}
        <div className={`flex ${isCurrentUser ? "justify-end" : "justify-start"} animate-fade-in   ${highlightedMessage === msg.id ? "bg-green-200" : ""}`}>
          <div className={`flex ${isCurrentUser ? "flex-row-reverse" : "flex-row"} items-start gap-3 group`}>
            {!isCurrentUser && (
              <div className="flex-shrink-0">
                <Showpic user={msg.sender} />
              </div>
            )}



            <div className="flex-1 min-w-0">
              <div className={`flex items-start gap-2 ${isCurrentUser ? "flex-row-reverse" : ""}
              `}>
                {/* Message Bubble */}
                <div
                  className={`relative max-w-[70%] break-words rounded-2xl px-4 pt-4 pb-2 min-h-[50px] shadow-md 
                 ${isCurrentUser ? "bg-[#03c750] shadow-green-400/50 text-white rounded-br-none mr-4" : "bg-white border border-gray-100 text-gray-800 rounded-bl-none"} `}
                >
                  {!isCurrentUser && (
                    <div className="font-medium text-sm text-green-500 mb-1">
                      {msg.sender.username}
                    </div>
                  )}

                  {msg.ref && (
                    <div className="rounded-md" onClick={() => { scrollToMessage(msg.ref) }}>
                      <span ><Refmessage msg={msg} /></span>
                    </div>
                  )}

                  {/* Render message based on type */}
                  {messageType === "image" && (
                    <div className="relative">
                      <Scan size={24} className="group-hover:flex hover:text-blue-500 text-slate-500 hidden absolute right-2 top-2" onClick={() => { zoomToogle(msg) }} />
                      <img src={`${DjangoConfig.profile_picture_url}${msg.content}`} alt="Uploaded file"
                        className="w-80 h-80 rounded-lg"
                      />

                    </div>
                  )}
                  {messageType === "video" && (
                    <div className="w-80 h-auto rounded-lg overflow-hidden">
                      <video controls>
                        <source src={`${DjangoConfig.profile_picture_url}${msg.content}`} type={`video/${fileExtension}`} />
                      </video>
                    </div>
                  )}
                  {messageType === "audio" && (
                    <audio controls className="w-40">
                      <source src={`${DjangoConfig.profile_picture_url}${msg.content}`} type={`audio/${fileExtension}`} />
                    </audio>
                  )}
                  {messageType === "document" && (
                    <a href={`${DjangoConfig.profile_picture_url}${msg.content}`} download className="text-white underline flex items-center">
                      <FileDownloader msg={msg} />
                    </a>
                  )}
                  {messageType === "archive" && (
                    <a href={`${DjangoConfig.profile_picture_url}${msg.content}`} download className="text-red-500 underline flex items-center">
                      <FileDownloader msg={msg} />
                    </a>
                  )}
                  {messageType === "text" && (
                    <Linkify 
                      componentDecorator={(href, text, key) => (
                        <a
                          href={href}
                          key={key}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 underline "
                        >
                          {text}
                        </a>
                      )}
                    >
                      {msg.content.split(/(@\w+)/g).map((part, idx) => {
                        if (part.startsWith("@")) {
                          return (
                            <span key={idx} className="text-blue-500 font-semibold ">
                              {part}
                            </span>
                          );
                        }
                        return part;
                      })}
                    </Linkify>
                  )}


                  <div className="mt-1 flex justify-end">
                    <span className={`${isCurrentUser ? "text-blue-100" : "text-gray-400 "} text-[10px] block text-right ml-8`}>
                      {formatTime(msg.timestamp)}
                    </span>
                  </div>
                </div>

                {/* Delete Button (Visible for Admins) */}
                <div className="flex flex-col gap-1 ml-2">
                  {isAdmin && (
                    <button
                      className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-red-500"
                      title="Delete message"
                      onClick={() => dispatch(deletegroupmessages({ id: msg.id }))}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-blue-500"
                    title="Reply"
                    onClick={() => setReferencedMessage(msg)}
                  >
                    <SquareArrowRight size={24} />
                  </button>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }, [allMessages, rowHeights, listRef, username, DjangoConfig, highlightedMessage, zoom]);


  return (
    <div className=" w-full mx-auto flex flex-col h-[100vh] md:h-[98vh] bg-gradient-to-r from-blue-500 to-green-500 relative">



      {/* Chat Header */}
      <div className="px-6 py-3 shadow-md border-b border-slate-200 z-50 ">
        <div className="flex items-center justify-between ">
          <div className="flex items-center space-x-4">
            <ChevronLeft onClick={back} className="text-white  md:hidden" />
            <div className="relative">
              <Showpic user={room} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">{room.group_name}</h2>
              <div className="flex items-center text-slate-300 text-sm">
                <Users className="w-4 h-4 mr-1 text-slate-300" />
                <span>{room.members.length} members</span>
              </div>
            </div>
          </div>

          {isAdmin ? (
            <button
              onClick={() => router.push(`/EditGroup?id=${room.id}`)}
              className="px-4 py-2  rounded-full transition-all duration-200 flex items-center gap-2 text-white  hover:text-blue-600"
            >
              <Edit size={24} />
            </button>)
            : null
          }
        </div>
      </div>

      {/* Chat Messages Virtualized List */}
      <div className="flex-1 overflow-hidden scrollbar-hide px-4 py-2 bg-gradient-to-r from-blue-100 to-green-100  ">
        <AutoSizer>
          {({ height, width }) => (
            <List
              ref={listRef}
              height={height}
              itemCount={allMessages.length}
              itemSize={getRowHeight}
              width={width}
              onItemsRendered={handleItemsRendered}
            >
              {({ index, style }) => <Row index={index} style={style} />}
            </List>
          )}
        </AutoSizer>
      </div>

      {/* Chat Input */}

      {
        openfile && (
          <FileInput setFileUrl={setFileUrl} setInputMessage={setInputMessage} setOpenFile={setOpenFile} />
        )

      }
      {
        ismic && (
          <div className="absolute h-full w-full z-50  bg-black/50   ">
            <div className="p-4 absolute rounded-lg shadow-md max-w-sm bg-white top-[40vh] left-[30vw]  w-[20vw]">
              <X size={24} className=" absolute top-4 right-4 text-red-500" onClick={audioclose} />
              <label
                htmlFor="audioInput"
                className="text-sm text-gray-600 cursor-pointer flex items-center space-x-2"
              >
              </label>

              <div className="mt-4 flex flex-col items-center space-y-2">
                <p className="text-lg font-semibold">{recordingTime}s</p>
                <div className="flex space-x-2">
                  <button
                    onClick={startRecording}
                    disabled={isRecording}
                    className="px-3 py-1 rounded bg-green-500 text-white disabled:bg-gray-400"
                  >
                    <Mic className="text-red-500 w-5 h-5" />
                  </button>
                  <button
                    onClick={stopRecording}
                    disabled={!isRecording}
                    className="px-3 py-1 rounded bg-red-500 text-white disabled:bg-gray-400"
                  >
                    <CirclePause />
                  </button>
                  <button
                    onClick={sendAudioToBackend}
                    disabled={!audioBlob}
                    className="px-3 py-1 rounded bg-purple-500 text-white disabled:bg-gray-400"
                  >
                    <SendHorizontal />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }

      <div className="p-4 bg-white z-[50]">
        {
          referencedMessage && (
            <div className="flex items-start gap-2 w-full bg-gray-100 rounded-md px-2 py-1 border-l-4 border-green-500 mb-2 relative">
              <div className="flex-1 overflow-hidden">
                <Msgtype msg={referencedMessage} className="text-sm text-gray-700 truncate" />
              </div>
              <X
                size={14}
                className="text-gray-500 hover:text-red-500 cursor-pointer"
                onClick={() => setReferencedMessage(null)}
              />
            </div>
          )
        }

        {(room.type || isAdmin) && (

          <div className="flex items-center gap-2 max-w-4xl mx-auto relative">

            {showSuggestions && (
              <ul className="absolute left-0 -top-48 h-42 w-full bg-slate-200 rounder-lg p-2 rounded-2xl overflow-y-auto scrollbar-hide">
                {suggestions.map((user) => (
                  <li
                    key={user.id}
                    onClick={() => handleMentionClick(user.username)}
                    className="group px-4 py-2.5 cursor-pointer transition-all duration-200 hover:bg-indigo-500 rounded-lg flex items-center gap-3"
                  >
                    <div className="relative ">
                      <Showpic user={user} />
                    </div>
                    <div className="flex flex-col">

                      <span className="text-md font-bold text-gray-700 group-hover:text-white/80">
                        @{user.username}
                      </span>
                    </div>
                  </li>

                ))}
              </ul>
            )}
            <Paperclip onClick={() => setOpenFile(!openfile)} className="text-slate-400 hover:text-slate-600" />
            <Mic onClick={() => setISMic(!ismic)} className="text-slate-400 hover:text-slate-600" />



            <div className="relative flex items-center w-full  bg-white ">
              <div className="w-full">

                <input
                  type="text"
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-full bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                  placeholder="Type a message..."
                  value={inputMessage}
                  onChange={handleInputChange}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage(inputMessage)}
                />



              </div>

              <button
                onClick={() => sendMessage(inputMessage)}
                className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 focus:outline-none ml-1"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Groupchatshow;
