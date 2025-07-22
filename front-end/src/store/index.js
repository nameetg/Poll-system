import { configureStore } from "@reduxjs/toolkit";
import studentSlice from "./studentSlice";
import questionsSlice from "./questionsSlice";

const pollStore = configureStore({
  reducer: {
    students: studentSlice.reducer,
    questions: questionsSlice.reducer,
  },
});

export default pollStore;
