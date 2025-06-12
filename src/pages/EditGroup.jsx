"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import DjangoConfig from "@/config/config";
import { useRouter, useSearchParams } from 'next/navigation';
import '../app/globals.css';
import { Check, ChevronDown, Search, X, XCircle } from "lucide-react";
import { useSelector } from "react-redux";

export default function EditGroup() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [Error, setError] = useState(false);
  const [groupimagechnage, setgroupimagechnage] = useState(false)

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

  const [groups, setGroups] = useState([]);
  const [groupData, setGroupData] = useState({
    group_name: "",
    members: [],
    admins: [],
    type: true,
    group_image: null,
  });
  const [currentUser, setCurrentUser] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const storedUser = localStorage.getItem("username");
    setCurrentUser(storedUser);
    handleGetGroup();
    fetchUsers();
  }, [id]);

  // Handle clicks outside dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        (memberDropdownRef.current && !memberDropdownRef.current.contains(event.target)) &&
        (adminDropdownRef.current && !adminDropdownRef.current.contains(event.target))
      ) {
        setIsUsersDropdownOpen({ members: false, admins: false });
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${DjangoConfig.apiUrl}get_users`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
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

  const handleGetGroup = async () => {
    const group_id = id;
    try {
      setIsLoading(true);
      setError(false); // clear previous error

      const response = await fetch(`${DjangoConfig.apiUrl}edit_group/${group_id}`, {
        method: "GET",
        credentials: "include",
      });
      if (!response.ok) {
        setError(true);
        console.error("Error fetching group data:", response);
      }


      const data = await response.json();
      setGroupData({
        group_name: data.group_name,
        members: data.members.filter((a) => a.username !== currentUser).map((m) => m.id),
        admins: data.admins.filter((a) => a.username !== currentUser).map((a) => a.id),
        type: data.type,
        group_image: data.group_image || null,
      });

    } catch (err) {
      setError(true);
    } finally {
      setIsLoading(false);
    }
  };


  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setgroupimagechnage(true);
    setGroupData((prev) => ({
      ...prev,
      group_image: file,
    }));
  };

  const handleUpdateGroup = async () => {
    const group_id = id;
    const formData = new FormData();
    formData.append("group_name", groupData.group_name);
    formData.append("type", groupData.type);
    formData.append("members", JSON.stringify(groupData.members));
    formData.append("admins", JSON.stringify(groupData.admins));

    if (groupData.group_image) {
      formData.append("group_image", groupData.group_image);
    }

    try {
      const response = await fetch(`${DjangoConfig.apiUrl}edit_group/${group_id}/`, {
        method: "POST",
        headers: { "Accept": "application/json" },
        credentials: "include",
        body: formData,
      });

      if (response.ok) {
        setMessage("Group updated successfully!");
        setTimeout(() => router.push(`/`), 2000);
      } else {
        setMessage("Error updating group.");
      }
    } catch (error) {
      console.error("Error updating group:", error);
      setMessage("Error updating group.");
    }
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

          <div className="grid grid-cols-4 gap-4 ">
            <div

              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-base h-8 justify-around 
                  ${type === 'members' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}relative group`}
            >
              {currentUser}
              <button

                className="opacity-0 group-hover:opacity-100 hover:text-red-500 rounded-full transition"
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
            className={`ml-auto text-gray-400 transition-transform absolute right-6 ${isOpen ? "transform rotate-180" : ""}`}
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
    <div>
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        {Error && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30  backdrop-blur-sm">
            <div className="flex items-center bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg">
              <XCircle className="fill-red-500 mr-2 w-6 h-6" />
              <span className="block sm:inline">Error fetching group data.</span>
            </div>
          </div>
        )}


        {isLoading ? (
          <p>Loading...</p>
        ) : (
          <div className="bg-slate-200 h-auto min-h-full top-0 absolute w-full">
            <div className="max-w-2xl mx-auto mt-10 p-6 bg-slate-50 rounded-lg shadow-lg">
              <h1 className="text-3xl font-bold text-gray-800 mb-6">Edit Group</h1>



              {/* Group Name Input */}
              <input
                type="text"
                name="group_name"
                value={groupData.group_name}
                onChange={(e) => setGroupData({ ...groupData, group_name: e.target.value })}
                placeholder="Group Name"
                className="w-full p-3 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              {/* Group Image Upload */}
              <div className="mb-4">
                <label htmlFor="group_image" className="block text-lg font-semibold text-gray-700 mb-2">Group Image:</label>
                <input
                  type="file"
                  id="group_image"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {groupData.group_image && (
                  <div className="mt-4">

                    {groupimagechnage ? <img src={URL.createObjectURL(groupData.group_image)} alt="Group Image Preview"
                      className="w-32 h-32 object-cover rounded-md"
                    />
                      :
                      < img src={`${DjangoConfig.profile_picture_url}${groupData.group_image}`}
                        alt="Group Image Preview"
                        className="w-32 h-32 object-cover rounded-md"
                      />
                    }


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
                onClick={handleUpdateGroup}
                className="w-full bg-blue-500 text-white py-3 rounded-lg mt-6 font-semibold hover:bg-blue-600 transition-colors"
              >
                Edit Group
              </button>

              {message && <p className="mt-4 text-red-500">{message}</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}