import { useEffect, useState } from "react";
import { gapi } from "gapi-script";
import dayjs from "dayjs";

const CLIENT_ID =
  "937228397336-i07jo81e4e8os777rel1594n369ohnuk.apps.googleusercontent.com";
const API_KEY = "AIzaSyDScP5GlWBV1kA8k0cfLK6r7JvRHRqqOJU";
const SHEET_ID = "1L9LJEj43C54zbd5AJ3HW_ETt0KW1JK6sIh6-jkQSLWQ";
const DISCOVERY_DOC =
  "https://sheets.googleapis.com/$discovery/rest?version=v4";
const SCOPE = "https://www.googleapis.com/auth/spreadsheets"; // Full access

// 171-3224726-9541135
function Admin() {
  const [searchId, setSearchId] = useState("");
  const [orderData, setOrderData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

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
          console.log("Google API initialized");
        })
        .catch((error) => console.error("Google API Error:", error));
    };

    gapi.load("client:auth2", start);
  }, []);

  const handleLogin = async () => {
    try {
      const authInstance = gapi.auth2.getAuthInstance();
      await authInstance.signIn();
      setIsAuthenticated(true);
      console.log(
        "User signed in:",
        authInstance.currentUser.get().getBasicProfile()
      );
    } catch (error) {
      console.error("Login Error:", error);
    }
  };

  const fetchOrderData = async () => {
    if (!searchId) {
      alert("Please enter an Order ID.");
      return;
    }

    setIsLoading(true);
    try {
      const sheets = ["Sheet1", "Completed"]; // Sheets to search in
      let foundOrders = [];

      for (const sheet of sheets) {
        const response = await gapi.client.sheets.spreadsheets.values.get({
          spreadsheetId: SHEET_ID,
          range: `${sheet}!A2:H`, // Adjust as per your sheet
        });

        const rows = response.result.values || [];
        const matchingOrders = rows.filter((row) => row[0] === searchId);

        if (matchingOrders.length > 0) {
          foundOrders.push(...matchingOrders);
        }
      }

      if (foundOrders.length === 0) {
        alert("No order found with the given ID.");
        setOrderData(null);
      } else if (foundOrders.length > 1) {
        alert(
          "Multiple orders found with the same ID. Please refine your search."
        );
        setOrderData(null);
      } else {
        // Define column keys for mapping
        const keys = [
          "order_id",
          "refund_form_date",
          "mediator",
          "whatsapp_number",
          "order_amount",
          "less_amount",
          "paid_amount",
          "payment",
        ];

        // Convert the array to an object with meaningful keys
        const orderObject = keys.reduce((acc, key, index) => {
          acc[key] = foundOrders[0][index] || ""; // Assign empty string if value is undefined
          return acc;
        }, {});

        setOrderData(orderObject); // Set the formatted order data
      }
    } catch (error) {
      console.error("Error fetching order data:", error);
      alert("Failed to fetch order data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateOrder = async () => {
    if (!orderData) return;

    setIsLoading(true);
    try {
      // Fetch all rows to find the correct row number
      const response = await gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: "Sheet1!A2:A", // Fetch only order IDs
      });

      const rows = response.result.values;
      if (!rows) {
        alert("No data found.");
        setIsLoading(false);
        return;
      }

      // Find row index (Google Sheets index starts from 1)
      const rowIndex = rows.findIndex((row) => row[0] === orderData.order_id);
      if (rowIndex === -1) {
        alert("Order ID not found.");
        setIsLoading(false);
        return;
      }

      const actualRowNumber = rowIndex + 2; // +2 because index is 0-based & header is in row 1

      // Update the correct row
      const updateResponse =
        await gapi.client.sheets.spreadsheets.values.update({
          spreadsheetId: SHEET_ID,
          range: `Sheet1!A${actualRowNumber}:H${actualRowNumber}`, // Update exact row
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
                orderData.paid_amount,
                orderData.payment,
              ],
            ],
          },
        });

      if (updateResponse.status === 200) {
        alert("Order updated successfully!");
      } else {
        alert("Error updating order.");
      }
    } catch (error) {
      console.error("Error updating order:", error);
    } finally {
      setIsLoading(false);
    }
  };
  // ===================================Calendara data=================================================

  // ========================================================================================================
  return (
    <div style={{ padding: "20px" }}>
      <h1>Refund Management</h1>
      {!isAuthenticated && (
        <button onClick={handleLogin}>Login with Google</button>
      )}
      <br />
      <br />
      <input
        type="text"
        placeholder="Enter Order ID"
        value={searchId}
        onChange={(e) => setSearchId(e.target.value)}
      />
      <button onClick={fetchOrderData} disabled={isLoading}>
        {isLoading ? "Searching..." : "Search"}
      </button>

      {orderData && (
        <div>
          <h3>Order Details:</h3>
          <table border="1" cellPadding="10">
            <tbody>
              {Object.entries(orderData).map(([key, value]) => (
                <tr key={key}>
                  <td
                    style={{ fontWeight: "bold", textTransform: "capitalize" }}
                  >
                    {key}
                  </td>
                  <td>
                    {key === "mediator" ? ( // If key is "mediator", render <select>
                      <select
                        value={orderData[key] || ""}
                        onChange={(e) => {
                          setOrderData((prev) => ({
                            ...prev,
                            [key]: e.target.value, // Update mediator value
                          }));
                        }}
                      >
                        <option value="">Select Mediator</option>
                        <option value="sumit ar">Sumit Ar</option>
                        <option value="mishba">Mishba</option>
                        <option value="touch sky">Touch Sky</option>
                        <option value="trisha">Trisha</option>
                        <option value="rohit">Rohit</option>
                        <option value="anshul">Anshul</option>
                        <option value="kkb">KKB</option>
                        <option value="subroo">Subroo</option>
                        <option value="naaz">Naaz</option>
                      </select>
                    ) : key === "payment" ? ( // If key is "payment", render <select>
                      <select
                        value={orderData[key] || ""}
                        onChange={(e) => {
                          setOrderData((prev) => ({
                            ...prev,
                            [key]: e.target.value, // Update payment status
                          }));
                        }}
                      >
                        <option value="">Select Payment Status</option>
                        <option value="pending">Pending</option>
                        <option value="a complete">A complete</option>
                        <option value="me given">Me Given</option>
                        <option value="cancel">Cancel</option>
                      </select>
                    ) : (
                      <input
                        type={key === "refund_form_date" ? "date" : "text"}
                        value={
                          key === "refund_form_date"
                            ? dayjs(orderData[key]).format("YYYY-MM-DD")
                            : orderData[key] || ""
                        }
                        onChange={(e) => {
                          setOrderData((prev) => ({
                            ...prev,
                            [key]: e.target.value,
                          }));
                        }}
                        readOnly={["order_id", "paid_amount"].includes(key)}
                        style={{
                          backgroundColor: ![
                            "order_id",
                            "paid_amount",
                          ].includes(key)
                            ? "white"
                            : "#f0f0f0",
                        }}
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <button
            onClick={handleUpdateOrder}
            style={{ marginTop: "10px", background: "#28a745", color: "white" }}
            disabled={isLoading}
          >
            {isLoading ? "Updating..." : "Update Order"}
          </button>
        </div>
      )}
    </div>
  );
}

export default Admin;
