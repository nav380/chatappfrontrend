import DjangoConfig from "@/config/config";
import { ArrowDownToLine } from "lucide-react";
import { useState } from "react";

const FileDownloader = ({ msg }) => {
  const fileUrl = `${DjangoConfig.profile_picture_url}${msg.content}`;
  const fileName = msg.content.split("/").pop(); // Extract file name
  const [progress, setProgress] = useState(0);
  const [downloading, setDownloading] = useState(false);

  const downloadFile = async () => {
    try {
      setDownloading(true);
      setProgress(0);

      const response = await fetch(fileUrl);
      const reader = response.body.getReader();
      const contentLength = +response.headers.get("Content-Length");
      let receivedLength = 0;
      let chunks = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        receivedLength += value.length;
        setProgress(Math.round((receivedLength / contentLength) * 100));
      }

      const blob = new Blob(chunks);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error("Download error:", error);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex items-start gap-2 p-3 text-white rounded-lg">
      {/* File Name */}
      {fileName}

      {/* Download Button */}
      <div
        onClick={downloadFile}
        className="relative flex items-center gap-2 px-4 py-2 text-white font-semibold rounded-lg cursor-pointer"
        disabled={downloading}
      >
        {!downloading && <ArrowDownToLine size={16} />}
      </div>

      {/* Progress Indicator */}
      {downloading && (
        <div className="relative w-6 h-6">
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 24 24">
            <circle
              className="text-gray-300"
              strokeWidth="4"
              stroke="currentColor"
              fill="transparent"
              r="10"
              cx="12"
              cy="12"
            />
            <circle
              className="text-green-500"
              strokeWidth="4"
              strokeDasharray="62.8"
              strokeDashoffset={62.8 - (62.8 * progress) / 100}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
              r="10"
              cx="12"
              cy="12"
            />
          </svg>
        </div>
      )}
    </div>
  );
};

export default FileDownloader;
