import DjangoConfig from "@/config/config";
import axios from "axios";
import { Image, FileVideo2, File } from "lucide-react";

export const handleUpload = async (event,setOpenFile,setFileUrl,setInputMessage) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    // File Type Check
    const fileType = selectedFile.type.split("/")[0]; // "image", "video", "application", etc.

    // File Size Limits
    const maxSize = fileType === "image" ? 5 * 1024 * 1024 : 50 * 1024 * 1024;


    if (selectedFile.size > maxSize) {
      console.error(`File size must be under ${maxSize / 1024 / 1024}MB`);
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await axios.post(`${DjangoConfig.apiUrl}upload_file/`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });

      if (response.status === 201) {
        setInputMessage(response.data.file_url);
        setFileUrl(response.data.file_url);
      }
    } catch (error) {
      console.error("Upload error:", error);
    }

    setOpenFile(false);
  };




export const uploadOptions = [
  {
    id: "imageInput",
    type: "file",
    label: "Image",
    accept: "image/*",
    icon: <Image className="text-red-400 w-5 h-5" />,
  },
  {
    id: "videoInput",
    type: "file",
    label: "Video",
    accept: "video/*",
    icon: <FileVideo2 className="text-green-400 w-5 h-5" />,
  },
  {
    id: "fileInput",
    type: "file",
    label: "File",
    accept: "*/*",
    icon: <File className="text-gray-400 w-5 h-5" />,
  },
];
