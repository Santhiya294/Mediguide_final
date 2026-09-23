import React from "react";
import SymptomForm from "../SymptomForm";
import Chatbox from "../Chatbox";

function AssistantPage() {
  return (
    <div>
      <h2>AI Health Assistant</h2>

      <div style={{ display: "flex", gap: "40px" }}>
        <SymptomForm />
        <Chatbox />
      </div>
    </div>
  );
}

export default AssistantPage;