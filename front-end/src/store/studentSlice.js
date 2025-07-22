import { createSlice } from "@reduxjs/toolkit";

const studentSlice = createSlice({
  name: "students",
  initialState: [],
  reducers: {
    setParticipants: (state, action) => {
      return action.payload.filter(
        (participant, index, self) =>
          index === self.findIndex((p) => p.socketId === participant.socketId)
      );
    },
  },
});

export const studentActions = studentSlice.actions;

export default studentSlice;
