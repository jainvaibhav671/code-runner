import CodeMirror, { ReactCodeMirrorProps } from "@uiw/react-codemirror";
import { vscodeDark, vscodeLight } from "@uiw/codemirror-theme-vscode";
import { loadLanguage } from "@uiw/codemirror-extensions-langs";
import useTheme from "../hooks/useTheme";
import { useState } from "react";

type Props = {
  currLang: string;
  code: string;
  setCode: React.Dispatch<React.SetStateAction<string>>;
};

export default function Codebox(props: Props) {
  const theme = useTheme();
  const handleChange: ReactCodeMirrorProps["onChange"] = (v) =>
    props.setCode(v);

  return (
    <CodeMirror
      className="min-h-80 h-3/5 max-h-full"
      value={props.code}
      onChange={handleChange}
      theme={theme.theme === "dark" ? vscodeDark : vscodeLight}
      basicSetup={{
        bracketMatching: true,
        closeBrackets: true,
        allowMultipleSelections: true,
        highlightActiveLine: true,
        highlightActiveLineGutter: true,
      }}
      extensions={[loadLanguage(props.currLang as any) as any]}
    />
  );
}
