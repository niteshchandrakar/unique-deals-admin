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
const mediatorSheets = {
  kkb: "https://docs.google.com/spreadsheets/d/18sMm_snwml5VmSdA9q2yGV5Dbb1z0Ot7Fu0JcLI61TA",
  "Prince BGM":
    "https://docs.google.com/spreadsheets/d/1QNWPDoLSOzUTKZDeci3KkV_vAJoL98xge6TjTcV8Nes",
  "touch sky":
    "https://docs.google.com/spreadsheets/d/1y_RKdwUM7Pk3iFxGdI-hq2fZqFTquJ9HRF0PfcMuLCQ",
  anshul:
    "https://docs.google.com/spreadsheets/d/1WDsXaHTXNZPMQrAXfQ0Q8lPjzh2mAhLXhcHTAs81aVQ",
  naaz: "https://docs.google.com/spreadsheets/d/1dw1f8c5-FczgudaaerDGHVd7BzfQsj7avL10EuHNoBQ",
  "brand boosters":
    "https://docs.google.com/spreadsheets/d/1VhOScFOa5D7PsGZZ9Agg9q8-g76GxM5qiK-DZIjr-NI",
  manish:
    "https://docs.google.com/spreadsheets/d/1Z_WgxnlEq7f94wF2R-nGVWZzaSawA6BSfvvQ8QeOYSU",
  adf: "https://docs.google.com/spreadsheets/d/1vHktKwrl3SFdMk2Rqb2s6vL-fpAIV9KkoKjxl3LBJ0U",

  "med 25":
    "https://docs.google.com/spreadsheets/d/1q05QmnAefZSOxccHUV-AI9-WoWS18yNWN1Ufk6A_6NU/edit?resourcekey=&gid=1302446889#gid=1302446889",
  nikhil:
    "https://docs.google.com/spreadsheets/d/17WkWvQU4xEcwGvmv4TpU6_GxyIjnUYCpkimIjSlQ7cg",
  kiwi: "https://docs.google.com/spreadsheets/d/1xooDggsPQ9vjWeN2QqTuqZFhkPiF6NVmdpoKmCFfeXQ",
  dabang:
    "https://docs.google.com/spreadsheets/d/1kYQNydb_ve5gdvrpKfqW6OO-SoggpLB4_OS8T880diM",
  cc: "https://docs.google.com/spreadsheets/d/1ciRRjdN_0QEJTmeqL62qkJs_IRP8LxC2KNMgGXCvSn8",
  bgm: "https://docs.google.com/spreadsheets/d/1QNWPDoLSOzUTKZDeci3KkV_vAJoL98xge6TjTcV8Nes/edit?gid=1890964206#gid=1890964206",
};

function Akku() {
  const [searchNumber, setSearchNumber] = useState("");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [apiReady, setApiReady] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  const showModal = (message) => {
    setModalMessage(message);
    setTimeout(() => setModalMessage(""), 2000);
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

      showModal("✅ Update ho gaya");
    } catch (err) {
      console.log(err);
      alert("Update error");
    }
  };

  return (
    <div style={containerStyle}>
      {/* HEADER */}
      <div style={headerStyle}>
        <div style={searchBox}>
          <div style={{ position: "relative", flex: 1 }}>
            <input
              type="text"
              placeholder="Enter whatsapp number"
              value={searchNumber}
              onChange={(e) => setSearchNumber(e.target.value)}
              style={searchInput}
            />

            {/* PASTE BUTTON */}

            {/* CLEAR BUTTON (only if value exists) */}
            {searchNumber ? (
              <button
                onClick={() => setSearchNumber("")}
                style={{
                  position: "absolute",
                  right: "0px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  border: "none",
                  background: "#ff4d4f",
                  color: "#fff",
                  padding: "5px 8px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "12px",
                  width: "25px",
                }}
              >
                ✕
              </button>
            ) : (
              <button
                onClick={async () => {
                  const text = await navigator.clipboard.readText();
                  setSearchNumber(text);
                }}
                style={{
                  position: "absolute",
                  right: "0px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  border: "none",
                  background: "#d6dec3",
                  color: "#fff",
                  padding: "5px 8px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "12px",
                  width: "30px",
                }}
              >
                📋
              </button>
            )}
          </div>

          <button onClick={fetchOrdersByWhatsapp} style={searchBtn}>
            🔍
          </button>
        </div>
      </div>

      {loading && <p style={{ textAlign: "center" }}>Loading...</p>}

      <div style={cardWrapper}>
        {orders.map((order, i) => {
          const daysAgo = order.refund_form_date
            ? dayjs().diff(dayjs(order.refund_form_date), "day")
            : "-";

          return (
            <div key={i} style={card}>
              <div style={rowBetween}>
                <b
                  style={orderId}
                  onClick={() => {
                    navigator.clipboard.writeText(order.order_id);
                    showModal(order.order_id);
                  }}
                >
                  {order.order_id}
                </b>

                <span style={daysBadge}>🔥 {daysAgo}d</span>
              </div>

              <div style={rowBetween}>
                <span style={{ width: "150px" }}>👤 {order.mediator}</span>
                {mediatorSheets[order.mediator] && (
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(order.order_id);
                      window.open(mediatorSheets[order.mediator], "_blank");
                    }}
                    style={{
                      background: "#34a853",
                      border: "none",
                      color: "#fff",
                      padding: "5px 2px",
                      borderRadius: "10px",
                      width: "100px",
                      fontSize: "10px",
                    }}
                  >
                    Sheet
                  </button>
                )}

                <select
                  value={order.payment}
                  style={selectStyle}
                  onChange={(e) => {
                    const updated = [...orders];
                    updated[i].payment = e.target.value;
                    setOrders(updated);
                  }}
                >
                  <option value="">pending</option>
                  <option value="me given">me given</option>
                  <option value="cancel">cancel</option>
                  <option value="a complete">complete</option>
                </select>
              </div>

              <div style={amountGrid}>
                <input
                  placeholder="Order"
                  style={inputMobile}
                  value={order.order_amount}
                  onChange={(e) => {
                    const updated = [...orders];
                    updated[i].order_amount = e.target.value;
                    setOrders(updated);
                  }}
                />

                <input
                  placeholder="Less"
                  style={inputMobile}
                  value={order.less_amount}
                  onChange={(e) => {
                    const updated = [...orders];
                    updated[i].less_amount = e.target.value;
                    setOrders(updated);
                  }}
                />

                <input
                  placeholder="Paid"
                  style={inputMobile}
                  value={order.paid_amount}
                  readOnly
                />
              </div>

              <textarea
                placeholder="Notes..."
                style={textareaStyle}
                value={order.notes}
                onChange={(e) => {
                  const updated = [...orders];
                  updated[i].notes = e.target.value;
                  setOrders(updated);
                }}
              />

              <div style={rowBetween}>
                <div style={formBadge(order.form)}>form: {order.form}</div>

                <button
                  onClick={() => handleUpdateOrder(order)}
                  style={updateBtn}
                >
                  Update
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {modalMessage && <div style={toast}>{modalMessage}</div>}
    </div>
  );
}

export default Akku;

/* ================== STYLES ================== */

const containerStyle = {
  padding: "12px",
  background: "#f4f6f8",
  minHeight: "100vh",
};

const headerStyle = {
  position: "sticky",
  top: 0,
  background: "#fff",
  paddingBottom: "10px",
  zIndex: 10,
};

const searchBox = {
  display: "flex",
  gap: "8px",
  marginTop: "8px",
};

const searchInput = {
  flex: 1,
  padding: "14px",
  borderRadius: "12px",
  border: "1px solid #ddd",
  fontSize: "16px",
  width: "200px",
};

const searchBtn = {
  padding: "14px 18px",
  borderRadius: "12px",
  border: "none",
  background: "#000",
  color: "#fff",
  fontSize: "16px",
};

const cardWrapper = {
  display: "flex",
  flexDirection: "column",
  gap: "12px",
  marginTop: "10px",
};

const card = {
  background: "#fff",
  padding: "14px",
  borderRadius: "16px",
  boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
};

const rowBetween = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "10px",
};

const orderId = {
  fontSize: "15px",
  color: "#007bff",
  cursor: "pointer",
};

const daysBadge = {
  background: "#000",
  color: "#fff",
  padding: "4px 10px",
  borderRadius: "20px",
  fontSize: "12px",
};

const amountGrid = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr 1fr",
  gap: "8px",
};

const inputMobile = {
  padding: "12px",
  borderRadius: "10px",
  border: "1px solid #ddd",
};

const textareaStyle = {
  width: "100%",
  marginTop: "10px",
  padding: "12px",
  borderRadius: "12px",
  border: "1px solid #ddd",
};

const selectStyle = {
  padding: "8px",
  borderRadius: "8px",
};

const updateBtn = {
  background: "#000000",
  border: "none",
  color: "#fff",
  padding: "10px 16px",
  borderRadius: "10px",
  width: "150px",
};

const formBadge = (form) => ({
  background:
    form?.toLowerCase() === "ok"
      ? "#28a745"
      : form?.toLowerCase() === "not access"
        ? "#007bff"
        : form?.toLowerCase() === "wrong"
          ? "#dc3545"
          : "#999",
  color: "#fff",
  padding: "8px 10px",
  borderRadius: "10px",
  width: "120px",
});

const toast = {
  position: "fixed",
  top: "150px",
  left: "50%",
  transform: "translateX(-50%)",
  background: "#000",
  color: "#fff",
  padding: "10px 16px",
  borderRadius: "12px",
};
