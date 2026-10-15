import { useEffect, useState, useCallback } from "react";
import med from ".././med";
import { useGoogleAuth, SHEET_ID, GoogleAuthButtons } from "../auth/GoogleAuth";

function IdNotFound() {
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
        range: "Sheet1!A2:M",
      });

      const rows = (response.result.values || []).map((row) => [
        ...row,
        ...Array(Math.max(0, 15 - row.length)).fill(""),
      ]);
      const filteredOrders = rows
        .filter(
          (row) =>
            row[2] === "nahi-mila" && (row[7] === "pending" || row[7] === ""),
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

    if (!isApiReady || !isAuthenticated || !gapi?.client?.sheets) {
      showModal("Google API ready nahi hai. Dobara try karein.");
      return;
    }

    setLoading(true);

    try {
      const response = await gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: "Sheet1!A2:M",
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
      const existingRow = rows[rowIndex];

      const updateResponse =
        await gapi.client.sheets.spreadsheets.values.update({
          spreadsheetId: SHEET_ID,
          range: `Sheet1!A${actualRowNumber}:I${actualRowNumber}`,
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
                existingRow[6] || "",
                orderData.payment || "",
                orderData.Notes || "",
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

  const openWhatsApp = (order) => {
    try {
      let phone = (order.Your_Whatsapp_Number || "")
        .toString()
        .replace(/\D/g, "");

      if (phone.startsWith("91") && phone.length === 12) {
        // Already has India's country code
      } else if (phone.length === 10) {
        phone = "91" + phone;
      }

      if (!phone) {
        showModal("WhatsApp number missing hai!");
        return;
      }

      const msg =
        `Namaste\n\n` +
        `Order ID: ${order.order_id}\n` +
        `Aapne is order ke details abhi tak share nahi kiye hain.\n` +
        `Kripya is order ka screenshot aur jis link se order kiya hai, wo bhej dijiye jisse payment process karne me problem na aaye.\n\n` +
        `Dhanyavaad`;

      const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;

      window.open(url, "_blank");
    } catch (error) {
      showModal("WhatsApp open karne me dikkat aa rahi hai.");
    }
  };

  return (
    <div style={{ padding: "2px", position: "relative" }}>
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
              <th>Whatsapp</th>
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
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(order.order_id);
                      showModal(order.order_id);
                      setClickedOrderId(order.order_id);
                    } catch (error) {
                      showModal("Order ID copy nahi ho paya.");
                    }
                  }}
                >
                  {order.order_id}
                </td>

                <td>
                  <select
                    value={order.Mediator || ""}
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

                <td>
                  <button onClick={() => openWhatsApp(order)}>
                    {order.Your_Whatsapp_Number}
                  </button>
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

export default IdNotFound;
