import { useEffect, useState } from "react";
import { gapi } from "gapi-script";
import dayjs from "dayjs";
import "./App.css";

const CLIENT_ID =
  "937228397336-i07jo81e4e8os777rel1594n369ohnuk.apps.googleusercontent.com";
const API_KEY = "AIzaSyDScP5GlWBV1kA8k0cfLK6r7JvRHRqqOJU";
const SHEET_ID = "1L9LJEj43C54zbd5AJ3HW_ETt0KW1JK6sIh6-jkQSLWQ";
const DISCOVERY_DOC =
  "https://sheets.googleapis.com/$discovery/rest?version=v4";
const SCOPE = "https://www.googleapis.com/auth/spreadsheets";

function Admin() {
  const [searchId, setSearchId] = useState("");
  const [orderData, setOrderData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  useEffect(() => {
    const start = () => {
      gapi.client
        .init({
          apiKey: API_KEY,
          clientId: CLIENT_ID,
          discoveryDocs: [DISCOVERY_DOC],
          scope: SCOPE,
        })
        .then(() => {
          const authInstance = gapi.auth2.getAuthInstance();
          if (authInstance.isSignedIn.get()) {
            setIsAuthenticated(true); // Persist authentication state
          }
        })
        .catch((error) => showModal("Google API Error: " + error.message));
    };
    gapi.load("client:auth2", start);
  }, []);

  const handleLogin = async () => {
    try {
      const authInstance = gapi.auth2.getAuthInstance();
      await authInstance.signIn();
      setIsAuthenticated(true);
    } catch (error) {
      showModal("Login Error: " + error.message);
    }
  };

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
      <h1>Refund Management</h1>
      {!isAuthenticated ? (
        <button
          style={{
            margin: "10px",
            width: "90%",
            display: "flex",
            justifyContent: "center",
          }}
          onClick={handleLogin}
        >
          Login with Google
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
                              ? [
                                  "kkb",
                                  "bgm",
                                  "naaz",
                                  "brand boosters",
                                  "adf",
                                  "touch sky",
                                  "manish",
                                  "med 25",
                                  "sumit ar",
                                  "mishba",
                                  "rohit",
                                  "anshul",
                                  "subroo",
                                  "poonam",
                                  "nikhil",
                                ].map((opt) => (
                                  <option key={opt} value={opt}>
                                    {opt}
                                  </option>
                                ))
                              : [
                                  "pending",
                                  "a complete",
                                  "me given",
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
