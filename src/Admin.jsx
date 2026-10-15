import dayjs from "dayjs";
import { useState } from "react";
import { useGoogleAuth, SHEET_ID } from "./auth/GoogleAuth";
import "./App.css";
import med from "./med";
import { Link } from "react-router-dom";

function Admin() {
  const [searchId, setSearchId] = useState("");
  const [orderData, setOrderData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  const {
    isApiReady,
    isAuthenticated,
    login,
    logout,
    gapi,
    error: googleError,
  } = useGoogleAuth();

  const fetchOrderData = async () => {
    if (!searchId) return showModal("Please enter an Order ID.");
    setOrderData(null);
    setIsLoading(true);
    try {
      const sheets = ["Sheet1", "Completed"];
      let foundOrders = [];
      for (const sheet of sheets) {
        const response = await gapi.client.sheets.spreadsheets.values.get({
          spreadsheetId: SHEET_ID,
          range: `${sheet}!A2:M`,
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
          "Mediator",
          "Your_Whatsapp_Number",
          "order_amount",
          "Less_amount",
          "paid_amount",
          "payment",
          "notes",
          "form",
          "buyerRemark",
          "timeline",
          "BrandName",
        ];
        const orderObject = keys.reduce(
          (acc, key, index) => ({ ...acc, [key]: foundOrders[0][index] || "" }),
          {},
        );
        setOrderData(orderObject);
        showModal("Order Mil Gaya✅✅");
      }
    } catch (error) {
      showModal("kuchh problem hai nitesh ko message kar lo");
    } finally {
      setIsLoading(false);
    }
  };

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
                "", // paid_amount left blank as per your code
                orderData.payment || "",
                orderData.notes || "",
                orderData.form || "",
                orderData.buyerRemark || "",
                orderData.timeline || "",
                orderData.BrandName || "",
              ],
            ],
          },
        });
      if (updateResponse.status === 200) {
        showModal("Data Update Ho gaya😍😍😍");
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

  return (
    <div className="admin-container">
      <Link to="/akku">Akku</Link>
      <h1>
        Refund Management{" "}
        <span
          onClick={logout}
          style={{
            backgroundColor: "red",
            padding: "5px",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          LogOut
        </span>
      </h1>
      {!isAuthenticated ? (
        <button
          style={{
            margin: "10px",
            width: "90%",
            display: "flex",
            justifyContent: "center",
          }}
          onClick={login}
          disabled={!isApiReady}
        >
          {isApiReady ? "Login with Google" : "Loading Google API..."}
        </button>
      ) : (
        <div>
          <div
            style={{
              display: "flex",
              gap: "10px",
              position: "relative",
            }}
          >
            <input
              type="text"
              placeholder="Enter Order ID"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  fetchOrderData();
                }
              }}
              style={{ paddingRight: "40px", width: "100%" }} // Extra padding to prevent text from overlapping button
            />
            <button
              onClick={async () => {
                const text = await navigator.clipboard.readText(); // Read from clipboard
                setSearchId(text);
              }}
              style={{
                position: "absolute",
                right: "20%",
                top: "50%",
                transform: "translateY(-50%)",
                padding: "5px",
                fontSize: "12px",
                cursor: "pointer",
                border: "none",
                background: "#ddd",
                borderRadius: "5px",
                width: "10%",
              }}
            >
              📋
            </button>
            <button
              style={{ width: "20%" }}
              className="search-btn"
              onClick={fetchOrderData}
              disabled={isLoading}
            >
              Search
            </button>
          </div>

          {modalMessage && <div className="modal">{modalMessage}</div>}
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
                            {key === "mediator"
                              ? med.map((opt) => (
                                  <option key={opt} value={opt}>
                                    {opt}
                                  </option>
                                ))
                              : [
                                  "pending",
                                  "a complete",
                                  "me given",
                                  "hold",
                                  "cancel",
                                ].map((opt) => (
                                  <option key={opt} value={opt}>
                                    {opt}
                                  </option>
                                ))}
                          </select>
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
        </div>
      )}
      {isLoading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
        </div>
      )}
    </div>
  );
}
export default Admin;
