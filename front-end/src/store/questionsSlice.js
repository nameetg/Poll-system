import { createSlice } from "@reduxjs/toolkit";
import { v4 as uuidv4 } from "uuid";

const questionsSlice = createSlice({
  name: "questions",
  initialState: [],
  reducers: {
    addQuestion: (state, action) => {
      const { question, options, correctOptionIndex } = action.payload;
      state.push({
        id: uuidv4(),
        question,
        options, // array of strings
        correctOptionIndex, // index of the correct option in the options array
      });
    },
  },
});

export const questionsActions = questionsSlice.actions;

export default questionsSlice;
