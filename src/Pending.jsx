import { useEffect, useState } from "react";
import { gapi } from "gapi-script";
import dayjs from "dayjs";

const CLIENT_ID =
  "937228397336-i07jo81e4e8os777rel1594n369ohnuk.apps.googleusercontent.com";
const API_KEY = "AIzaSyDScP5GlWBV1kA8k0cfLK6r7JvRHRqqOJU";
const SHEET_ID = "1L9LJEj43C54zbd5AJ3HW_ETt0KW1JK6sIh6-jkQSLWQ";
const DISCOVERY_DOC =
  "https://sheets.googleapis.com/$discovery/rest?version=v4";
const SCOPE = "https://www.googleapis.com/auth/spreadsheets";

function Pending() {
  const [mediator, setMediator] = useState("");
  const [orders, setOrders] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [copyMode, setCopyMode] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState({ mediator: "", type: "" });

  useEffect(() => {
    gapi.load("client:auth2", () => {
      gapi.client
        .init({
          apiKey: API_KEY,
          clientId: CLIENT_ID,
          discoveryDocs: [DISCOVERY_DOC],
          scope: SCOPE,
        })
        .then(() => {
          if (gapi.auth2.getAuthInstance().isSignedIn.get()) {
            setIsAuthenticated(true);
          }
        });
    });
  }, []);

  const handleLogin = async () => {
    try {
      await gapi.auth2.getAuthInstance().signIn();
      setIsAuthenticated(true);
    } catch (error) {
      alert("Login Error: " + error.message);
    }
  };

  const fetchOrders = async () => {
    if (!mediator) return alert("Enter Mediator Name");
    try {
      const response = await gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: "Sheet1!A2:M",
      });
      const rows = response.result.values || [];
      const filteredOrders = rows
        .filter(
          (row) =>
            row[2]?.toLowerCase() === mediator.toLowerCase() &&
            row[7]?.toLowerCase() !== "a complete"
        )
        .map((row) => ({
          order_id: row[0],
          refund_form_date: row[1],
          Notes: row[8],
          BrandName: row[12],
        }));
      if (filteredOrders.length === 0) {
        alert("check med name");
        setOrders([]);
      }
      setOrders(filteredOrders);
    } catch (error) {
      alert("Error fetching data: " + error.message);
    }
  };

  const formatDate = (dateStr) => dayjs(dateStr).format("D MMM");

  const copyToClipboard = () => {
    let textToCopy = "";
    const now = dayjs();

    let filtered = orders;

    if (
      copyMode === "olderThanMonth" ||
      copyMode === "olderThanMonthWithBrand"
    ) {
      filtered = orders.filter(
        (o) => now.diff(dayjs(o.refund_form_date), "month") >= 1
      );
    }

    if (copyMode === "full") {
      textToCopy = filtered
        .map(
          (o) =>
            `${o.order_id}\t\t${formatDate(o.refund_form_date)}\t\t${
              o.BrandName || ""
            }\n`
        )
        .join("\n");
    } else if (copyMode === "idAndDate") {
      textToCopy = filtered
        .map((o) => `${o.order_id}\t\t${formatDate(o.refund_form_date)}\n`)
        .join("\n");
    } else if (copyMode === "olderThanMonth") {
      textToCopy = filtered
        .map((o) => `${o.order_id}\t\t${formatDate(o.refund_form_date)}\n`)
        .join("\n");
    } else if (copyMode === "olderThanMonthWithBrand") {
      textToCopy = filtered
        .map(
          (o) =>
            `${o.order_id}\t\t${formatDate(o.refund_form_date)}\t\t${
              o.BrandName || ""
            }\n`
        )
        .join("\n");
    } else {
      alert("Please select a copy mode.");
      return;
    }

    navigator.clipboard.writeText(textToCopy.trim());
    setModalContent({ mediator: mediator, type: copyMode });
    setShowModal(true);

    setTimeout(() => {
      setShowModal(false);
    }, 2000);
  };

  return (
    <div style={{ padding: "10px" }}>
      <h1>Order Filter by Mediator</h1>
      {!isAuthenticated ? (
        <button onClick={handleLogin}>Login with Google</button>
      ) : (
        <>
          <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
            <select
              value={mediator}
              onChange={(e) => setMediator(e.target.value)}
            >
              <option value="">Select Mediator</option>
              {[
                "sumit ar",
                "mishba",
                "touch sky",
                "trisha",
                "rohit",
                "anshul",
                "kkb",
                "subroo",
                "naaz",
              ].map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>

            <button style={{ width: "30%" }} onClick={fetchOrders}>
              Fetch Orders
            </button>
          </div>

          <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
            <select
              value={copyMode}
              onChange={(e) => setCopyMode(e.target.value)}
            >
              <option value="">Select Copy Mode</option>
              <option value="full">Order ID + Refund Date + Brand</option>
              <option value="idAndDate">Order ID + Refund Date</option>
              <option value="olderThanMonth">
                Order ID + Refund Date (Older than 1 month)
              </option>
              <option value="olderThanMonthWithBrand">
                Order ID + Refund Date + Brand (Older than 1 month)
              </option>
            </select>

            <button onClick={copyToClipboard}>Copy</button>
          </div>

          <table border="1">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Refund Date</th>
                <th>Notes</th>
                <th>BrandName</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order, index) => (
                <tr key={index}>
                  <td>{order.order_id}</td>
                  <td>{formatDate(order.refund_form_date)}</td>
                  <td>{order.Notes}</td>
                  <td>{order.BrandName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
      {showModal && (
        <div
          style={{
            position: "fixed",
            bottom: "20px",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "#333",
            color: "#fff",
            padding: "12px 24px",
            borderRadius: "8px",
            boxShadow: "0 4px 10px rgba(0, 0, 0, 0.3)",
            zIndex: 1000,
            fontSize: "14px",
          }}
        >
          Copied! Mediator: <strong>{modalContent.mediator}</strong> | Type:{" "}
          <strong>{modalContent.type}</strong>
        </div>
      )}
    </div>
  );
}

export default Pending;
