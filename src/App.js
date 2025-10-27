import "./App.css";

import Allroutes from "./Allroutes";
import { Link } from "react-router-dom";

function App() {
  const buttonStyle = {
    width: "20%",
    margin: "10px",
    padding: "6px 10px",
    textAlign: "center",
    textDecoration: "none",
    backgroundColor: "#007BFF",
    color: "white",
    border: "none",
    borderRadius: "8px",
    display: "inline-block",
    fontSize: "12px",
    cursor: "pointer",
  };
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "center" }}>
        <Link to="/" style={buttonStyle}>
          Id
        </Link>
        <Link to="/pending" style={buttonStyle}>
          Pending
        </Link>
        <Link to="/madhuri" style={buttonStyle}>
          Priyanka
        </Link>
        <Link to="/check" style={buttonStyle}>
          Madhuri
        </Link>
        <Link to="/seller" style={buttonStyle}>
          Seller
        </Link>
      </div>
      <Allroutes />
    </div>
  );
}

export default App;
