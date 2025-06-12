"use client"

import DjangoConfig from "@/config/config";
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { deletegroupmessages, fatchmoregroupmessages, fetchGroupChats, markGroupMessageRead } from "../Thunks/thunks";



// Initial state

const groupChatSlice = createSlice({
  name: "groupChat",
  initialState: { messages: [], loading: false, error: null },
  reducers: {
    sendGroupMessage(state, action) {
      state.messages.push(action.payload);
      state.messages = state.messages.filter((message, index, self) =>
        index === self.findIndex((t) => (
          t.id === message.id
        ))
      );
      state.messages = state.messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchGroupChats.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchGroupChats.fulfilled, (state, action) => {
        state.loading = false;
        state.messages = action.payload;
        state.messages = state.messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      })
      .addCase(fetchGroupChats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(markGroupMessageRead.pending, (state) => {
        state.status = "loading";
      })
      .addCase(markGroupMessageRead.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.messages = state.messages.map((message) =>
          message.group_name.id === action.payload && message.user_has_read === false
            ? { ...message, user_has_read: true }
            : message
        );
        state.messages = state.messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      })
      .addCase(fatchmoregroupmessages.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fatchmoregroupmessages.fulfilled, (state, action) => {
        state.status = "succeeded";
        if (action.payload.length > 0) {
          state.messages = state.messages.concat(action.payload);
          state.messages = state.messages.filter((message, index, self) =>
            index === self.findIndex((t) => (
              t.id === message.id
            ))
          );
          state.messages = state.messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        }
      })
      .addCase(fatchmoregroupmessages.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(deletegroupmessages.pending, (state) => {
        state.status = "loading";
      })
      .addCase(deletegroupmessages.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.messages = state.messages.filter((message) => message.id!== action.payload);
      })
      .addCase(deletegroupmessages.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      });
  },
});

// Export actions and reducer
export const { sendGroupMessage } = groupChatSlice.actions;
export default groupChatSlice.reducer;
