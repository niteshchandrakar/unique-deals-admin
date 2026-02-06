import React, { useState, useEffect } from "react";
import { gapi } from "gapi-script";

const CLIENT_ID =
  "937228397336-i07jo81e4e8os777rel1594n369ohnuk.apps.googleusercontent.com";

const API_KEY = "AIzaSyDScP5GlWBV1kA8k0cfLK6r7JvRHRqqOJU";

const DISCOVERY_DOC =
  "https://sheets.googleapis.com/$discovery/rest?version=v4";

const SCOPE = "https://www.googleapis.com/auth/spreadsheets";

const SHEET_ID = "1L9LJEj43C54zbd5AJ3HW_ETt0KW1JK6sIh6-jkQSLWQ";

function Akku() {
  const [searchNumber, setSearchNumber] = useState("");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [apiReady, setApiReady] = useState(false);

  // ✅ INIT GAPI HERE
  console.log(orders);
  useEffect(() => {
    function start() {
      gapi.client
        .init({
          apiKey: API_KEY,
          clientId: CLIENT_ID,
          discoveryDocs: [DISCOVERY_DOC],
          scope: SCOPE,
        })
        .then(() => {
          setApiReady(true);
        });
    }

    gapi.load("client:auth2", start);
  }, []);

  const fetchOrdersByWhatsapp = async () => {
    if (!apiReady) {
      alert("Google API loading...");
      return;
    }

    if (!searchNumber) {
      alert("Number daalo");
      return;
    }

    setLoading(true);

    try {
      const validPayments = ["pending", "hold", "seller given", ""];

      const response = await gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: "Sheet1!A2:N",
      });

      const rows = response.result.values || [];

      const matches = rows.filter((row) => {
        const whatsapp = row[3];
        const payment = (row[7] || "").toLowerCase();

        return whatsapp === searchNumber && validPayments.includes(payment);
      });
      console.log(matches, "m");

      const keys = [
        "order_id",
        "refund_form_date",
        "mediator",
        "whatsapp_number",
        "order_amount",
        "less_amount",
        "paid_amount",
        "payment",
        "notes",
        "form",
        "",
        "",
        "",
        "BrandName",
      ];

      const formattedOrders = matches.map((row) =>
        keys.reduce((acc, key, index) => {
          if (key) acc[key] = row[index] || "";
          return acc;
        }, {}),
      );

      setOrders(formattedOrders);
    } catch (err) {
      console.log("FULL ERROR:", err);
      alert(err.result?.error?.message || err.message);
    }

    setLoading(false);
  };

  return (
    <div>
      <h2>Search Orders By Whatsapp Number</h2>

      <input
        type="text"
        placeholder="Enter whatsapp number"
        value={searchNumber}
        onChange={(e) => setSearchNumber(e.target.value)}
      />

      <button onClick={fetchOrdersByWhatsapp}>Search</button>

      {loading && <p>Loading...</p>}

      {orders.length > 0 && (
        <table border="1">
          <thead>
            <tr>
              {Object.keys(orders[0]).map((key) => (
                <th key={key}>{key}</th>
              ))}
            </tr>
          </thead>

          <tbody>
            {orders.map((order, i) => (
              <tr key={i}>
                {Object.values(order).map((val, idx) => (
                  <td key={idx}>{val}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Akku;
