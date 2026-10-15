import { useEffect, useState, useCallback } from "react";
import {
  useGoogleAuth,
  SHEET_ID,
  GoogleAuthButtons,
} from "../../auth/GoogleAuth";

function Madhuri() {
  const { isApiReady, isAuthenticated, gapi } = useGoogleAuth();

  const [orders, setOrders] = useState([]);
  const [clickedOrderId, setClickedOrderId] = useState(null);

  const fetchOrders = useCallback(async () => {
    if (!isApiReady || !isAuthenticated || !gapi?.client?.sheets) {
      return;
    }

    try {
      const response = await gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: "Sheet1!A2:M",
      });

      const rows = response.result.values || [];

      const filteredOrders = rows
        .filter(
          (row) => row[7]?.toString().trim().toLowerCase() === "a complete",
        )
        .map((row) => ({
          order_id: row[0] || "",
          paid_amount: row[6] || "",
        }));

      setOrders(filteredOrders);
    } catch (error) {
      console.error("Error fetching data:", error);
      alert("Error fetching data: " + error.message);
    }
  }, [isApiReady, isAuthenticated, gapi]);

  useEffect(() => {
    if (isApiReady && isAuthenticated) {
      fetchOrders();
    }
  }, [isApiReady, isAuthenticated, fetchOrders]);

  const handleCopyOrderId = async (orderId) => {
    try {
      await navigator.clipboard.writeText(orderId);
      setClickedOrderId(orderId);
    } catch (error) {
      console.error("Copy failed:", error);
      setClickedOrderId(orderId);
    }
  };

  return (
    <div style={{ padding: "10px" }}>
      <h2>Completed Orders</h2>

      {!isAuthenticated ? (
        <GoogleAuthButtons />
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
              <tr key={`${order.order_id}-${index}`}>
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
                  onClick={() => handleCopyOrderId(order.order_id)}
                  title="Click to copy Order ID"
                >
                  {order.order_id}
                </td>

                <td>{order.paid_amount}</td>
              </tr>
            ))}

            {orders.length === 0 && (
              <tr>
                <td colSpan="3" style={{ textAlign: "center" }}>
                  No completed orders found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Madhuri;
