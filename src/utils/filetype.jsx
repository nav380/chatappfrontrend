import { useMemo } from "react";

const useFileTypes = () => {
  return useMemo(() => ({
    image: ["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg", "tiff"],
    video: ["mp4", "webm", "ogg", "mkv", "mov", "avi", "flv", "wmv"],
    audio: ["mp3", "wav", "ogg", "flac", "aac", "m4a"],
    document: [
      "pdf", "doc", "docx", "odt", "rtf", "tex", "wpd", // Word Processing
      "xls", "xlsx", "ods", "csv", "tsv", // Spreadsheets
      "ppt", "pptx", "odp", "key", // Presentations
      "txt", "md", "json", "xml", "yaml", "yml", "log", // Plain text & structured formats
      "epub", "mobi", "azw", "fb2", // eBooks
      "tex", "latex", // Scientific documents
      "xps", "pages", "pub", // Miscellaneous
      "js", "jsx", "ts", "tsx", "html", "css", "scss", "sass", // Web development
      "py", "java", "cpp", "c", "cs", "rb", "php", "go", "rs", "swift", "kt", "dart", "lua", // Programming languages
      "sh", "bat", "cmd", "ps1", // Shell scripts
      "sql", "db", "sqlite" // Database-related files
    ],
    archive: ["zip", "rar", "7z", "tar", "gz", "bz2", "xz", "iso"],
  }), []);
};

export default useFileTypes;
