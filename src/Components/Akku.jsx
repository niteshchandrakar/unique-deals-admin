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
  const [modalMessage, setModalMessage] = useState("");

  const showModal = (message) => {
    setModalMessage(message);
    setTimeout(() => setModalMessage(""), 3000);
  };

  // INIT GOOGLE API
  useEffect(() => {
    function start() {
      gapi.client
        .init({
          apiKey: API_KEY,
          clientId: CLIENT_ID,
          discoveryDocs: [DISCOVERY_DOC],
          scope: SCOPE,
        })
        .then(() => setApiReady(true));
    }
    gapi.load("client:auth2", start);
  }, []);

  // FETCH ORDERS
  const fetchOrdersByWhatsapp = async () => {
    if (!apiReady) return alert("Google API loading...");
    if (!searchNumber) return alert("Number daalo");

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
      console.log(err);
      alert("Fetch error");
    }

    setLoading(false);
  };

  // UPDATE ORDER
  const handleUpdateOrder = async (order) => {
    try {
      const response = await gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: "Sheet1!A2:A",
      });

      const rows = response.result.values || [];

      const rowIndex = rows.findIndex((row) => row[0] === order.order_id);

      if (rowIndex === -1) return alert("Order id ni mila");

      const actualRowNumber = rowIndex + 2;

      await gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `Sheet1!E${actualRowNumber}:I${actualRowNumber}`,
        valueInputOption: "USER_ENTERED",
        resource: {
          values: [
            [
              order.order_amount,
              order.less_amount,
              "",
              order.payment,
              order.notes,
            ],
          ],
        },
      });

      showModal("✅ Update ho gaya 🔥");
    } catch (err) {
      console.log(err);
      alert("Update error");
    }
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

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {orders.map((order, i) => {
          const daysAgo = order.refund_form_date
            ? dayjs().diff(dayjs(order.refund_form_date), "day")
            : "-";

          return (
            <div
              key={i}
              style={{
                border: "1px solid #ddd",
                borderRadius: "10px",
                padding: "12px",
              }}
            >
              <b
                style={{
                  cursor: "pointer",
                  userSelect: "none",
                  color: "#007bff",
                }}
                onClick={() => {
                  navigator.clipboard.writeText(order.order_id);

                  // 👇 same modal use karo
                  showModal(`${order.order_id}`);
                }}
              >
                {order.order_id}
              </b>

              <div style={{ display: "flex", justifyContent: "space-around" }}>
                <div>👤 {order.mediator}</div>

                <div>🔥 {daysAgo} days ago</div>
              </div>

              <div style={{ display: "flex" }}>
                <p>Payment:</p>
                <select
                  value={order.payment}
                  onChange={(e) => {
                    const updated = [...orders];
                    updated[i].payment = e.target.value;
                    setOrders(updated);
                  }}
                >
                  <option value="">pending</option>
                  <option value="me given">me given</option>
                  <option value="cancel">cancel</option>
                  <option value="a complete"> a complete</option>
                </select>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: "8px",
                  alignItems: "center",
                  marginTop: "8px",
                }}
              >
                {/* Headers */}
                <div style={labelStyle}>Order Am</div>
                <div style={labelStyle}>Less</div>
                <div style={labelStyle}>Paid</div>

                {/* Inputs */}
                <input
                  style={inputStyle}
                  value={order.order_amount}
                  onChange={(e) => {
                    const updated = [...orders];
                    updated[i].order_amount = e.target.value;
                    setOrders(updated);
                  }}
                />

                <input
                  style={inputStyle}
                  value={order.less_amount}
                  onChange={(e) => {
                    const updated = [...orders];
                    updated[i].less_amount = e.target.value;
                    setOrders(updated);
                  }}
                />

                <input
                  style={inputStyle}
                  value={order.paid_amount}
                  onChange={(e) => {}}
                />
              </div>

              <div
                style={{
                  marginTop: "5px",
                  display: "flex",
                  justifyContent: "space-around",
                }}
              >
                <textarea
                  value={order.notes}
                  onChange={(e) => {
                    const updated = [...orders];
                    updated[i].notes = e.target.value;
                    setOrders(updated);
                  }}
                />
                <div
                  style={{
                    padding: "6px 10px",
                    borderRadius: "8px",
                    color: "#fff",
                    fontWeight: "600",
                    fontSize: "13px",
                    display: "inline-block",
                    background:
                      order.form?.toLowerCase() === "ok"
                        ? "#28a745"
                        : order.form?.toLowerCase() === "not access"
                          ? "#007bff"
                          : order.form?.toLowerCase() === "wrong"
                            ? "#dc3545"
                            : "#999",
                  }}
                >
                  form: {order.form}
                </div>
              </div>

              <button onClick={() => handleUpdateOrder(order)}>Update</button>
            </div>
          );
        })}
      </div>
      {modalMessage && (
        <div
          style={{
            position: "fixed",
            top: "80px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "#111",
            color: "#fff",
            padding: "12px 18px",
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
            fontSize: "14px",
            zIndex: 9999,
            animation: "fadeInUp 0.3s ease",
            maxWidth: "90%",
            textAlign: "center",
          }}
        >
          {modalMessage}
        </div>
      )}
    </div>
  );
}

export default Akku;
const labelStyle = {
  fontSize: "12px",
  fontWeight: "600",
  color: "#555",
};

const inputStyle = {
  width: "50px",
  padding: "10px",
  borderRadius: "8px",
  border: "1px solid #ddd",
};
