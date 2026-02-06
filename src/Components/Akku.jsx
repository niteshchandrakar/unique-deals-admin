import React, { useState, useEffect } from "react";
import { gapi } from "gapi-script";
import dayjs from "dayjs";

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
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {orders.length > 0 && (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              {orders.length > 0 && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  {orders.map((order, i) => {
                    const daysAgo = order.refund_form_date
                      ? dayjs().diff(dayjs(order.refund_form_date), "day")
                      : "-";

                    // payment badge color
                    const paymentColor =
                      order.payment === "pending"
                        ? "black"
                        : order.payment === "hold"
                          ? "red"
                          : order.payment === "cancel"
                            ? "red"
                            : order.payment === "seller given"
                              ? "#3ebaef"
                              : "black";

                    return (
                      <div
                        key={i}
                        style={{
                          border: "1px solid #ddd",
                          borderRadius: "10px",
                          padding: "12px",
                          boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                          background: "#fff",
                        }}
                      >
                        {/* ORDER ID */}
                        <div style={{ fontWeight: "bold", fontSize: "18px" }}>
                          {order.order_id}
                        </div>

                        {/* MEDIATOR */}
                        <div style={{ color: "#555", marginTop: "2px" }}>
                          👤 {order.mediator || "-"}
                        </div>

                        {/* DAYS AGO */}
                        <div
                          style={{
                            marginTop: "4px",
                            color: "red",
                            fontWeight: "bold",
                          }}
                        >
                          🔥 {daysAgo} days ago
                        </div>

                        <div
                          style={{
                            marginTop: "6px",
                            display: "inline-block",
                            background: paymentColor,
                            color: "#fff",
                            padding: "2px 8px",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: "bold",
                          }}
                        >
                          {order.payment ? order.payment : "pending"}
                        </div>

                        {/* AMOUNTS */}
                        <div
                          style={{
                            marginTop: "8px",
                            display: "flex",
                            gap: "12px",
                            flexWrap: "wrap",
                          }}
                        >
                          <span>
                            <strong>Order:</strong> ₹{order.order_amount || "0"}
                          </span>
                          <span>
                            <strong>Less:</strong> ₹{order.less_amount || "0"}
                          </span>
                          <span>
                            <strong>Paid:</strong> ₹{order.paid_amount || "0"}
                          </span>
                        </div>

                        {/* FORM VALUE */}
                        <div style={{ marginTop: "6px" }}>
                          <strong>Form:</strong> {order.form || "-"}
                        </div>

                        {/* NOTES */}
                        <div style={{ marginTop: "4px" }}>
                          <strong>Notes:</strong> {order.notes || "-"}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Akku;
