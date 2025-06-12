import { configureStore } from "@reduxjs/toolkit";
import chatReducer from "@/store/slices/chatSlice"; // Import chat slice
import groupChatReducer from "@/store/slices/groupChatSlice"; // Import group chat slice



const store = configureStore({
  reducer: {
    chat: chatReducer,
    groupChat: groupChatReducer,
    
  },
  
});

export default store;
