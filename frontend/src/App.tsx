import { useMemo, useState } from "react";
import CodeMirror, { ReactCodeMirrorProps } from "@uiw/react-codemirror";
import { vscodeDark, vscodeLight } from "@uiw/codemirror-theme-vscode";
import { loadLanguage } from "@uiw/codemirror-extensions-langs";
import { Button, Select, Input, Tabs, Flex, Layout, Typography } from "antd";
import type { ButtonProps } from "antd";
import { CaretRightOutlined } from "@ant-design/icons";
import useTheme from "./hooks/useTheme";
import { useQueryState } from "nuqs";
import { useMutation, useQuery } from "@tanstack/react-query";
import axios from "axios";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { io } from "socket.io-client";

const BACKEND_URL = import.meta.env.VITE_PUBLIC_SERVER_URL as string;

function App() {
  const [code, setCode] = useState("");
  const [currLang, setCurrLang] = useState("c");
  const [inputText, setInputText] = useState("");
  const [sessionId, setSessionId] = useQueryState("session_id");

  const theme = useTheme();

  const tabItems = useMemo(() => {
    return [
      {
        key: "1",
        label: "Input",
        children: (
          <Input.TextArea
            placeholder="Enter your input here"
            value={inputText}
            onChange={(e) => setInputText(e.currentTarget.value)}
            style={{ resize: "none" }}
            rows={4}
          />
        ),
      },
      {
        key: "2",
        label: "Output",
        children: (
          <Input.TextArea
            readOnly
            placeholder="Your output will appear here"
            style={{ resize: "none" }}
            rows={4}
          />
        ),
      },
    ];
  }, []);

  const { isLoading, error } = useQuery({
    queryKey: ["session_id"],
    queryFn: () => {
      if (!sessionId) {
        return axios.post(`${BACKEND_URL}/api/session/create`).then((res) => {
          setSessionId(res.data.session_id);
          return res.data.session_id;
        });
      } else {
        return sessionId;
      }
    },
    staleTime: Infinity,
  });

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

  if (error) console.warn(error);

  const handleChange: ReactCodeMirrorProps["onChange"] = (v) => setCode(v);
  const changeLanguage = (value: string) => setCurrLang(value);
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

  const selectOptions = [
    { value: "c", label: "C" },
    { value: "cpp", label: "C++" },
    { value: "java", label: "Java" },
    { value: "python", label: "Python" },
    { value: "javascript", label: "JavaScript" },
  ];

  return isLoading ? null : (
    <>
      <ReactQueryDevtools />
      <Layout className="p-4 w-full h-screen">
        <Flex
          vertical
          gap={16}
          className="h-full"
        >
          <header className="flex justify-center">
            <Typography.Title level={3}>Online Compiler</Typography.Title>
          </header>
          <Layout>
            <Flex
              gap={2}
              justify="flex-end"
            >
              <Select
                labelRender={(props) => {
                  return `Language: ${props.label}`;
                }}
                className="w-fit"
                variant="filled"
                defaultValue={selectOptions[0].value}
                onChange={changeLanguage}
                options={selectOptions}
              />
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
          <CodeMirror
            className="min-h-80"
            value={code}
            onChange={handleChange}
            height="100px"
            theme={theme.theme === "dark" ? vscodeDark : vscodeLight}
            basicSetup={{
              bracketMatching: true,
              closeBrackets: true,
              allowMultipleSelections: true,
              highlightActiveLine: false,
              highlightActiveLineGutter: false,
            }}
            extensions={[loadLanguage(currLang as any) as any]}
          />
          <Layout className="flex justify-between">
            <Layout className="w-full flex flex-col justify-between">
              <Tabs
                defaultActiveKey="1"
                items={tabItems}
              />
            </Layout>
          </Layout>
        </Flex>
      </Layout>
    </>
  );
}

export default App;
