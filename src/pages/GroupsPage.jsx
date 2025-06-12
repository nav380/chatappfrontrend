"use client";

import { useEffect, useState } from "react";
import DjangoConfig from "@/config/config";
import { useRef } from "react";
import "../app/globals.css";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { fetchUsers } from "@/utils/apis/fatchusers";

export default function GroupsPage() {
  const [users, setUsers] = useState([]);
  const [groupData, setGroupData] = useState({
    group_name: "",
    members: [],
    admins: [],
    type: true,
    group_image: null, // State to hold the image file
  });
  const [currentUser, setCurrentUser] = useState("");

  const [isUsersDropdownOpen, setIsUsersDropdownOpen] = useState({
    members: false,
    admins: false
  });
  const [searchQuery, setSearchQuery] = useState({
    members: "",
    admins: ""
  });
  const memberDropdownRef = useRef(null);
  const adminDropdownRef = useRef(null);



  useEffect(() => {
    const storedUser = localStorage.getItem("username");
    setCurrentUser(storedUser);
  
    const getUsers = async () => {
      try {
        const user = await fetchUsers();
        setUsers(user);
        console.log(user);
      } catch (error) {
        console.error("Failed to fetch users:", error);
      }
    };
  
    getUsers();
  }, []);
  


 
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setGroupData((prev) => ({
      ...prev,
      group_image: file, // Update state with the selected file
    }));
  };

  const handleCreateGroup = async () => {
    const groupPayload = {
      ...groupData,
      members: groupData.members.filter(
        (id) => users.find((user) => user.id === id)?.username !== currentUser
      ),
      admins: groupData.admins.filter(
        (id) => users.find((user) => user.id === id)?.username !== currentUser
      ),
    };

    try {
      const formData = new FormData();
      formData.append("group_name", groupData.group_name);
      formData.append("type", groupData.type);
      formData.append("members", JSON.stringify(groupPayload.members));
      formData.append("admins", JSON.stringify(groupPayload.admins));
      if (groupData.group_image) {
        formData.append("group_image", groupData.group_image); // Add image to the form data
      }

      const response = await fetch(`${DjangoConfig.apiUrl}create_group/`, {
        method: "POST",
        headers: { "Accept": "application/json" },
        credentials: "include",
        body: formData, // Send form data with the image
      });

      if (response.ok) {
        setGroupData({ group_name: "", members: [], admins: [], type: true, group_image: null });
      }
    } catch (error) {
      console.error("Error creating group:", error);
    }
  };





  const filteredUsers = (type) => {
    if (type === "members") {
      return users.filter(user =>
        user.username !== currentUser &&
        user.username.toLowerCase().includes(searchQuery[type].toLowerCase())
      );
    } else if (type === "admins") {
      return users.filter(user =>
        groupData.members.includes(user.id) &&  // Ensure the user is a member
        user.username.toLowerCase().includes(searchQuery[type].toLowerCase())
      );
    }
  };

  const handleUserSelection = (user, type) => {
    setGroupData((prev) => ({
      ...prev,
      [type]: prev[type].includes(user.id)
        ? prev[type].filter((id) => id !== user.id)
        : [...prev[type], user.id],
    }));
  };




  const renderUserDropdown = (type) => {
    const isOpen = isUsersDropdownOpen[type];
    const selectedUserIds = groupData[type];

    const dropdownRef = type === 'members' ? memberDropdownRef : adminDropdownRef;


    return (
      <div className="relative" ref={dropdownRef}>
        <div
          className="min-h-[42px] h-[100px] p-2 border rounded-lg bg-white shadow-sm cursor-pointer flex  gap-2 flex-wrap overflow-x-auto"
          onClick={() => setIsUsersDropdownOpen(prev => ({
            ...prev,
            [type]: !prev[type]
          }))}

        >
          <div className="grid grid-cols-4 gap-4 justify-center">
            <div

              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-base h-8 justify-around 
          ${type === 'members' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}relative group`}
            >
              {currentUser}
              <button

                className="opacity-0 group-hover:opacity-100 hover:text-red-500 transition "
              >
                <X size={14} />
              </button>
            </div>


            {selectedUserIds?.map(userId => {
              const user = users.find(u => u.id === userId);
              return (
                <div
                  key={userId}
                  className={`flex items-center gap-1 px-2 py-1 rounded-full text-base h-8 justify-around 
                    ${type === 'members' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}relative group`}
                >
                  {user?.username}
                  <div className="justify-end flex">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUserSelection(user, type);
                      }}
                      className="opacity-0 group-hover:opacity-100 hover:text-red-500 rounded-full transition"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <ChevronDown
            size={20}
            className={`ml-auto text-gray-400 absolute right-6  transition-transform ${isOpen ? "transform rotate-180" : ""}`}
          />
        </div>

        {isOpen && (
          <div className="relative w-full mt-1 bg-white border rounded-lg shadow-lg z-10">
            <div className="p-2 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:border-blue-500"
                  placeholder={`Search ${type}...`}
                  value={searchQuery[type]}
                  onChange={(e) => setSearchQuery(prev => ({
                    ...prev,
                    [type]: e.target.value
                  }))}
                />
              </div>
            </div>

            <ul className="max-h-60 overflow-y-auto">
              {filteredUsers(type).length > 0 ? (
                filteredUsers(type).map(user => (
                  <li
                    key={user.id}
                    className={`
                        flex items-center gap-3 p-2 cursor-pointer 
                        ${selectedUserIds.includes(user.id)
                        ? (type === 'members' ? 'bg-blue-50' : 'bg-green-50')
                        : 'hover:bg-gray-50'}
                      `}
                    onClick={() => handleUserSelection(user, type)}
                  >
                    <div className="flex-grow">
                      <div className="font-medium">{user.username}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                    <div className="flex-shrink-0">
                      {selectedUserIds.includes(user.id) ? (
                        <Check
                          className={type === 'members' ? 'text-blue-500' : 'text-green-500'}
                          size={20}
                        />
                      ) : null}
                    </div>
                  </li>
                ))
              ) : (
                <li className="p-4 text-center text-gray-500">No users found</li>
              )}
            </ul>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-slate-200 h-auto min-h-full top-0 absolute w-full">
      <div className="max-w-2xl mx-auto mt-10 p-6  bg-white rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Create Group</h1>

        {/* Group Name Input */}
        <input
          type="text"
          name="group_name"
          value={groupData.group_name}
          onChange={(e) => setGroupData({ ...groupData, group_name: e.target.value })}
          placeholder="Group Name"
          className="w-full p-3 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {/* Group Image Input */}
        <div className="mb-4">
          <label htmlFor="group_image" className="block text-lg font-semibold text-gray-700 mb-2">Group Image:</label>
          <input
            type="file"
            id="group_image"
            onChange={handleImageChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {groupData.group_image && (
            <div className="mt-4">
              <img
                src={URL.createObjectURL(groupData.group_image)}
                alt="Group Image Preview"
                className="w-32 h-32 object-cover rounded-md"
              />
            </div>
          )}
        </div>


        {/* Member Selection Dropdown */}
        <label className="block text-lg font-semibold text-gray-700 mb-2">Select Members:</label>
        {renderUserDropdown('members')}

        {/* Admin Selection Dropdown */}
        <label className="block text-lg font-semibold text-gray-700 mt-4 mb-2">Select Admins:</label>
        {renderUserDropdown('admins')}



        {/* Admin-Only Message Toggle */}
        <label className="flex items-center mt-4 space-x-3">
          <input
            type="checkbox"
            checked={groupData.type}
            onChange={(e) => setGroupData({ ...groupData, type: e.target.checked })}
            className="w-5 h-5 text-blue-500 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="text-gray-700">Only admins can send messages</span>
        </label>


        {/* Create Group Button */}
        <button
          onClick={handleCreateGroup}
          className="w-full bg-blue-500 text-white py-3 rounded-lg mt-6 font-semibold hover:bg-blue-600 transition-colors"
        >
          Create Group
        </button>
      </div>
    </div>
  );
}