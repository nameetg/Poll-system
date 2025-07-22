// src/pages/LoginPage.jsx
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const [selected, setSelected] = useState("student");

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center space-y-6">
        <div className="inline-block bg-violet-100 text-violet-800 text-xs px-3 py-1 rounded-full font-medium">
          🎓 Intervue Poll
        </div>
        <h1 className="text-2xl font-semibold">
          Welcome to the <span className="font-bold">Live Polling System</span>
        </h1>
        <p className="text-gray-500 max-w-md mx-auto">
          Please select the role that best describes you to begin using the live polling system
        </p>

        <div className="flex justify-center gap-4">
          <Link to="/student" onClick={() => setSelected("student")}>
            <Card
              className={cn(
                "cursor-pointer w-64 border p-4 text-left",
                selected === "student" && "border-violet-500 shadow-md"
              )}
            >
              <CardContent className="p-0">
                <h2 className="font-semibold mb-1">I'm a Student</h2>
                <p className="text-sm text-gray-500">
                  Submit answers and view live poll results in real-time.
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/teacher" onClick={() => setSelected("teacher")}>
            <Card
              className={cn(
                "cursor-pointer w-64 border p-4 text-left",
                selected === "teacher" && "border-violet-500 shadow-md"
              )}
            >
              <CardContent className="p-0">
                <h2 className="font-semibold mb-1">I'm a Teacher</h2>
                <p className="text-sm text-gray-500">
                  Create polls and view student submissions live.
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
