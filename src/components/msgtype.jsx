import useFileTypes from '@/utils/filetype';
import { File, FileCode2, FolderArchive, Headphones, Image, VideoIcon } from 'lucide-react';
import React from 'react';

const Msgtype = ({ msg }) => {


    if (!msg) return null;

    const getFileExtension = (content) => {
        if (!content) return "";
        try {
            const url = new URL(content);
            return url.pathname.split(".").pop().toLowerCase();
        } catch {
            const parts = content.split(".");
            return parts.length > 1 ? parts.pop().toLowerCase() : "";
        }
    };

    const fileTypes = useFileTypes();
    const fileExtension = getFileExtension(msg.content);
    const messageType = Object.keys(fileTypes).find(type => fileTypes[type].includes(fileExtension)) || "text";

    const fileIcons = {
        image: <Image size={24} />,
        video: <VideoIcon size={24} />,
        audio: <Headphones size={24} />,
        document: <File size={24} />,
        archive: <FolderArchive size={24} />,
    };


    const truncateFilename = (filename, maxLength = 20) => {
        if (filename.length <= maxLength) return filename;
        const ext = filename.split(".").pop(); // Get extension
        const name = filename.slice(0, 10); // First 10 chars
        return `${name}....${ext}`;
    };
    const truncateMessage = (filename, maxLength = 20) => {
        if (filename.length <= maxLength) return filename;
        const name = filename.slice(0, 10); // First 10 chars
        return `${name}....`;
    };


    return (
        <div className="break-words rounded-2xl min-h-10 flex items-center ml-2">
            {messageType !== "text" ? (
                <>
                    {fileIcons[messageType] || <FileCode2 size={24} />}
                    <span>{truncateFilename(msg.content.split("/").pop())}</span>
                </>
            ) : (
                <span>{truncateMessage(msg.content)}</span>
            )}
        </div>
    );
};

export default Msgtype;
