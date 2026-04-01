import { useEffect, useState } from "react";
import { gapi } from "gapi-script";

const CLIENT_ID =
  "937228397336-i07jo81e4e8os777rel1594n369ohnuk.apps.googleusercontent.com";
const API_KEY = "AIzaSyDScP5GlWBV1kA8k0cfLK6r7JvRHRqqOJU";
const SHEET_ID = "1L9LJEj43C54zbd5AJ3HW_ETt0KW1JK6sIh6-jkQSLWQ";
const DISCOVERY_DOC =
  "https://sheets.googleapis.com/$discovery/rest?version=v4";
const SCOPE = "https://www.googleapis.com/auth/spreadsheets";

function Madhuri() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [orders, setOrders] = useState([]);
  const [clickedOrderId, setClickedOrderId] = useState(null);
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

      const filteredOrders = rows
        .filter((row) => row[7]?.toLowerCase() === "a complete") // payment column
        .map((row) => ({
          order_id: row[0],
          paid_amount: row[6],
        }));

      setOrders(filteredOrders);
    } catch (error) {
      alert("Error fetching data: " + error.message);
    }
  };

  useEffect(() => {
    if (isAuthenticated) fetchOrders();
  }, [isAuthenticated]);

  return (
    <div style={{ padding: "10px" }}>
      <h2>Completed Orders</h2>

      {!isAuthenticated ? (
        <button onClick={handleLogin}>Login with Google</button>
      ) : (
        <table border="1" style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead>
            <tr>
              <th>S.No</th>
              <th>Order ID</th>
              <th>Paid Amount</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order, index) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td
                  style={{
                    cursor: "pointer",

                    background:
                      order.order_id === clickedOrderId
                        ? "rgba(0, 4, 255, 0.75)"
                        : "transparent",
                    transition: "all 0.3s ease",
                  }}
                  onClick={() => {
                    navigator.clipboard.writeText(order.order_id); // optional copy
                    setClickedOrderId(order.order_id);
                  }}
                >
                  {order.order_id}
                </td>
                <td>{order.paid_amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Madhuri;
