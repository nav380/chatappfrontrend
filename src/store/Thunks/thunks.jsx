import DjangoConfig from "@/config/config";
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";



// Fetch user chat messages from API (async)
export const fetchUserChats = createAsyncThunk("fetchUserChats", async () => {
  const response = await fetch(`${DjangoConfig.apiUrl}get_messages`,{
    credentials: "include",
  });
  const data = await response.json();
  return data;
});

export const markMessagesAsRead = createAsyncThunk(
  "messages/markAsRead",
  async (sender, { rejectWithValue }) => {
    try {
      const response = await fetch(`${DjangoConfig.apiUrl}mark_messages_read/`, {
        method: "POST",
        credentials: "include", // Ensures cookies (sessions) are sent
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sender }),
      });

      const data = await response.json();
      if (!response.ok) {
        return rejectWithValue(data.error); // Handle errors properly
      }
      return sender
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);



export const fatchmoremessages = createAsyncThunk(
  "messages/fatchmoremessages",
  async ({id,page}, { rejectWithValue }) => {
    try {
      const response = await fetch(`${DjangoConfig.apiUrl}get_user_messages_by_id/${id}/?page=${page}`, {
        credentials: "include", // Ensures cookies (sessions) are sent
      });

      const data = await response.json();
      if (!response.ok) {
        return rejectWithValue(data.error); // Handle errors properly
      }

      return data.messages; 
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);




// Fetch group chat messages from API (async)
export const fetchGroupChats = createAsyncThunk("fetchGroupChats", async () => {
    const response = await fetch(`${DjangoConfig.apiUrl}get_group_messages`, {
      credentials: "include",
    });
    const data = await response.json();
    return data;
  });
  
  
  
  
  export const markGroupMessageRead = createAsyncThunk(
    "messages/markGroupMessageRead",
    async (group_id, { rejectWithValue }) => {
      try {
        const response = await fetch(`${DjangoConfig.apiUrl}mark_messages_as_group_read/`, {
          method: "POST",
          credentials: "include", // Ensures cookies (sessions) are sent
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ group_id: group_id }),
        });
  
        const data = await response.json();
        if (!response.ok) {
          return rejectWithValue(data.error); // Handle errors properly
        }
  
  
        return group_id; // Return username to update state
      } catch (error) {
        return rejectWithValue(error.message);
      }
    }
  );
  
  
  export const fatchmoregroupmessages = createAsyncThunk(
    "messages/fatchmoregroupmessages",
    async ({ group_id, page }, { rejectWithValue }) => {
      try {
        const response = await fetch(`${DjangoConfig.apiUrl}get_group_messages_by_id/${group_id}/?page=${page}`, {
          credentials: "include", // Ensures cookies (sessions) are sent
        });
  
        const data = await response.json();
        if (!response.ok) {
          return rejectWithValue(data.error); // Handle errors properly
        }
        return data.messages;
      } catch (error) {
        return rejectWithValue(error.message);
      }
    }
  );
  
  export const deletegroupmessages = createAsyncThunk(
    "messages/deletegroupmessages",
    async ({ id }, { rejectWithValue }) => {
      try {
        const response = await fetch(`${DjangoConfig.apiUrl}delete_group_message/${id}`, {
          credentials: "include", // Ensures cookies (sessions) are sent
        });
  
        const data = await response.json();
        if (!response.ok) {
          return rejectWithValue(data.error); // Handle errors properly
        }
        return id;
      } catch (error) {
        return rejectWithValue(error.message);
      }
    }
  );