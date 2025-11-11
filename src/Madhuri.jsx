import React, { useState } from "react";
import Formcheck from "./Components/Formcheck";
import IdNotFound from "./Components/IdNotFound";
import WrongForm from "./Components/WrongForm";

function Madhuri() {
  const [active, setActive] = useState("formCheck"); // default selected

  const buttonStyle = {
    width: "100px",
    margin: "10px",
    padding: "4px 6px",
    textAlign: "center",
    textDecoration: "none",
    border: "none",
    borderRadius: "8px",
    display: "inline-block",
    fontSize: "14px",
    cursor: "pointer",
    transition: "0.3s",
  };

  const activeButton = {
    backgroundColor: "#007BFF",
    color: "white",
  };

  const inactiveButton = {
    backgroundColor: "#E0E0E0",
    color: "black",
  };

  return (
    <div style={{ textAlign: "center", marginTop: "0px" }}>
      {/* Buttons */}
      <div>
        <button
          style={{
            ...buttonStyle,
            ...(active === "formCheck" ? activeButton : inactiveButton),
          }}
          onClick={() => setActive("formCheck")}
        >
          Form Check
        </button>

        <button
          style={{
            ...buttonStyle,
            ...(active === "notFound" ? activeButton : inactiveButton),
          }}
          onClick={() => setActive("notFound")}
        >
          Not Found ID
        </button>

        <button
          style={{
            ...buttonStyle,
            ...(active === "wrongForm" ? activeButton : inactiveButton),
          }}
          onClick={() => setActive("wrongForm")}
        >
          Wrong Form
        </button>
      </div>

      {/* Conditional Component Rendering */}
      {active === "formCheck" && <Formcheck />}
      {active === "notFound" && <IdNotFound />}
      {active === "wrongForm" && <WrongForm />}
    </div>
  );
}

export default Madhuri;
