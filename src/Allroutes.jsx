import React from "react";
import { Route, Routes } from "react-router-dom";
import Admin from "./Admin";
import Pending from "./Pending";
import Madhuri from "./Madhuri";
import Formcheck from "./Formcheck";

function Allroutes() {
  return (
    <Routes>
      <Route path="/" element={<Admin />} />
      <Route path="/pending" element={<Pending />} />
      <Route path="/madhuri" element={<Madhuri />} />
      <Route path="/check" element={<Formcheck />} />
    </Routes>
  );
}

export default Allroutes;
