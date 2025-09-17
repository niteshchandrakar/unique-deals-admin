import { useEffect, useState } from "react";
import { gapi } from "gapi-script";
import dayjs from "dayjs";
import EditModal from "./EditModal";
import med from "./med";
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
  const [showEditModal, setShowEditModal] = useState(false);
  const [EditId, setEditID] = useState(null);
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
      const CURRENT_YEAR = new Date().getFullYear();
      const filteredOrders = rows
        .filter(
          (row) =>
            (mediator.toLowerCase() === "all mediator" ||
              row[2]?.toLowerCase() === mediator.toLowerCase()) &&
            row[7]?.toLowerCase() !== "a complete" &&
            row[7]?.toLowerCase() !== "cancel" &&
            row[7]?.toLowerCase() !== "hold"
        )

        .sort((a, b) => {
          const parse = (dateStr) =>
            dayjs(
              dateStr,
              ["D/M/YYYY", "M/D/YYYY", "D MMM", "D MMMM"],
              true
            ).isValid()
              ? dayjs(
                  dateStr,
                  ["D/M/YYYY", "M/D/YYYY", "D MMM", "D MMMM"],
                  true
                ).year(CURRENT_YEAR)
              : dayjs("1900-01-01");
          return parse(a[1]).unix() - parse(b[1]).unix();
        })
        .map((row) => ({
          order_id: row[0],
          refund_form_date: dayjs(
            row[1],
            ["D/M/YYYY", "M/D/YYYY", "D MMM", "D MMMM"],
            true
          ).isValid()
            ? dayjs(row[1], ["D/M/YYYY", "M/D/YYYY", "D MMM", "D MMMM"], true)
                .year(CURRENT_YEAR)
                .format("YYYY-MM-DD")
            : "1900-01-01",
          Notes: row[8],
          payment: row[7] || "",
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
              {med.map((opt) => (
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
                <th>payment</th>
                {/* <th>Brand</th> */}
              </tr>
            </thead>
            <tbody>
              {orders.map((order, index) => (
                <tr key={index}>
                  <td style={{ minWidth: "150px" }}>
                    {order.order_id}{" "}
                    <span
                      onClick={() => {
                        setEditID(order.order_id);
                        setShowEditModal(true);
                      }}
                      style={{ marginLeft: "6px", cursor: "pointer" }}
                    >
                      ✏️
                    </span>
                  </td>
                  <td>{formatDate(order.refund_form_date)}</td>
                  <td>{order.Notes}</td>
                  <td>{order.payment}</td>
                  {/* <td>{order.BrandName}</td> */}
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
      {showEditModal && (
        <EditModal
          setShowEditModal={setShowEditModal}
          fetchOrders={fetchOrders}
          searchId={EditId}
        />
      )}
    </div>
  );
}

export default Pending;
