import React from "react";
import { Route, Routes } from "react-router-dom";
import Admin from "../Admin";
import Pending from "./Pending";
import Priyanka from "../Priyanka";
import SellerUpdate from "./SellerUpdate";
import Madhuri from "../Madhuri";

function Allroutes() {
  return (
    <Routes>
      <Route path="/" element={<Admin />} />
      <Route path="/pending" element={<Pending />} />
      <Route path="/priyanka" element={<Priyanka />} />
      <Route path="/madhuri" element={<Madhuri />} />
      <Route path="/seller" element={<SellerUpdate />} />
    </Routes>
  );
}

export default Allroutes;
