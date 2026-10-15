import { useEffect, useState, useCallback } from "react";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { useGoogleAuth, SHEET_ID, GoogleAuthButtons } from "../auth/GoogleAuth";

dayjs.extend(customParseFormat);

function WrongForm() {
  const { isApiReady, isAuthenticated, gapi } = useGoogleAuth();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [clickedOrderId, setClickedOrderId] = useState(null);

  const showModal = (message) => {
    setModalMessage(message);
    setTimeout(() => setModalMessage(""), 3000);
  };

  const parseSheetDate = (date) => {
    if (!date) return dayjs("");

    return dayjs(date, ["M/D/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"], true);
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

      const rows = response.result.values || [];

      const cutoffDate = dayjs("09/01/2025", "MM/DD/YYYY", true);
      const today = dayjs();

      const filteredOrders = rows
        .filter((row) => row[9] === "wrong")
        .filter((row) => {
          const refundDate = parseSheetDate(row[1]);

          if (!refundDate.isValid()) return false;

          const diffInDays = today.diff(refundDate, "day");

          return refundDate.isAfter(cutoffDate) && diffInDays >= 4;
        })
        .map((row) => ({
          order_id: row[0] || "",
          refund_form_date: row[1] || "",
          Mediator: row[2] || "",
          Your_Whatsapp_Number: row[3] || "",
          order_amount: row[4] || "",
          Less_amount: row[5] || "",
          paid_amount: row[6] || "",
          payment: row[7] || "",
          Notes: row[8] || "",
          form: row[9] || "",
          buyerRemark: row[10] || "",
          timeline: row[11] || "",
          BrandName: row[12] || "",
        }));

      setOrders(filteredOrders);
    } catch (error) {
      alert("Error fetching data: " + error.message);
    }
  }, [isApiReady, isAuthenticated, gapi]);

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
                existingRow[6] || "",
                orderData.payment || "",
                orderData.Notes || "",
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

  useEffect(() => {
    if (isApiReady && isAuthenticated) {
      fetchOrders();
    }
  }, [isApiReady, isAuthenticated, fetchOrders]);

  return (
    <div style={{ padding: "2px", position: "relative" }}>
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
              <th>Refund Date</th>
              <th>Form</th>
              <th>Amount</th>
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

                  <div>
                    {order.refund_form_date &&
                      parseSheetDate(order.refund_form_date).isValid() &&
                      parseSheetDate(order.refund_form_date).format(
                        "DD-MMM",
                      )}{" "}
                    <span style={{ fontWeight: "bold" }}>{order.Mediator}</span>
                  </div>
                </td>

                <td>
                  <input
                    style={{ width: "70px" }}
                    type="date"
                    value={
                      parseSheetDate(order.refund_form_date).isValid()
                        ? parseSheetDate(order.refund_form_date).format(
                            "YYYY-MM-DD",
                          )
                        : ""
                    }
                    onChange={(e) => {
                      const iso = e.target.value;
                      const sheetFormat = iso
                        ? dayjs(iso).format("M/D/YYYY")
                        : "";

                      handleChange(index, "refund_form_date", sheetFormat);
                    }}
                  />
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

export default WrongForm;
