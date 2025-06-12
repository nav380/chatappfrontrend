"use client"; // Required for Next.js with useState & useEffect

import DjangoConfig from "@/config/config";
import { CirclePause, Mic, Paperclip, Send, SendHorizontal, X, } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import Msgtype from "./msgtype";
import { sendUserMessage } from "@/store/slices/chatSlice";
import FileInput from "./fileinput";
import MicRecorder from 'mic-recorder-to-mp3';



const BroadCast = ({ users, toggleBroadcast }) => {
  const [allMessages, setAllMessages] = useState([])
  const [file, setFile] = useState(null);
  const [fileUrl, setFileUrl] = useState("");
  const [openfile, setOpenFile] = useState(false)
  const [ismic, setISMic] = useState(false);
  const dispatch = useDispatch();
  const [username, setUsername] = useState("");
  const [inputMessage, setInputMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const mediaRecorderRef = useRef(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [referencedMessage, setReferencedMessage] = useState(null);
  let timer = null;






  useEffect(() => {
    if (!username) {
      const storedUsername = localStorage.getItem("username");
      setUsername(storedUsername);
    }
  }, []);

  useEffect(() => {
    if (!username || !users || users.length === 0) return;

    // Open a WebSocket connection for each user
    const sockets = users.map(user => {
      const ws = new WebSocket(`${DjangoConfig.wsUrl}ws/chat/${user.username}/?username=${username}`);

      ws.onopen = () => console.log(`Connected to ${user}'s WebSocket`);
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        dispatch(sendUserMessage(data.message));
      };
      ws.onclose = () => console.log(`Disconnected from ${user}'s WebSocket`);

      return { user, socket: ws };
    });

    return () => {
      // Close all WebSocket connections on unmount
      sockets.forEach(({ socket }) => socket.close());
    };
  }, [users, username]);







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


 





  const sendMessage = () => {
    if (!inputMessage.trim()) return alert("Type a message first!");
    setAllMessages((prev) => {
      return [...prev,
      { content: inputMessage }
      ]
    })

    users.forEach((user) => {
      const ws = new WebSocket(`${DjangoConfig.wsUrl}ws/chat/${user.username}/?username=${username}`);

      ws.onopen = () => {
        const messageData = {
          message: inputMessage,
          sender: username, // Sender's username
          receiver: user.username,   // Send to each user
        };
        ws.send(JSON.stringify(messageData));
        ws.close(); // Close connection after sending
      };
    });

    setInputMessage("");
    setReferencedMessage(null);
  };





  const startRecording = async () => {
    try {
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('getUserMedia is not supported in this browser or context.');
        return;
      }
  
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
  
      const audioChunks = [];
      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };
  
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
      };
  
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Error starting recording:', err);
      alert('Failed to start recording: ' + err.message);
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





  return (
    <div className="left-0 absolute w-full mx-auto flex flex-col h-screen bg-black/40 z-[99] justify-center backdrop-blur-md transition-opacity duration-300 ">



      <div className="h-[40vh] md:w-[60vw]  w-full mx-auto bg-white rounded-3xl relative p-6">
        <div className="absolute top-0 right-0 hover:text-red-500 p-2">
          <X onClick={toggleBroadcast} size={18} />
        </div>
        <div className="h-[80%] border-2 rounded-2xl bg-slate-200 border-slate-400  overflow-auto  " >
          {allMessages?.map((message, index) =>
            <div key={index} className={`flex items-center space-x-2 justify-end pt-2 px-4`}>
              <div className={`max-w-[70%] min-w-18 bg-blue-500 rounded-bl-xl rounded-t-xl px-4 py-2 shadow-md shadow-slate-600 mt-1`}>
                <Msgtype msg={message} className="text-sm text-white" />
              </div>
            </div>
          )
          }
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
          <div className="flex items-center gap-2 max-w-4xl  mx-auto relative">


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
    </div>
  );
};

export default BroadCast;
