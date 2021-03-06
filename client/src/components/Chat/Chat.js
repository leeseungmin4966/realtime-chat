import React, { useEffect, useState } from "react";
import queryString from "query-string";
import io from "socket.io-client";
import { useHistory } from "react-router-dom";
import InfoBar from "../InfoBar/InfoBar";
import Messages from "../Messages/Messages";
import Input from "../Input/Input";
import TextContainer from "../TextContainer/TextContainer";

import "./Chat.css";

let socket;

const Chat = ({ location }) => {
  const [name, setName] = useState("");
  const [room, setRoom] = useState("");
  const [users, setUsers] = useState("");
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [file, setFile] = useState();
  const [attachment, setAttachment] = useState("");
  const ENDPOINT = "https://realtime-chats-app.herokuapp.com/";
  let history = useHistory();

  useEffect(() => {
    const { name, room } = queryString.parse(location.search); ///url을 각각의 값들로  parse 해 준다.
    //CORS HANDLING
    socket = io(ENDPOINT, {
      "force new connection": true,
      reconnectionAttempts: "Infinity",
      timeout: 10001,
      transports: ["websocket"],
    });
    //console.log(socket);

    setName(name);
    setRoom(room);

    socket.emit("join", { name, room }, (error) => {
      //server쪽 join의 callback함수가 호출될시 실행.
      if (error) {
        alert(error);
        history.push("/");
      }
    });
    return () => {
      //will unmount
      //socket.emit("disconnect");
      //socket.off(); // join off
    };
  }, [ENDPOINT, location.search]);

  useEffect(() => {
    socket.on("message", (message) =>
      setMessages((prev) => {
        return [...prev, message];
      })
    );
    socket.on("roomData", ({ users }) => {
      setUsers(users);
    });
    return () => {
      console.log("Un Mount");
    };
  }, []);

  const onInitFile = () => {
    const inputFileElement = document.querySelector(".inputFile");
    inputFileElement.value = "";
    setAttachment("");
    setFile();
  };

  const sendMessage = (event) => {
    event.preventDefault();
    if (file) {
      const messageObj = {
        type: "file",
        body: file,
        fileName: file.name,
        mimeType: file.type,
      };
      socket.emit("sendMessage", messageObj, () => {
        onInitFile();
      });
    }
    if (message) {
      const messageObj = {
        type: "text",
        body: message,
      };
      socket.emit("sendMessage", messageObj, () => setMessage(""));
    }
  };
  return (
    <div className="outerContainer">
      <div className="container">
        <InfoBar room={room} />
        <Messages messages={messages} name={name} />
        <Input
          message={message}
          setMessage={setMessage}
          attachment={attachment}
          setAttachment={setAttachment}
          file={file}
          setFile={setFile}
          sendMessage={sendMessage}
        />
      </div>
      <TextContainer users={users} />
    </div>
  );
};

export default Chat;
