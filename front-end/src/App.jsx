import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import TeacherPage from "./pages/TeacherPage";
import StudentPage from "./pages/StudentPage";
import LoginPage from "./pages/LoginPage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/teacher" element={<TeacherPage />} />
        <Route path="/student" element={<StudentPage />} />
        <Route path="/" element={<LoginPage />} />
      </Routes>
    </Router>
  );
}
export default App;
