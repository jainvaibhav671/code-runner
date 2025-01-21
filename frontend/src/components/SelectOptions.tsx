import { Select } from "antd";
import { useGetLanguageOptions } from "../hooks/queries";

export default function SelectOptions({
  onChange,
}: {
  onChange: React.Dispatch<React.SetStateAction<string>>;
}) {
  const selectOptions = useGetLanguageOptions().data;

  return (
    typeof selectOptions !== "undefined" && (
      <Select
        labelRender={(props) => {
          return `Language: ${props.label}`;
        }}
        className="w-fit"
        variant="filled"
        defaultValue={selectOptions[0].value}
        onChange={onChange}
        options={selectOptions}
      />
    )
  );
}
