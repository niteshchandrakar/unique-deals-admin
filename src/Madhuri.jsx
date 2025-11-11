import React, { useState } from "react";
import Formcheck from "./Components/Formcheck";
import IdNotFound from "./Components/IdNotFound";

function Madhuri() {
  const [active, setActive] = useState("formCheck"); // default selected

  const buttonStyle = {
    width: "120px",
    margin: "10px",
    padding: "8px 12px",
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
    <div style={{ textAlign: "center", marginTop: "20px" }}>
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
      </div>

      {/* Conditional Text */}
      {active === "formCheck" ? <Formcheck /> : <IdNotFound />}
    </div>
  );
}

export default Madhuri;
