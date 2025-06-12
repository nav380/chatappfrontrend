"use client"
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { fatchmoremessages, fetchUserChats, markMessagesAsRead } from "../Thunks/thunks";



// Initial state
const chatSlice = createSlice({
  name: "chat",
  initialState: { messages: [], loading: false, error: null},
  reducers: {
    sendUserMessage(state, action) {
      state.messages.push(action.payload);
      state.messages = state.messages.filter((message, index, self) =>
        index === self.findIndex((t) => (
          t.id === message.id
        ))
      );
      state.messages = state.messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    }
  },
  extraReducers: (builder) => {
      builder
        .addCase(fetchUserChats.pending, (state) => {
          state.loading = true;
        })
        .addCase(fetchUserChats.fulfilled, (state, action) => {
          state.loading = false;
          state.messages = action.payload;
          state.messages = state.messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        })
        .addCase(fetchUserChats.rejected, (state, action) => {
          state.loading = false;
          state.error = action.error.message;
        })
        .addCase(markMessagesAsRead.pending, (state) => {
          state.status = "loading";
        })
        .addCase(markMessagesAsRead.fulfilled, (state, action) => {
          state.status = "succeeded";
          state.messages = state.messages.map((message) =>
            message.sender.username === action.payload && message.read === false
              ? { ...message, read: true }
              : message
          );
          state.messages = state.messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        })
        .addCase(markMessagesAsRead.rejected, (state, action) => {
          state.status = "failed";
          state.error = action.payload;
        })
        .addCase(fatchmoremessages.pending, (state) => {
          state.status = "loading";
        })
        .addCase(fatchmoremessages.fulfilled, (state, action) => {
          state.status = "succeeded";
          if (action.payload.length > 0 ){
            state.messages = state.messages.concat(action.payload);
            state.messages = state.messages.filter((message, index, self) =>
              index === self.findIndex((t) => (
                t.id === message.id
              ))
            );
            state.messages = state.messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

          }
         
        })
        .addCase(fatchmoremessages.rejected, (state, action) => {
          state.status = "failed";
          state.error = action.payload;
        });
    },
  
});

// Export actions and reducer
export const { sendUserMessage } = chatSlice.actions;
export default chatSlice.reducer;
