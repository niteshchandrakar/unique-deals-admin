import "./App.css";
import Admin from "./Admin";
import { useState } from "react";
import Pending from "./Pending";

function App() {
  const [toggle, setToggle] = useState(true);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "end" }}>
        <button
          style={{ width: "30%", margin: "10px" }}
          onClick={() => setToggle((prev) => !prev)}
        >
          {!toggle ? "Refund Updates" : "Pending Orders"}
        </button>
      </div>
      {toggle ? <Admin /> : <Pending />}
    </div>
  );
}

export default App;
