import React, { useEffect, useRef, useState } from 'react';
import { UserPen } from 'lucide-react';
import DjangoConfig from '@/config/config';
import '../app/globals.css';

const Settings = () => {
  const [profilePic, setProfilePic] = useState(null);
  const fileInputRef = useRef(null);

  // Fetch user profile on mount
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await fetch(`${DjangoConfig.apiUrl}get_me`, {
          credentials: 'include',
        });

        if (!response.ok) throw new Error('Failed to fetch user profile');

        const user = await response.json();
        if (user.profile_picture) {
          setProfilePic(`${DjangoConfig.mediaUrl}${user.profile_picture}`);
        } else {
          setProfilePic(null);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        setProfilePic(null);
      }
    };

    fetchUserProfile();
  }, []);

  // Handle image file change
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setProfilePic(previewUrl);
      // 🔁 Optional: call a function to upload this file to your Django backend
      // uploadProfilePicture(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="p-6 max-w-2xl bg-blue-400 min-h-screen h-full mx-auto my-2 rounded-2xl shadow-lg  ">
      

      <div className="relative w-40 h-40 mt-16 mx-auto ">
        {profilePic ? (
          <img
            src={profilePic}
            alt="Profile"
            onClick={triggerFileInput}
            className="w-full h-full object-cover rounded-full border-4 border-green-500"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center rounded-full bg-gray-200 text-gray-500 text-xl cursor-pointer"
            onClick={triggerFileInput}
          >
            <UserPen className="ml-2 w-20 h-20" />
          </div>
        )}

      

        <input
          ref={fileInputRef}
          id="upload-profile"
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="hidden"
        />
      </div>
    </div>
  );
};

export default Settings;
