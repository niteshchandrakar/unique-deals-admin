import { useEffect, useState, useCallback } from "react";
import med from "./med";
import { useGoogleAuth, SHEET_ID, GoogleAuthButtons } from "./auth/GoogleAuth";

function Priyanka() {
  const { isApiReady, isAuthenticated, gapi } = useGoogleAuth();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [clickedOrderId, setClickedOrderId] = useState(null);

  const showModal = (message) => {
    setModalMessage(message);
    setTimeout(() => setModalMessage(""), 3000);
  };

  const fetchOrders = useCallback(async () => {
    if (!isApiReady || !isAuthenticated || !gapi?.client?.sheets) {
      return;
    }

    try {
      const response = await gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: "Sheet1!A2:O",
      });

      const rows = response.result.values || [];
      const seenOrderIds = new Set();

      const filteredOrders = rows
        .filter((row) => {
          if (seenOrderIds.has(row[0])) {
            return false;
          }

          seenOrderIds.add(row[0]);
          return true;
        })
        .filter((row) => row[2] === "")
        .filter(
          (row) =>
            row[7] === "" || row[7] === "pending" || row[7] === "me given",
        )
        .map((row) => ({
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
          buyerRemark: row[10],
          timeline: row[11],
          BrandName: row[12],
        }));

      setOrders(filteredOrders);
    } catch (error) {
      alert("Error fetching data: " + error.message);
    }
  }, [isApiReady, isAuthenticated, gapi]);

  useEffect(() => {
    if (isApiReady && isAuthenticated) {
      fetchOrders();
    }
  }, [isApiReady, isAuthenticated, fetchOrders]);

  const handleChange = (index, field, value) => {
    setOrders((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: value,
      };
      return updated;
    });
  };

  const handleUpdateOrder = async (orderData) => {
    if (!orderData) return;

    if (orderData.Mediator !== "nahi-mila" && orderData.order_amount === "") {
      return alert("enter order amount");
    }

    if (!isApiReady || !isAuthenticated || !gapi?.client?.sheets) {
      return showModal("Google API ready nahi hai. Dobara try karein.");
    }

    setLoading(true);

    try {
      const response = await gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: "Sheet1!A2:A",
      });

      const rows = response.result.values || [];

      if (!rows.length) {
        showModal("No data found.");
        return;
      }

      const rowIndex = rows.findIndex(
        (row) => row[0]?.toString() === orderData.order_id?.toString(),
      );

      if (rowIndex === -1) {
        showModal("Order ID नहीं मिला ❌❌");
        return;
      }

      const actualRowNumber = rowIndex + 2;

      const updateResponse =
        await gapi.client.sheets.spreadsheets.values.update({
          spreadsheetId: SHEET_ID,
          range: `Sheet1!A${actualRowNumber}:M${actualRowNumber}`,
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
                orderData.paid_amount || "",
                orderData.payment || "",
                orderData.Notes || orderData.notes || "",
                orderData.form || "",
                orderData.buyerRemark || "",
                orderData.timeline || "",
                orderData.BrandName || "",
              ],
            ],
          },
        });

      if (updateResponse.status === 200) {
        showModal("✅ Data update हो गया!");
        await fetchOrders();
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
        <GoogleAuthButtons />
      ) : (
        <table border="1" style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Mediator</th>
              <th>Amount</th>
              <th>90 day</th>
              <th>Update</th>
            </tr>
          </thead>

          <tbody>
            {orders.map((order, index) => (
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
                </td>

                <td>
                  <select
                    value={order.Mediator}
                    onChange={(e) =>
                      handleChange(index, "Mediator", e.target.value)
                    }
                  >
                    <option value="">Select Mediator</option>

                    {med.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </td>

                <td style={{ maxWidth: "40px" }}>
                  <input
                    style={{ maxWidth: "35px" }}
                    type="text"
                    value={order.order_amount ?? ""}
                    onChange={(e) =>
                      handleChange(index, "order_amount", e.target.value)
                    }
                  />
                </td>

                <td>
                  <select
                    value={order.timeline || "no"}
                    onChange={(e) =>
                      handleChange(index, "timeline", e.target.value)
                    }
                  >
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
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

export default Priyanka;
