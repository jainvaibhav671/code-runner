import { useState } from "react";
import { Button, Flex, Layout, Typography } from "antd";
import type { ButtonProps } from "antd";
import { CaretRightOutlined } from "@ant-design/icons";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { io } from "socket.io-client";
import { useSession } from "./hooks/queries";
import SelectOptions from "./components/SelectOptions";
import Codebox from "./components/Codebox";
import BottomPanel from "./components/BottomPanel";

const BACKEND_URL = import.meta.env.VITE_PUBLIC_SERVER_URL as string;

function App() {
  const [code, setCode] = useState("");
  const [currLang, setCurrLang] = useState("c");
  const [inputText, setInputText] = useState("");
  const sessionId = useSession();

  const saveSession = useMutation({
    mutationFn: async (data: any) => {
      return await axios.post(`${BACKEND_URL}/save-session`, data);
    },
  });

  const runCode = useMutation({
    mutationFn: async (data: any) => {
      return await axios.post(`${BACKEND_URL}/run-code`, data);
    },
  });

  const handleRun: ButtonProps["onClick"] = async () => {
    // submit it to backend for execution
    if (!sessionId) return;

    const data = {
      code: code,
      input: inputText,
      lang: currLang,
      sessionId: sessionId,
    };

    const res = await saveSession.mutateAsync(data);
    if (!res.data.success) {
      console.warn(res.data.error);
      return;
    }

    const res2 = await runCode.mutateAsync(data);
    if (!res2.data.success) {
      console.warn(res2.data.error);
      return;
    }

    const socket = io(`${BACKEND_URL}/task/${sessionId}`, {
      transports: ["websocket"],
    });

    // Listen for output messages from the backend
    socket.on("output", (data) => {
      console.log("Output:", data);
    });

    // Listen for completion notification
    socket.on("done", (message) => {
      console.log("Execution completed:", message);
      socket.disconnect(); // Clean up after execution completes
    });

    // Handle connection errors
    socket.on("connect_error", (error) => {
      console.error("WebSocket connection error:", error.message);
    });
  };

  return (
    sessionId && (
      <>
        <ReactQueryDevtools />
        <Layout className="p-4 w-full h-screen">
          <Flex
            vertical
            gap={16}
            className="h-full"
          >
            <header className="flex justify-center">
              <Typography.Title level={1}>Online Compiler</Typography.Title>
            </header>
            <Layout>
              <Flex
                gap={10}
                justify="flex-end"
              >
                <SelectOptions onChange={setCurrLang} />
                <Button
                  icon={<CaretRightOutlined />}
                  color="primary"
                  variant="solid"
                  onClick={handleRun}
                  loading={saveSession.isPending || runCode.isPending}
                  disabled={saveSession.isPending || runCode.isPending}
                >
                  Run
                </Button>
              </Flex>
            </Layout>
            <Codebox
              code={code}
              setCode={setCode}
              currLang={currLang}
            />
            <BottomPanel
              inputText={inputText}
              setInputText={setInputText}
            />
          </Flex>
        </Layout>
      </>
    )
  );
}

export default App;
