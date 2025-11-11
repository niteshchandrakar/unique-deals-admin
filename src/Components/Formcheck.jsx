import { useEffect, useState } from "react";
import { gapi } from "gapi-script";
import dayjs from "dayjs";
import med from "../med";
const CLIENT_ID =
  "937228397336-i07jo81e4e8os777rel1594n369ohnuk.apps.googleusercontent.com";
const API_KEY = "AIzaSyDScP5GlWBV1kA8k0cfLK6r7JvRHRqqOJU";
const SHEET_ID = "1L9LJEj43C54zbd5AJ3HW_ETt0KW1JK6sIh6-jkQSLWQ";
const DISCOVERY_DOC =
  "https://sheets.googleapis.com/$discovery/rest?version=v4";
const SCOPE = "https://www.googleapis.com/auth/spreadsheets";

function Formcheck() {
  const [mediator, setMediator] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [clickedOrderId, setClickedOrderId] = useState(null);

  const showModal = (message) => {
    setModalMessage(message);
    setTimeout(() => setModalMessage(""), 3000);
  };
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
    try {
      const response = await gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: "Sheet1!A2:M",
      });

      const rows = response.result.values || [];
      // const today = dayjs();
      const filteredOrders = rows
        .filter((row) => row[2] === mediator.toLowerCase())

        .filter((row) => row[9] === "")
        .filter((row) => {
          const refundDate = dayjs(row[1], "M/D/YYYY"); // refund date (format: mm/dd/yyyy)
          const cutoffDate = dayjs("09/01/2025", "MM/DD/YYYY"); // fixed date: 1 September 2025
          const today = dayjs(); // current date

          // difference between today and refund date in days
          const diffInDays = today.diff(refundDate, "day");

          // condition: date should be after cutoffDate and at least 4 days old
          return refundDate.isAfter(cutoffDate) && diffInDays >= 4;
        })
        .map((row, idx) => ({
          order_id: row[0],
          refund_form_date: row[1],
          Mediator: row[2],
          Your_Whatsapp_Number: row[3],
          order_amount: row[4],
          Less_amount: row[5],
          paid_amount: row[6],
          payment: row[7],
          Notes: row[8],
          form: row[9],
          BrandName: row[12],
        }));

      setOrders(filteredOrders);
    } catch (error) {
      alert("Error fetching data: " + error.message);
    }
  };

  const handleChange = (index, field, value) => {
    setOrders((prev) => {
      const updated = [...prev];
      updated[index][field] = value;
      return updated;
    });
  };

  const handleUpdateOrder = async (orderData) => {
    if (!orderData) return;

    setLoading(true); // You should define setIsLoading and alert in your component
    try {
      const response = await gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: "Sheet1!A2:A", // Only fetching Order IDs
      });

      const rows = response.result.values;
      if (!rows) return alert("No data found.");

      const rowIndex = rows.findIndex(
        (row) => row[0]?.toString() === orderData.order_id?.toString()
      );
      if (rowIndex === -1) return alert("Order ID नहीं मिला ❌❌");

      const actualRowNumber = rowIndex + 2; // Adding 2 because rows start at A2

      const updateResponse =
        await gapi.client.sheets.spreadsheets.values.update({
          spreadsheetId: SHEET_ID,
          range: `Sheet1!A${actualRowNumber}:J${actualRowNumber}`, // Use backticks for template string
          valueInputOption: "USER_ENTERED",
          resource: {
            values: [
              [
                orderData.order_id || "",
                orderData.refund_form_date || "",
                orderData.Mediator || "",
                orderData.Your_Whatsapp_Number || "",
                orderData.order_amount || "",
                orderData.Less_amount || "",
                "", // paid_amount left blank as per your code
                orderData.payment || "",
                orderData.notes || "",
                orderData.form || "",
              ],
            ],
          },
        });

      if (updateResponse.status === 200) {
        showModal("✅ Data update हो गया!");
      } else {
        showModal("⚠️ कुछ problem है, Nitesh को message कर लो");
      }
    } catch (error) {
      showModal("❌ Error: Nitesh को message करो - " + error.message);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div style={{ padding: "10px", position: "relative" }}>
      <h1>Order Filter by Mediator</h1>
      <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
        <select value={mediator} onChange={(e) => setMediator(e.target.value)}>
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
      {loading && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.4)",
            zIndex: 999,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            color: "#fff",
            fontSize: "24px",
            fontWeight: "bold",
          }}
        >
          Updating...
        </div>
      )}

      {!isAuthenticated ? (
        <button onClick={handleLogin}>Login with Google</button>
      ) : (
        <table border="1" style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Form</th>
              <th>Amount</th>
              {/* <th>Update</th> */}
            </tr>
          </thead>
          <tbody>
            {orders
              // .filter((order) => order.Mediator === mediator)
              .map((order, index) => (
                <tr key={index}>
                  <td
                    style={{
                      maxWidth: "50px",
                      cursor: "pointer",
                      border:
                        order.order_id === clickedOrderId
                          ? "2px solid red"
                          : "1px solid #ccc",
                      background:
                        order.order_id === clickedOrderId
                          ? "rgba(255,0,0,0.1)"
                          : "transparent",
                      transition: "all 0.3s ease",
                    }}
                    onClick={() => {
                      navigator.clipboard.writeText(order.order_id);
                      showModal(order.order_id);
                      setClickedOrderId(order.order_id);
                    }}
                  >
                    {order.order_id}
                    <div> {dayjs(order.refund_form_date).format("DD-MMM")}</div>
                  </td>
                  <td>
                    <select
                      value={order.form}
                      onChange={(e) =>
                        handleChange(index, "form", e.target.value)
                      }
                    >
                      <option value="">Status</option>
                      <option value="ok">Ok</option>
                      <option value="wrong">Wrong</option>
                      <option value="notaccess">Not Access</option>
                    </select>
                  </td>
                  <td style={{ maxWidth: "60px" }}>
                    <input
                      style={{ maxWidth: "45px" }}
                      type="text"
                      value={order.order_amount}
                      onChange={(e) =>
                        handleChange(index, "order_amount", e.target.value)
                      }
                    />
                  </td>
                  <td>
                    <button onClick={() => handleUpdateOrder(order)}>
                      Update
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      )}
      {modalMessage && <div className="modal">{modalMessage}</div>}
    </div>
  );
}

export default Formcheck;
