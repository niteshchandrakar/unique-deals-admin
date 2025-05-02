import dayjs from "dayjs";
import { gapi } from "gapi-script";
import React, { useCallback, useEffect, useState } from "react";

const SHEET_ID = "1L9LJEj43C54zbd5AJ3HW_ETt0KW1JK6sIh6-jkQSLWQ";

function EditModal({ searchId, setShowEditModal, fetchOrders }) {
  const [orderData, setOrderData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const fetchOrderData = useCallback(async () => {
    if (!searchId) return showModal("Please enter an Order ID.");
    setOrderData(null);
    setIsLoading(true);
    try {
      const sheets = ["Sheet1", "Completed"];
      let foundOrders = [];
      for (const sheet of sheets) {
        const response = await gapi.client.sheets.spreadsheets.values.get({
          spreadsheetId: SHEET_ID,
          range: `${sheet}!A2:I`,
        });
        const rows = response.result.values || [];
        const matchingOrders = rows.filter((row) => row[0] === searchId);
        if (matchingOrders.length > 0) foundOrders.push(...matchingOrders);
      }

      if (foundOrders.length === 0) {
        showModal("Order Id Nahi Mila❌❌");
        setOrderData(null);
      } else if (foundOrders.length > 1) {
        showModal("Ye Order id sheet me kai baar hai🚫🚫");
        setOrderData(null);
      } else {
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
        ];
        const orderObject = keys.reduce(
          (acc, key, index) => ({ ...acc, [key]: foundOrders[0][index] || "" }),
          {}
        );
        setOrderData(orderObject);
        showModal("Order Mil Gaya✅✅");
      }
    } catch (error) {
      showModal("kuchh problem hai nitesh ko message kar lo");
    } finally {
      setIsLoading(false);
    }
  }, [searchId]); // only depends on searchId

  const handleUpdateOrder = async () => {
    if (!orderData) return;

    setIsLoading(true);
    try {
      const response = await gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: "Sheet1!A2:A",
      });
      const rows = response.result.values;
      if (!rows) return showModal("No data found.");

      const rowIndex = rows.findIndex((row) => row[0] === orderData.order_id);
      if (rowIndex === -1) return showModal("Order id ni mila❌❌");

      const actualRowNumber = rowIndex + 2;
      const updateResponse =
        await gapi.client.sheets.spreadsheets.values.update({
          spreadsheetId: SHEET_ID,
          range: `Sheet1!A${actualRowNumber}:I${actualRowNumber}`,
          valueInputOption: "USER_ENTERED",
          resource: {
            values: [
              [
                orderData.order_id,
                orderData.refund_form_date,
                orderData.mediator,
                orderData.whatsapp_number,
                orderData.order_amount,
                orderData.less_amount,
                "",
                orderData.payment,
                orderData.notes,
              ],
            ],
          },
        });
      if (updateResponse.status === 200) {
        showModal("Data Update Ho gaya😍😍😍");
        fetchOrders();
        fetchOrderData();
      } else {
        showModal("kuchh problem hai nitesh ko message kar lo");
      }
    } catch (error) {
      showModal("kuchh problem hai nitesh ko message kar lo " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const showModal = (message) => {
    setModalMessage(message);
    setTimeout(() => setModalMessage(""), 3000);
  };
  useEffect(() => {
    fetchOrderData();
  }, [fetchOrderData]);

  return (
    <div
      onClick={() => setShowEditModal(false)} // triggers when clicking outside
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10000,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          backgroundColor: "white",
          padding: "20px",
          borderRadius: "10px",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
          zIndex: 1000,
          minHeight: "65%",
          minWidth: "80%",
        }}
      >
        {orderData && (
          <div className="order-details">
            <h3>Order Details:</h3>
            <table>
              <tbody>
                {Object.entries(orderData).map(([key, value]) => (
                  <tr key={key}>
                    <td>{key}</td>
                    <td>
                      {key === "mediator" || key === "payment" ? (
                        <select
                          value={value}
                          onChange={(e) =>
                            setOrderData({
                              ...orderData,
                              [key]: e.target.value,
                            })
                          }
                        >
                          <option value="">Select {key}</option>
                          {(key === "mediator"
                            ? [
                                "sumit ar",
                                "mishba",
                                "touch sky",
                                "trisha",
                                "rohit",
                                "anshul",
                                "kkb",
                                "subroo",
                                "naaz",
                              ]
                            : ["pending", "a complete", "me given", "cancel"]
                          ).map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      ) : key === "notes" ? (
                        <textarea
                          value={value}
                          onChange={(e) =>
                            setOrderData({
                              ...orderData,
                              [key]: e.target.value,
                            })
                          }
                          rows={3}
                          style={{ width: "100%" }}
                        />
                      ) : (
                        <input
                          type={key === "refund_form_date" ? "date" : "text"}
                          value={
                            key === "refund_form_date"
                              ? dayjs(value).format("YYYY-MM-DD")
                              : value
                          }
                          onChange={(e) =>
                            setOrderData({
                              ...orderData,
                              [key]: e.target.value,
                            })
                          }
                          readOnly={["order_id", "paid_amount"].includes(key)}
                        />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button
              className="update-btn"
              onClick={handleUpdateOrder}
              disabled={isLoading}
            >
              Update Order
            </button>
          </div>
        )}
        {isLoading && (
          <div className="loading-overlay">
            <div className="spinner"></div>
          </div>
        )}
      </div>
      {modalMessage && (
        <div style={{ zIndex: 20 }} className="modal">
          {modalMessage}
        </div>
      )}
    </div>
  );
}

export default EditModal;
