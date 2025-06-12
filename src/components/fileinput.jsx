import { handleUpload, uploadOptions } from '@/utils/fileinput';
import React from 'react';

const FileInput = ({setInputMessage,setFileUrl,setOpenFile}) => {



  return (
    <div className="bottom-20 left-10 w-60 z-50 bg-white absolute px-2 py-1 rounded-lg shadow-2xl">
      {uploadOptions.map((option) => (
        <div key={option.id} className="flex items-center p-2">
          <label
            htmlFor={option.id}
            className="text-sm text-gray-600 cursor-pointer flex items-center space-x-2"
          >
            {option.icon}
            <span>{option.label}</span>
          </label>

          {/* Hidden file input */}
          <input
            type={option.type}
            id={option.id}
            accept={option.accept}
            onChange={(event)=>{handleUpload(event,setOpenFile,setFileUrl,setInputMessage)}}
            className="hidden"
          />
        </div>
      ))}
    </div>
  );
}

export default FileInput;
