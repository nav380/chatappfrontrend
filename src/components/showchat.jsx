"use client"; // Required for Next.js with useState & useEffect

import DjangoConfig from "@/config/config";
import { fatchmoremessages, markMessagesAsRead } from "@/store/Thunks/thunks";
import {  ChevronLeft,  CirclePause, CornerUpRight, File,  FolderArchive, Forward, Image, Mic, Paperclip, Scan, Send, SendHorizontal, SquareArrowRight, Users, X, XCircle } from "lucide-react";
import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { VariableSizeList as List } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";
import axios from "axios";
import Linkify from 'react-linkify';
import FileDownloader from "./download";
import Refmessage from "./refmessage";
import Showpic from "./showpic";
import Msgtype from "./msgtype";
import useFileTypes from "@/utils/filetype";
import { sendUserMessage } from "@/store/slices/chatSlice";
import formatTime, { formatDate } from "@/utils/formatdate";
import FileInput from "./fileinput";
import ForwardMessage from "./forward";
const PAGE_SIZE = 20;


const Chat = ({ room, back, zoomToogle , allusers , allgroups }) => {
  console.log(allusers)
  const [file, setFile] = useState(null);
  const [fileUrl, setFileUrl] = useState("");
  const [openfile, setOpenFile] = useState(false)
  const [ismic, setISMic] = useState(false);
  const dispatch = useDispatch();
  const [username, setUsername] = useState("");
  const { messages, loading } = useSelector((state) => state.chat);
  const [allMessages, setAllMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const chatSocket = useRef(null);
  const listRef = useRef();
  const rowHeights = useRef({}); // Stores dynamic row heights
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isScroll, setScroll] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const mediaRecorderRef = useRef(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [referencedMessage, setReferencedMessage] = useState(null);
  const [highlightedMessage, setHighlightedMessage] = useState(null);
  const [isforward, setIsForward] = useState(false);
  const [Forwardmessage, setForwardMessage] = useState(null);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  let timer = null;

  useEffect(() => {
    if (!listRef.current) return;
  
    if (!isScroll) {
      listRef.current.resetAfterIndex(0, true); // force height recalculation
  
      requestAnimationFrame(() => {
        // wait a frame to let react-window measure heights
        listRef.current?.scrollToItem(allMessages.length - 1, "smart");
      });
    } else {
      listRef.current.resetAfterIndex(0, true); // if scrollable, just reset
    }
  }, [allMessages.length]);
  
  



  useEffect(() => {
    if (allMessages.length > 0) {
      const unreadMessages = allMessages.filter(
        (message) => !message.read && message.sender.username === room.username
      );

      if (unreadMessages.length > 0) {
        dispatch(markMessagesAsRead(room.username));
      }
    }
  }, [allMessages, room]);

  useEffect(() => {
    setHasMore(true);
    if (!username) {
      const storedUsername = localStorage.getItem("username");
      setUsername(storedUsername);
    }
    setPage(1)
  }, [room]);

  useEffect(() => {
    const wsUrl = `${DjangoConfig.wsUrl}ws/chat/${room.username}/?username=${username}`;
    chatSocket.current = new WebSocket(wsUrl);
    chatSocket.current.onopen = () => console.log("WebSocket Connected!");
    chatSocket.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      dispatch(sendUserMessage(data.message));
    };
    chatSocket.current.onclose = () => console.log("WebSocket Disconnected!");

    return () => chatSocket.current.close();
  }, [room, username]);

  useEffect(() => {
    if (room && messages.length > 0) {
      const filteredMessages = messages.filter(
        (msg) =>
          (msg.sender.id === room.id && msg.receiver.username === username) ||
          (msg.receiver.id === room.id && msg.sender.username === username)
      );
      setAllMessages(filteredMessages);
    }
  }, [room, messages]);

  useEffect(() => {
    if (page && hasMore) {
      dispatch(fatchmoremessages({ id: room.id, page })).then((res) => {
        if (res.payload.length < 20) {
          setHasMore(false);
        }
      });
    }
  }, [page]);

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
    if (!inputMessage.trim()) return alert("Type a message first!");

    const messageData = {
      message: inputMessage,
      username: username,
      room_name: room.username,
      reference: referencedMessage?.id,
    };
    chatSocket.current.send(JSON.stringify(messageData));
    setInputMessage("");
    setReferencedMessage(null);
  };



  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorderRef.current = new MediaRecorder(stream);
    mediaRecorderRef.current.start();

    const audioChunks = [];
    mediaRecorderRef.current.ondataavailable = (event) => {
      audioChunks.push(event.data);
    };

    mediaRecorderRef.current.onstop = () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
      setAudioBlob(audioBlob);
    };

    setIsRecording(true);
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

  const Forward = (msg) => {
    console.log("Forwarding message:", msg);
  }




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

  const toggleforward=() => {
    setIsForward(!isforward);
  }


  // Function to get dynamic row height
  const getRowHeight = (index) => rowHeights.current[index] || 80;



  const Row = useCallback(({ index, style }) => {
    const msg = allMessages[index];
    if (!msg) return null;

    const showDate =
      index === 0 ||
      new Date(msg.timestamp).toDateString() !== new Date(allMessages[index - 1]?.timestamp).toDateString();

    const getFileExtension = (content) => {
      try {
        if (content.startsWith("http")) {
          return new URL(content).pathname.split(".").pop().toLowerCase();
        }
      } catch {
        return "";
      }
      const parts = content.split(".");
      return parts.length > 1 ? parts.pop().toLowerCase() : "";
    };

    const fileExtension = getFileExtension(msg.content);

    const fileTypes = useFileTypes();


    const messageType = Object.keys(fileTypes).find(type => fileTypes[type].includes(fileExtension)) || "text";

    return (
      <div
        className="scrollbar-hide"
        style={{ ...style, height: "auto", padding: "5px 10px" }}
        ref={(el) => {
          if (el) {
            const height = el.getBoundingClientRect().height;
            if (rowHeights.current[index] !== height) {
              rowHeights.current[index] = height;
              listRef.current?.resetAfterIndex(index, true);
            }
          }
        }}
      >
        {showDate && (
          <div className="text-center text-gray-600 text-sm my-2 font-semibold  ">{formatDate(msg.timestamp)}</div>
        )}

        <div className={`flex group p-1
         ${msg.sender.username === username ? "flex-row-reverse items-start" : "flex items-end"} 
         ${highlightedMessage === msg.id ? "bg-green-200" : ""}
         transition-all duration-300`}>
          <div
            className={`max-w-[70%] break-words rounded-2xl px-4 pt-4 pb-2 min-h-[50px] shadow-md
              ${msg.sender.username === username ? "ml-2 bg-[#03c750] shadow-green-400/50 text-white rounded-br-none" : "bg-white text-gray-800 rounded-bl-none"}`}
          >

            {msg.ref && (
              <div className="p-2rounded-md text-sm mb-1" onClick={() => { scrollToMessage(msg.ref) }}>
                <span ><Refmessage msg={msg} /></span>
              </div>
            )}
            {messageType === "image" && (
              <div className="relative">
                {console.log(DjangoConfig.profile_picture_url,msg.content)}
                <Scan size={24} className="group-hover:flex hover:text-blue-500 text-slate-500 hidden absolute right-2 top-2" onClick={() => { zoomToogle(msg) }} />
                <img src={`${DjangoConfig.profile_picture_url}${msg.content}`} alt="Uploaded file"
                  className="w-80 h-80 rounded-lg"
                />

              </div>
            )}
            {messageType === "video" && (
              <div className="w-auto h-auto  max-w-80 max-h-80 rounded-lg overflow-hidden">
                <video controls preload="none">
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
              <a href={`${DjangoConfig.profile_picture_url}${msg.content}`} download className="text-white flex items-center">
                <File />
                <FileDownloader msg={msg} />
              </a>
            )}
            {messageType === "archive" && (

              <a href={`${DjangoConfig.profile_picture_url}${msg.content}`} download className="text-whit  flex items-center">
                <FolderArchive />
                <FileDownloader msg={msg} />
              </a>
            )}
            {messageType === "text" && (
              <Linkify
                componentDecorator={(href, text, key) => (
                  <a href={href} key={key} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
                    {text}
                  </a>
                )}
              >
                {msg.content}
              </Linkify>
            )}


            <span
              className={`text-[10px] block text-right ml-8 ${msg.sender.username === username ? "text-blue-100" : "text-gray-400"}`}
            >
              {formatTime(msg.timestamp)}
            </span>
          </div>
          <div className="flex flex-col items-center ml-2">
            <button
              className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-blue-500"
              title="formward"
              onClick={() => {setForwardMessage(msg.content);setIsForward(true)}}
            >
              <CornerUpRight size={24} />
            </button>
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
    );
  }, [allMessages, rowHeights, listRef, username, DjangoConfig, highlightedMessage]);



  return (
    <div className="w-full mx-auto flex flex-col md:h-[98vh] h-[100vh] bg-gradient-to-r from-blue-500 to-green-500 relative">
      {/* Forward Modal */}
      {isforward && <ForwardMessage  users={allusers} toggleforward={toggleforward} message={Forwardmessage} /> }
      {/* Chat Header */}
      <div className="md:px-6 py-3 shadow-md  border-b border-slate-200 z-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center ">
            <ChevronLeft onClick={back} className="text-white  md:hidden" />
            <div className="relative">
              <Showpic user={room} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white pl-2">{room.username}</h2>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-hidden scrollbar-hide px-4 py-2 bg-gradient-to-r from-blue-100 to-green-100  ">
        <AutoSizer>
          {({ height, width }) => (
            <List
              height={height}
              width={width}
              itemCount={allMessages.length}
              itemSize={getRowHeight}
              ref={listRef}
              onItemsRendered={handleItemsRendered}
            >
              {Row}
            </List>
          )}
        </AutoSizer>
      </div>

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

      <div className="p-4 bg-white   z-50">
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
        <div className="flex items-center gap-2 max-w-4xl  mx-auto relative ">


          <Paperclip onClick={() => setOpenFile(!openfile)} className="text-slate-400 hover:text-slate-600" />
          <Mic onClick={() => setISMic(!ismic)} className="text-slate-400 hover:text-slate-600" />
          <div className=" w-full">



            <input
              type="text"
              className="flex-1 px-4 py-2  w-full border border-gray-200 rounded-full bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 "
              placeholder="Type a message..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />
          </div>
          <button
            onClick={sendMessage}
            className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 focus:outline-none ml-1"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
