import React, { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { v4 as uuidv4 } from "uuid";
import { studentActions } from "../store/studentSlice";
import { useSocket } from "./useSocket";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

const StudentPage = () => {
  const [poll, setPoll] = useState();
  const [optionId, setOptionId] = useState();
  const [name, setName] = useState("");
  const [id, setId] = useState();
  const [enter, setEnter] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [kicked, setKicked] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [message, setMessage] = useState("");

  const dispatch = useDispatch();

  const participants = useSelector((store) => store.students);

  // Check localStorage on initial render
  useEffect(() => {
    const savedName = localStorage.getItem("studentName");
    const savedId = localStorage.getItem("studentId");

    if (savedName && savedId) {
      setName(savedName);
      setId(savedId);
      setEnter(true);
    }
  }, []);

  const handleContinue = () => {
    if (!name) return;

    const newId = uuidv4();
    setId(newId);
    setEnter(true);

    localStorage.setItem("studentName", name);
    localStorage.setItem("studentId", newId);
  };

  const { socket, isConnected } = useSocket({
    endpoint: `https://real-time-poll-system.onrender.com`,
    token: id,
  });

  useEffect(() => {
    if (!socket) return;

    // Handle incoming messages
    const handleMessage = (msgs) => {
      setChatMessages(msgs);
    };

    // Request messages when connected
    const handleConnect = () => {
      socket.emit("request-messages");
    };

    const handleParticipantsUpdate = (participantsList) => {
      dispatch(studentActions.setParticipants(participantsList));
    };

    socket.on("message", handleMessage);
    socket.on("connect", handleConnect);
    socket.on("participants-list", handleParticipantsUpdate);

    return () => {
      socket.off("message", handleMessage);
      socket.off("connect", handleConnect);
      socket.off("participants-list", handleParticipantsUpdate);
    };
  }, [socket]);

  // Handle incoming poll data
  useEffect(() => {
    if (!socket || !enter) return;

    // Register student with the server
    socket.emit("register-student", { id, name });

    socket.on("poll-data", (newPoll) => {
      setPoll(newPoll);
    });

    // socket.on("participants-list", (participants) => {
    //   dispatch(studentActions.setParticipants(participants));
    // });

    // Handle kicked event
    socket.on("you-were-kicked", () => {
      alert("You were kicked by the teacher");
      setKicked(true);
      localStorage.removeItem("studentName");
      localStorage.removeItem("studentId");
      socket.disconnect(); // optional: force disconnect
    });

    socket.emit("get-poll");

    return () => {
      socket.off("poll-data");
      socket.off("participants-list");
      socket.off("you-were-kicked");
    };
  }, [socket, enter, id, name, dispatch]);

  const handleVote = (optionId) => {
    setHasVoted(true);
    if (optionId) {
      socket.emit("vote", optionId);
    }
  };

  const totalVotes = useMemo(() => {
    return (
      poll?.options.reduce((acc, option) => acc + option.votes.length, 0) ?? 0
    );
  }, [poll]);

  const handleVoteNew = () => {
    setHasVoted(false);
    if (optionId) setPoll(null);
  };

  const handleSendMessage = () => {
    if (message === "") return;
    socket.emit("user-message", { message, name });
    setMessage("");
  };

  if (!enter) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-violet-50 to-indigo-50">
        <Card className="w-[400px] p-6 space-y-4 shadow-lg">
          <h2 className="text-xl font-bold text-violet-800">Enter Your Name</h2>
          <Input
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="focus-visible:ring-violet-300"
          />
          <Button
            className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-md"
            onClick={handleContinue}
          >
            Continue
          </Button>
        </Card>
      </div>
    );
  }

  if (kicked) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-violet-50 to-indigo-50">
        <Card className="p-10 border border-violet-200 bg-white shadow-md">
          <h2 className="text-2xl font-bold text-violet-800 mb-2">
            YOU HAVE BEEN KICKED BY TEACHER!
          </h2>
          <p className="text-sm text-violet-600">
            Please contact your instructor or reload the page.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50 to-white p-8">
      {/* Header Section */}
      <div className="flex justify-between mb-6">
        <div className="bg-gradient-to-r from-violet-100 to-indigo-100 text-violet-800 text-xs px-3 py-1 rounded-full font-medium border border-violet-200">
          🎓 Intervue Poll
        </div>
        <Button
          variant="outline"
          className="text-sm font-medium border-violet-300 text-violet-700 hover:bg-violet-50 hover:text-violet-800"
        >
          View Poll History
        </Button>
      </div>

      <h1 className="text-2xl font-semibold mb-2 text-violet-900">
        Let's{" "}
        <span className="font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
          Get Started
        </span>
      </h1>
      <p className="text-violet-700/80 mb-6 max-w-xl">
        If you are a student, you'll be able to submit your answers, participate
        in live polls, and see how your responses compare with your classmates
      </p>

      <div className="flex gap-8">
        {/* Poll Panel */}
        <div className="flex-[2]">
          {poll ? (
            <Card className="w-3/4 border-violet-200 shadow-sm">
              <CardContent className="space-y-4 p-6">
                <h2 className="text-lg font-semibold text-violet-800">
                  {poll.question}
                </h2>
                <div className="space-y-3 min-h-[200px] max-h-[200px] overflow-y-auto">
                  {poll.options.map((option) => (
                    <div
                      key={option.id}
                      className={`xl p-3 rounded-lg cursor-pointer transition-all ${
                        hasVoted
                          ? optionId === option.id
                            ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white"
                            : "bg-white border border-gray-200 cursor-default"
                          : optionId === option.id
                          ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white"
                          : "bg-white border border-violet-200 hover:border-violet-300"
                      }`}
                      onClick={() => {
                        if (hasVoted) return;
                        setOptionId(option.id);
                      }}
                    >
                      <div className="flex justify-between items-center">
                        <span>{option.text}</span>
                        <span className="text-sm">
                          {option.votes.length} vote
                          {option.votes.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                      {totalVotes > 0 && (
                        <div className="w-full bg-violet-100 rounded-full h-1.5 mt-2">
                          <div
                            className="bg-violet-500 h-1.5 rounded-full"
                            style={{
                              width: `${
                                (option.votes.length / totalVotes) * 100
                              }%`,
                            }}
                          ></div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {hasVoted ? (
                  <>
                    <p>Option {poll.ans} is correct</p>
                    <Button
                      className="mx-auto mt-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-md w-fit"
                      onClick={handleVoteNew}
                    >
                      Vote New Poll
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    className="mx-auto mt-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-md w-fit"
                    onClick={() => handleVote(optionId)}
                    disabled={!optionId}
                  >
                    Submit Vote
                  </Button>
                )}

                <p className="text-sm text-violet-600">
                  Total Votes: {totalVotes}
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card className="w-full border-violet-200">
              <CardContent className="p-6 text-violet-700/80">
                Waiting for the next poll...
              </CardContent>
            </Card>
          )}
        </div>

        {/* Chat & Participants Panel */}
        {/* <div className="flex-1 "> */}
        <div className="flex-[1]">
          <Card className="h-full">
            <CardContent className="h-full flex flex-col p-4">
              <Tabs defaultValue="chat" className="flex flex-col flex-1">
                <TabsList className="grid grid-cols-2 mb-4">
                  <TabsTrigger value="chat">Chat</TabsTrigger>
                  <TabsTrigger value="participants">Participants</TabsTrigger>
                </TabsList>

                <TabsContent value="chat" className="flex flex-col flex-1">
                  <ScrollArea className="flex-1 h-64 mb-2 pr-2">
                    {chatMessages.map((msg, i) => (
                      <div key={i} className="mb-1">
                        <span className="font-semibold mr-1">
                          {msg.user || "Anon"}:
                        </span>
                        {msg.text}
                      </div>
                    ))}
                  </ScrollArea>
                  <div className="flex gap-2">
                    <Input
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Type a message"
                    />
                    <Button onClick={handleSendMessage}>Send</Button>
                  </div>
                </TabsContent>

                <TabsContent value="participants">
                  <ul className="list-none ml-4 space-y-2">
                    {participants
                      .filter((participant) => participant.role === "student")
                      .map((participant) => (
                        <li
                          key={participant.id}
                          className="flex justify-between items-center"
                        >
                          <div>👤 {participant.name}</div>
                        </li>
                      ))}
                  </ul>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
        {/* </div> */}
      </div>
    </div>
  );
};

export default StudentPage;
