import React from "react";
import { Route, Routes } from "react-router-dom";
import Admin from "./Admin";
import Pending from "./Pending";
import Madhuri from "./Madhuri";

function Allroutes() {
  return (
    <Routes>
      <Route path="/" element={<Admin />} />
      <Route path="/pending" element={<Pending />} />
      <Route path="/madhuri" element={<Madhuri />} />
    </Routes>
  );
}

export default Allroutes;
