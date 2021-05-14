import React, { useEffect, useState } from "react";
import { Select } from "antd";
import styles from "./styles.js";
import COLOR from "../../../constants/colors.js";

function CreatePostPrivacySelect({
  postSpace = undefined,
  postPrivacy,
  setPostPrivacy,
}) {
  const [privacyOpts, setPrivacyOpts] = useState([{ value: "Group" }]);

  useEffect(() => {
    let newOpts =
      postSpace !== ""
        ? [{ value: "Group" }]
        : ["Public", "Friend", "Private"].map((x) => ({ value: x }));

    setPrivacyOpts(newOpts);
    setPostPrivacy(newOpts[0].value);
  }, [postSpace]);

  const handlePostPrivacyChange = (value) => {
    setPostPrivacy(value);
  };

  return (
    <>
      <Select
        className="green"
        style={{ width: "100%" }}
        options={privacyOpts}
        value={postPrivacy}
        onChange={handlePostPrivacyChange}
      />
    </>
  );
}

export default CreatePostPrivacySelect;
