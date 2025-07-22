import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { useSocket } from "./useSocket"; // adjust path
import { studentActions } from "../store/studentSlice";
import { useMemo } from "react";

const Chat = ({ role, name }) => {
  
  const dispatch = useDispatch();

  const allParticipants = useSelector((store) => store.students);

  const participants = useMemo(() => {
    const uniqueMap = new Map();

    allParticipants.forEach((p) => {
      const key = `${p.id}-${p.socketId}`;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, p);
      }
    });

    return Array.from(uniqueMap.values());
  }, [allParticipants]);

  const { socket, isConnected } = useSocket({
    endpoint: "http://localhost:5050",
  });

  // useEffect(() => {
  //   if (!socket || !isConnected) return;

  //   // Assume `role` and `name` props are available

  //   if (role === "teacher") {
  //     socket.emit("register-teacher", { id, name });
  //   }
  // }, [socket, isConnected, role, name]);

  return <></>;
};

export default Chat;
