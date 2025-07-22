import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useSocket } from "./useSocket";
import { useDispatch, useSelector } from "react-redux";
import { studentActions } from "../store/studentSlice";
import { v4 as uuidv4 } from "uuid";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function TeacherPage() {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState([
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
  ]);
  const [name, setName] = useState("");
  const [enter, setEnter] = useState(false);
  const [id, setId] = useState("");
  const [timeLeft, setTimeLeft] = useState(60);
  const [pollActive, setPollActive] = useState(false);
  const [currentPoll, setCurrentPoll] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [message, setMessage] = useState("");

  const dispatch = useDispatch();
  const pollResults = useSelector((state) => state.students.poll);
  const participants = useSelector((store) => store.students);

  useEffect(() => {
    const savedName = localStorage.getItem("teacherName");
    const savedId = localStorage.getItem("teacherId");

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
    localStorage.setItem("teacherName", name);
    localStorage.setItem("teacherId", newId);
  };

  const { socket, isConnected } = useSocket({
    endpoint: "https://real-time-poll-system.onrender.com",
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

  useEffect(() => {
    if (!socket || !enter) return;

    socket.emit("register-teacher", { id, name });

    // socket.on("participants-list", (participants) => {
    //   dispatch(studentActions.setParticipants(participants));
    // });

    socket.on("poll-data", (pollData) => {
      setCurrentPoll(pollData);
      setPollActive(true);
    });

    return () => {
      // socket.off("participants-list");
      socket.off("poll-data");
    };
  }, [socket, dispatch, enter, name, id]);

  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index].text = value;
    setOptions(newOptions);
  };

  const handleCorrectToggle = (index, isCorrect) => {
    const newOptions = [...options];
    newOptions[index].isCorrect = isCorrect;
    setOptions(newOptions);
  };

  const addOption = () => {
    setOptions([...options, { text: "", isCorrect: false }]);
  };

  const handleAskQuestion = () => {
    if (!question.trim()) return;

    const validOptions = options.filter((opt) => opt.text.trim());
    if (validOptions.length < 2) {
      alert("Please enter at least two options.");
      return;
    }

    const correctIndex = validOptions.findIndex(
      (opt) => opt.isCorrect === true
    );
    if (correctIndex === -1) {
      alert("Please mark at least one correct option.");
      return;
    }

    const newPoll = {
      question: question.trim(),
      options: validOptions.map((opt) => opt.text.trim()),
      ans: correctIndex + 1,
      duration: timeLeft,
    };

    socket.emit("new-poll", newPoll);
    setPollActive(true);
  };

  const handleAskNewQuestion = () => {
    setQuestion("");
    setOptions([
      { text: "", isCorrect: false },
      { text: "", isCorrect: false },
    ]);
    setPollActive(false);
  };

  const handleSendMessage = () => {
    if (message === "") return;
    socket.emit("user-message", { message, name });
    setMessage("");
  };

  const handleKick = (participantSocketId) => {
    // Ensure this is the socket ID
    socket.emit("kick-participant", participantSocketId);
  };

  const calculateVotePercentage = (votes = []) => {
    const totalVotes =
      currentPoll?.options.reduce(
        (acc, option) => acc + option.votes.length,
        0
      ) || 0;
    return totalVotes > 0 ? Math.round((votes.length / totalVotes) * 100) : 0;
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50 to-white p-8">
      <div className="flex justify-between items-center mb-6">
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
        You'll have the ability to create and manage polls, ask questions, and
        monitor your students' responses in real-time.
      </p>

      <div className="flex gap-8 mb-4">
        {!pollActive ? (
          <Card className="w-1/2 border-violet-200 shadow-sm">
            <CardContent className="p-6">
              <div className="mb-4">
                <div className="flex justify-between items-center mb-1">
                  <label className="font-medium text-violet-800">
                    Enter your question
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-violet-400">Duration:</span>
                    <select
                      value={timeLeft}
                      onChange={(e) => setTimeLeft(Number(e.target.value))}
                      className="text-xs border border-violet-200 rounded px-2 py-1"
                    >
                      <option value={30}>30 sec</option>
                      <option value={60}>1 min</option>
                      <option value={90}>1.5 min</option>
                      <option value={120}>2 min</option>
                    </select>
                  </div>
                </div>
                <Textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Type your question..."
                  className="focus-visible:ring-violet-300 border-violet-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-violet-700">
                    Edit Options
                  </label>
                  {options.map((opt, index) => (
                    <Input
                      key={index}
                      className="mt-1 mb-2 focus-visible:ring-violet-300 border-violet-200"
                      value={opt.text}
                      onChange={(e) =>
                        handleOptionChange(index, e.target.value)
                      }
                      placeholder={`Option ${index + 1}`}
                    />
                  ))}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={addOption}
                    className="text-violet-600 hover:text-violet-800 hover:bg-violet-50"
                  >
                    + Add More option
                  </Button>
                </div>

                <div>
                  <label className="text-sm font-medium text-violet-700">
                    Is it Correct?
                  </label>
                  {options.map((opt, index) => (
                    <div key={index} className="flex items-center gap-4 mt-2">
                      <div className="text-sm w-28 text-violet-800">
                        {opt.text || `Option ${index + 1}`}
                      </div>
                      <label className="flex items-center gap-1 text-sm text-violet-700">
                        <input
                          type="radio"
                          checked={opt.isCorrect === true}
                          onChange={() => handleCorrectToggle(index, true)}
                          className="text-violet-600 focus:ring-violet-500"
                        />
                        Yes
                      </label>
                      <label className="flex items-center gap-1 text-sm text-violet-700">
                        <input
                          type="radio"
                          checked={opt.isCorrect === false}
                          onChange={() => handleCorrectToggle(index, false)}
                          className="text-violet-600 focus:ring-violet-500"
                        />
                        No
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <Button
                className="mt-6 w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-md py-2 text-sm"
                onClick={handleAskQuestion}
              >
                Start Poll ({timeLeft}s)
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="w-1/2 border-violet-200 shadow-sm">
            <CardContent className="p-6 space-y-4">
              <h2 className="text-lg font-semibold text-violet-800">
                {currentPoll?.question}
              </h2>

              <div className="space-y-3">
                {currentPoll?.options.map((option) => (
                  <div key={option.id} className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span
                        className={`font-medium ${
                          currentPoll.ans === option.id ? "text-green-600" : ""
                        }`}
                      >
                        {option.text}
                        {currentPoll.ans === option.id && " (Correct)"}
                      </span>
                      <span className="text-sm text-violet-600">
                        {option.votes.length} votes (
                        {calculateVotePercentage(option.votes)}%)
                      </span>
                    </div>
                    <div className="w-full bg-violet-100 rounded-full h-2">
                      <div
                        className="bg-violet-500 h-2 rounded-full"
                        style={{
                          width: `${calculateVotePercentage(option.votes)}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4">
                <Button
                  className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-md py-2 text-sm"
                  onClick={handleAskNewQuestion}
                >
                  Ask New Question
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

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
                          {/* Teacher */}
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
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleKick(participant.socketId)}
                          >
                            Kick
                          </Button>
                        </li>
                      ))}
                  </ul>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
