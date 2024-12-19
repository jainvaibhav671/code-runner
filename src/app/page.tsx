"use client";

import React, {
  useRef,
  useEffect,
  useState,
  SelectHTMLAttributes,
} from "react";
import CodeMirror, { ReactCodeMirrorProps } from "@uiw/react-codemirror";
import { vscodeDark, vscodeLight } from "@uiw/codemirror-theme-vscode";
import { loadLanguage } from "@uiw/codemirror-extensions-langs";
import {
  Button,
  ButtonProps,
  Select,
  SelectItem,
  Textarea,
} from "@nextui-org/react";
import { Tabs, Tab } from "@nextui-org/react";
import { createSessionId } from "@/lib/db";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createSession, getSession } from "@/lib/actions";
import axios from "axios";

function App() {
  const [code, setCode] = useState("");
  const [currLang, setCurrLang] = useState("c");
  const [inputText, setInputText] = useState("");

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const sessionId = createSessionId();

    const params = new URLSearchParams(searchParams.toString());
    params.set("sessionId", sessionId);

    router.replace(`${pathname}?${params.toString()}`);
  }, []);

  const handleChange: ReactCodeMirrorProps["onChange"] = (v, vu) => {
    setCode(v);
  };

  const changeLanguage: SelectHTMLAttributes<HTMLSelectElement>["onChange"] = (
    e
  ) => {
    setCurrLang(e.target.value as any);
  };

  const handleRun: ButtonProps["onPress"] = async (e) => {
    // submit it to backend for execution
    const sessionId = searchParams.get("sessionId");
    if (!sessionId) return;

    const data = {
      code: code,
      input: inputText,
      lang: currLang,
      sessionId: sessionId,
    };

    const res = await axios.post("/api/session/save", data);
    console.log(res);
  };

  const langs = {
    cpp: "C++",
    java: "Java",
    javascript: "JavaScript",
    typescript: "TypeScript",
    python: "Python",
    c: "C",
  };

  return (
    <div className="p-4 w-full h-screen">
      <div className="flex flex-col h-full gap-4">
        <header className="flex justify-between items-center">
          <h1>Online Compiler</h1>
          <div>
            <Select
              className="min-w-36 h-2"
              label={"Select Language"}
              defaultSelectedKeys={["c"]}
              onChange={changeLanguage}
            >
              {Object.entries(langs).map(([k, v]) => {
                return <SelectItem key={k}>{v}</SelectItem>;
              })}
            </Select>
          </div>
        </header>
        <CodeMirror
          className="border-b min-h-80"
          value={code}
          onChange={handleChange}
          height="100px"
          theme={vscodeLight}
          basicSetup={{
            bracketMatching: true,
            closeBrackets: true,
            allowMultipleSelections: true,
          }}
          extensions={[loadLanguage(currLang as any) as any]}
        />
        <div className="flex justify-between">
          <div className="w-full flex flex-col justify-between">
            <Tabs aria-label="Tabs">
              <Tab
                key="input"
                title="Input"
              >
                <Textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  minRows={8}
                />
              </Tab>
              <Tab
                key="output"
                title="Output"
              >
                <Textarea
                  minRows={8}
                  readOnly
                />
              </Tab>
              <Tab
                key="settings"
                title="Settings"
              >
                <div className="h-44">
                  <h2>Settings</h2>
                </div>
              </Tab>
            </Tabs>
          </div>
          <div>
            <Button
              variant="light"
              onPress={handleRun}
            >
              Run
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
export default App;
