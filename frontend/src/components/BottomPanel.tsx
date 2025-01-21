import { Input, Layout, Tabs } from "antd";
import { useMemo } from "react";

type Props = {
  inputText: string;
  setInputText: React.Dispatch<React.SetStateAction<string>>;
};
export default function BottomPanel(props: Props) {
  const tabItems = useMemo(() => {
    return [
      {
        key: "1",
        label: "Input",
        children: (
          <Input.TextArea
            placeholder="Enter your input here"
            value={props.inputText}
            onChange={(e) => props.setInputText(e.currentTarget.value)}
            style={{ resize: "none" }}
            rows={10}
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
            rows={10}
          />
        ),
      },
    ];
  }, []);

  return (
    <Layout className="w-full flex flex-col justify-between pb-24">
      <Tabs
        defaultActiveKey="1"
        items={tabItems}
      />
    </Layout>
  );
}
