import { useEffect, useState } from "react";
import { gapi } from "gapi-script";

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
        range: "Sheet1!A2:I",
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

  return (
    <div style={{ padding: "10px" }}>
      <h1>Order Filter by Mediator</h1>
      {!isAuthenticated ? (
        <button onClick={handleLogin}>Login with Google</button>
      ) : (
        <>
          <div style={{ display: "flex", gap: "10px" }}>
            <input
              style={{ width: "70%" }}
              type="text"
              placeholder="Enter Mediator Name"
              value={mediator}
              onChange={(e) => setMediator(e.target.value)}
            />
            <button style={{ width: "30%" }} onClick={fetchOrders}>
              Fetch Orders
            </button>
          </div>

          <table border="1">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Refund Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order, index) => (
                <tr key={index}>
                  <td>{order.order_id}</td>
                  <td>{order.refund_form_date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}

export default Pending;
