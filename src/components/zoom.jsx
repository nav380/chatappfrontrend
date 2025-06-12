import DjangoConfig from '@/config/config';
import { Download, X } from 'lucide-react';
import React from 'react';



const Zoom = ({ zoomToogle, message }) => {
    const downloadFile = (url) => {
        const link = document.createElement('a');
        link.href = `${DjangoConfig.profile_picture_url}${url}`;
        link.download = url.split('/').pop(); // Extract filename from URL
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    return (
        <div className="absolute inset-0 w-[100vw] h-[100vh] bg-black/20 flex items-center justify-center z-[9999] backdrop-blur-md transition-opacity duration-300">       <div className="relative p-4" onClick={(e) => e.stopPropagation()}>

            <img src={`${DjangoConfig.profile_picture_url}${message.content}`} alt="Enlarged" className="max-w-[80vw] max-h-[80vh] rounded-lg" />

            {/* Close Button */}
            <button
                onClick={()=>zoomToogle(null)}
                className="absolute -top-2 -right-2 text-white hover:text-red-500 text-2xl  p-1 rounded-full"
            >
                <X size={24} />
            </button>
            <button
                onClick={()=>downloadFile(message.content)}
                className="absolute -top-2 -right-8 text-white hover:text-blue-500 text-2xl  p-1 rounded-full"
            >
                <Download size={24} />
            </button>

        </div>
        </div>
    );
};




export default Zoom;
