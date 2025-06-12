"use client";

import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchGroupChats, fetchUserChats } from "@/store/Thunks/thunks";
import UserChat from "@/components/userChat";
import GroupChat from "@/components/groupChat";
import Chat from "@/components/showchat";
import Groupchatshow from "@/components/Groupchatshow";
import { useRouter } from "next/navigation";
import { Globe, Loader2, LogOut, MessageCircle, Plus, Search, Settings, UsersRound, X } from "lucide-react";
import CountUnread from "@/components/countunread";
import { handleLogout, isAuthenticated } from "@/utils/api";
import BroadCast from "@/components/broadcast";
import Zoom from "@/components/zoom";
import { fetchUsers } from "@/utils/apis/fatchusers";
import { fetchGroups } from "@/utils/apis/fatchgroup";




const Dashboard = () => {
  const [username, setUsername] = useState("");
  const [search, setSearch] = useState("");
  const [filteredUsers, setFilteredUsers] = useState();
  const [filteredGroups, setFilteredGroups] = useState();
  const [searchopen, setSearchopen] = useState(false);
  const [room, setRoom] = useState(null);
  const [chatKind, setChatKind] = useState("user");
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const { messages: groupMessages } = useSelector((state) => state.groupChat);
  const { messages: chatMessages } = useSelector((state) => state.chat);
  const [isChatOpen, setIsChatOpen] = useState(true);
  const dispatch = useDispatch();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("user")
  const [loading, setLoading] = useState(false);
  const [zoom, setZoom] = useState(null);
  const [broadcast, setBroadcast] = useState(false);

  // Fetch chat data from Redux
  useEffect(() => {
    dispatch(fetchUserChats());
    dispatch(fetchGroupChats());
    const user = localStorage.getItem("username");
    setUsername(user);
  }, [dispatch]);


  // Fetch users & groups from the backend
  useEffect(() => {
    checkAuth();

    const breakpoint = 768;

    const updateChatVisibility = () => {
      setIsChatOpen(window.innerWidth >= breakpoint);
    };

    // Initial check
    updateChatVisibility();

    // Resize listener
    window.addEventListener("resize", updateChatVisibility);
    return () => window.removeEventListener("resize", updateChatVisibility);
  }, []);


  const checkAuth = async () => {
    try {
      setLoading(true)
      const auth = await isAuthenticated(); // Await authentication check
      if (auth) {
        const user = await fetchUsers();
        const geoup = await fetchGroups();
        setUsers(user);
        setGroups(geoup);
        setFilteredUsers(user);
        setFilteredGroups(geoup);
      } else {
        router.push("/Login");
      }

    } catch (error) {
      console.log("something went wrong") // Redirect on error
    } finally {
      setLoading(false)
    }
  };

  useEffect(() => {
    if (!chatMessages || chatMessages.length === 0 || !users || users.length === 0) return;

    const userLatestMessage = {};

    chatMessages.forEach((msg) => {
      const receiverId = msg.receiver.id;
      if (!userLatestMessage[receiverId] || msg.timestamp > userLatestMessage[receiverId]) {
        userLatestMessage[receiverId] = msg.timestamp;
      }
    });

    const sortedUsers = [...users].sort((a, b) =>
      new Date(userLatestMessage[b.id] || 0) - new Date(userLatestMessage[a.id] || 0)
    );
    setFilteredUsers(sortedUsers);
  }, [chatMessages, users]);




  useEffect(() => {
    if (!groupMessages || groupMessages.length === 0 && groups) return;

    const groupLatestMessage = {};

    // Store the latest message for each group
    groupMessages.forEach(msg => {
      const groupId = msg.group_name.id;
      if (!groupLatestMessage[groupId] || msg.timestamp > groupLatestMessage[groupId].timestamp) {
        groupLatestMessage[groupId] = msg;
      }
    });

    // Convert object values to array and sort by timestamp
    const sortedGroups = Object.values(groupLatestMessage)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)) // Sort by latest timestamp
      .map(msg => {
        const groupId = msg.group_name.id;

        // Find the full group details from groupsData using the groupId
        const fullGroupDetails = groups.find(group => group.id === groupId);
        return fullGroupDetails; // Return the full group data
      });

    setFilteredGroups(sortedGroups);

  }, [groupMessages, groups]);


  // Fetch Groups


  const handleSearch = (e) => {
    const value = e.target.value.toLowerCase();
    setSearch(value);
    setFilteredUsers(users.filter(user => user.username.toLowerCase().includes(value)));
    setFilteredGroups(groups.filter(group => group.group_name.toLowerCase().includes(value)));
  };

  const notiuserchange = (change) => {   ///change user on notification click
    setRoom(change);
  };

  // Switch User And Groups 



  const handleTabSwitch = (tab) => {
    setActiveTab(tab)
  }
  const zoomToogle = (message) => {
    setZoom(message || null);
  };
  const toggleBroadcast = () => {
    setBroadcast(!broadcast);
  }
  const Logout = async () => {
    try {
      await handleLogout();
      router.push("/Login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    < >
      {loading ? "Loading..." : (
        <div className="bg-gradient-to-l h-[100vh] from-blue-100 to-green-100 justify-center items-center flex ">
          <div className="flex md:h-[98vh] h-[100vh] overflow-hidden w-full md:w-[90vw] mx-auto  rounded-lg shadow-lg  border-4 border-slate-100 bg-amber-600">

            {zoom && <Zoom zoomToogle={zoomToogle} message={zoom} />}
            {/* Sidebar */}
            <div className={`shadow-md z-50 bg-slate-200 text-slate-600 ${isChatOpen ? "hidden md:flex" : "md:flex absolute bottom-0 left-0 w-full h-16 z-51"}`}>

              {/* Sidebar for md+ screens */}
              <div className="w-16 shadow-lg z-10 hidden md:flex flex-col items-center py-8 px-2 justify-between">
                <div className="space-y-8">
                  <button
                    onClick={() => setActiveTab('user')}
                    className={`p-3 rounded-xl transition-all ${activeTab === 'user' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'
                      }`}
                  >
                    <MessageCircle size={24} />
                  </button>

                  <button
                    onClick={() => setActiveTab('group')}
                    className={`p-3 rounded-xl transition-all ${activeTab === 'group' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'
                      }`}
                  >
                    <UsersRound size={24} />
                  </button>

                  <button
                    onClick={toggleBroadcast}
                    className="p-3 rounded-xl transition-all hover:bg-gray-100"
                  >
                    <Globe size={24} />
                  </button>
                </div>

                {/* Logout at bottom */}
                <div>

                  <button
                    className="p-3 rounded-xl transition-all hover:text-red-500"
                    onClick={() => router.push("/Settings")}
                  >
                    <Settings size={24} />
                  </button>


                  <button
                    className="p-3 rounded-xl transition-all hover:text-red-500"
                    onClick={() => Logout()}
                  >
                    <LogOut size={24} />
                  </button>

                </div>
              </div>

              {/* Bottom bar for small screens */}
              <div className="flex md:hidden w-full justify-around items-center h-full">
                <button
                  onClick={() => setActiveTab('user')}
                  className={`p-2 ${activeTab === 'user' ? 'text-blue-600' : 'text-gray-500'}`}
                >
                  <MessageCircle size={24} />
                </button>
                <button
                  onClick={() => setActiveTab('group')}
                  className={`p-2 ${activeTab === 'group' ? 'text-blue-600' : 'text-gray-500'}`}
                >
                  <UsersRound size={24} />
                </button>
                <button onClick={toggleBroadcast} className="p-2 text-gray-500">
                  <Globe size={24} />
                </button>
                <button onClick={() => Logout()} className="p-2 text-red-500">
                  <LogOut size={24} />
                </button>
              </div>
            </div>




            <div className={`w-full relative md:w-[38vw] lg:w-[25vw] xl:w-[20vw] bg-white border-r-2 border-slate-100  z-50 ${isChatOpen ? "hidden sm:block" : "block"}`}>
              <div className="flex justify-center  mt-2">
                <h1
                  className="bg-gradient-to-r from-rose-600 via-yellow-500 to-blue-500 text-transparent bg-clip-text text-3xl font-extrabold cursor-pointer"
                >
                  Navtech
                </h1>

              </div>
              <div className=" flex justify-end">
                {searchopen && (
                  <div className=" bg-white transition-all duration-300 w-full px-2 mx-auto">
                    <input
                      type="text"
                      placeholder="Search..."
                      value={search}
                      onChange={handleSearch}
                      className="w-full px-3 py-2 border border-slate-400 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />

                  </div>
                )}
                {!searchopen ? (
                  <Search size={20} className="cursor-pointer text-blue-500  mr-4" onClick={() => setSearchopen(true)} />
                ) : (
                  <X size={20} className="cursor-pointer text-red-500 mr-4 " onClick={() => setSearchopen(false)} />
                )}

              </div>





              {/* Switch User And Group */}
              <div className="flex justify-center p-2 shadow-lg">
                <div className="w-[50%] relative">
                  <button onClick={() => handleTabSwitch("user")}
                    className={`w-full py-2 rounded-l-lg shadow-lg ${activeTab === "user" ? "bg-green-500 text-white" : "bg-gray-300"}`}
                  >User</button>
                  {
                    activeTab !== "user" && (
                      <CountUnread activeTab={activeTab} />

                    )
                  }


                </div>

                <div className="w-[50%] relative">
                  <button
                    onClick={() => handleTabSwitch("group")}
                    className={`w-full py-2 rounded-r-lg  shadow-lg ${activeTab === "group" ? "bg-green-500 text-white" : "bg-gray-300"}`}
                  >
                    Groups
                  </button>
                  {
                    activeTab !== "group" && (
                      <CountUnread activeTab={activeTab} />

                    )
                  }
                </div>
              </div>

              <div className="overflow-y-auto h-full scrollbar-hide bg-slate-50">

                <div className={`p-2 ${activeTab === "user" ? "" : "hidden"}`}>
                  <h2 className="text-sm font-semibold text-blue-500 py-2  ">Direct Messages</h2>
                  {filteredUsers && filteredUsers.map((user) => (
                    <div key={user.id} onClick={() => { setRoom(user); setChatKind("user"); setIsChatOpen(true); }}
                      className="shadow-md mt-2 bg-white rounded-2xl"
                    >
                      <UserChat user={user} notiuserchange={notiuserchange} />
                    </div>
                  ))}
                </div>

                <div className={`p-2 ${activeTab === "user" ? "hidden" : ""}`}>
                  <h2 className="text-sm font-semibold text-blue-500  py-2  ">Groups</h2>
                  {filteredGroups && filteredGroups.map((group, index) => (
                    <div key={index} onClick={() => { setRoom(group); setChatKind("group"); setIsChatOpen(true); }}
                      className="shadow-md mt-2 bg-white rounded-2xl"
                    >
                      <GroupChat group={group} notiuserchange={notiuserchange} />
                    </div>
                  ))}
                </div>
              </div>




              {/* New Group Button */}
              <button
                className="bottom-18  absolute right-10  w-12 h-12 bg-blue-500 hover:bg-blue-700 rounded-full flex items-center justify-center text-white shadow-lg transition-colors"
                onClick={() => router.push("/GroupsPage")}
              >
                <Plus size={24} />
              </button>
            </div>

            {/* Main Chat Area */}
            <div className={`w-full md:w-[62vw] lg:w-[75vw] xl:w-[80vw] flex border-slate-100 ${isChatOpen ? "block" : "hidden md:block"}`}>
              {room ? (
                chatKind === "user" ? (
                  <Chat room={room} back={() => setIsChatOpen(false)} zoomToogle={zoomToogle} allusers={users} allgroups={groups} />
                ) : chatKind === "group" ? (
                  <Groupchatshow room={room} back={() => setIsChatOpen(false)} zoomToogle={zoomToogle} allusers={users} allgroups={groups} />
                ) : null
              ) : (
                <div className="flex-1 flex items-center justify-center bg-gray-50">
                  <div className="text-center">
                    <MessageCircle size={48} className="mx-auto text-gray-400 mb-4" />
                    <h2 className="text-xl font-semibold text-gray-700">Welcome to IntelliSYNC</h2>
                    <p className="text-gray-500 mt-2">Select a conversation to start chatting</p>
                  </div>
                </div>
              )}


            </div>
            {
              broadcast && (
                <div className="z-[99]">
                  <BroadCast users={users} toggleBroadcast={toggleBroadcast} />
                </div>
              )
            }
          </div>
        </div>
      )}
    </>
  );
};

export default Dashboard;