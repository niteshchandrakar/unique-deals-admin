import { useEffect, useState } from "react";
import { gapi } from "gapi-script";
import dayjs from "dayjs";

const CLIENT_ID =
  "937228397336-i07jo81e4e8os777rel1594n369ohnuk.apps.googleusercontent.com";
const API_KEY = "AIzaSyDScP5GlWBV1kA8k0cfLK6r7JvRHRqqOJU";
const SHEET_ID = "1L9LJEj43C54zbd5AJ3HW_ETt0KW1JK6sIh6-jkQSLWQ";
const DISCOVERY_DOC =
  "https://sheets.googleapis.com/$discovery/rest?version=v4";
const SCOPE = "https://www.googleapis.com/auth/spreadsheets";

function SellerUpdate() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  const showModal = (message) => {
    setModalMessage(message);
    setTimeout(() => setModalMessage(""), 3000);
  };

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

  const fetchSellers = async () => {
    try {
      const response = await gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: "SellerUpdate!A2:F",
      });

      const rows = response.result.values || [];
      const today = dayjs();

      const formatted = rows.map((r, idx) => {
        const dateRaw = r[1] || "";
        const lastUpdateRaw = r[4] || "";

        const dateDayjs = dateRaw
          ? dayjs(dateRaw, ["DD/MM/YYYY", "DD MMM", "YYYY-MM-DD"])
          : null;
        const lastUpdateDayjs = lastUpdateRaw
          ? dayjs(lastUpdateRaw, ["DD/MM/YYYY", "DD MMM", "YYYY-MM-DD"])
          : null;

        return {
          seller: r[0] || "",
          date: dateDayjs ? dateDayjs.format("YYYY-MM-DD") : "",
          status: r[2] || "pending",
          remark: r[3] || "",
          lastUpdate: lastUpdateDayjs
            ? lastUpdateDayjs.format("YYYY-MM-DD")
            : "",
          lastRemark: r[5] || "",
          daysSinceUpdate: lastUpdateDayjs
            ? today.diff(lastUpdateDayjs, "day")
            : 0,
          isPastDate: dateDayjs ? dateDayjs.isBefore(today, "day") : false,
          index: idx + 2,
          pendingOrders: [], // ⬅️ store pending orders per seller
        };
      });

      formatted.sort((a, b) => {
        if (!a.date) return 1;
        if (!b.date) return -1;
        return dayjs(a.date).isAfter(dayjs(b.date)) ? 1 : -1;
      });

      setSellers(formatted);
    } catch (error) {
      alert("Error fetching data: " + error.message);
    }
  };
  useEffect(() => {
    if (isAuthenticated) fetchSellers();
  }, [isAuthenticated]);

  const handleChange = (index, field, value) => {
    setSellers((prev) => {
      const updated = [...prev];
      updated[index][field] = value;
      if (field === "date") {
        updated[index].isPastDate = dayjs(value).isBefore(dayjs(), "day");
      }
      return updated;
    });
  };

  const handleUpdate = async (sellerData) => {
    if (!sellerData) return;
    setLoading(true);

    try {
      const today = dayjs();
      const nextDate = today.add(15, "day");

      let newValues;

      if (sellerData.status.toLowerCase() === "complete") {
        newValues = [
          sellerData.seller,
          dayjs(nextDate).format("DD MMM YY"),
          "pending",
          "",
          dayjs(sellerData.date).format("DD MMM YY") ||
            dayjs(today).format("DD MMM YY"),
          sellerData.remark,
        ];
      } else {
        newValues = [
          sellerData.seller,
          sellerData.date ? dayjs(sellerData.date).format("DD MMM YY") : "",
          sellerData.status,
          sellerData.remark,
          sellerData.lastUpdate
            ? dayjs(sellerData.lastUpdate).format("DD MMM YY")
            : "",
          sellerData.lastRemark,
        ];
      }

      await gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `SellerUpdate!A${sellerData.index}:F${sellerData.index}`,
        valueInputOption: "USER_ENTERED",
        resource: { values: [newValues] },
      });

      showModal("✅ Seller updated successfully!");
      fetchSellers();
    } catch (error) {
      showModal("❌ Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Fetch Pending Orders (now show below)
  const fetchPendingOrders = async (mediatorName, index) => {
    try {
      const response = await gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: "Sheet1!A2:N",
      });

      const rows = response.result.values || [];
      const currentYear = new Date().getFullYear();

      const filtered = rows
        .filter(
          (r) =>
            r[2]?.toLowerCase() === mediatorName.toLowerCase() &&
            r[7]?.toLowerCase() !== "a complete" &&
            r[7]?.toLowerCase() !== "cancel" &&
            r[7]?.toLowerCase() !== "seller given"
        )
        .map((r) => ({
          order_id: r[0],
          refund_form_date: dayjs(
            r[1],
            ["D/M/YYYY", "M/D/YYYY", "D MMM", "D MMMM"],
            true
          )
            .year(currentYear)
            .format("D MMM"),
          BrandName: r[13] || "",
        }));

      setSellers((prev) => {
        const updated = [...prev];
        updated[index].pendingOrders = filtered;
        return updated;
      });
    } catch (error) {
      alert("Error fetching pending orders: " + error.message);
    }
  };

  const handleCopy = (orders) => {
    const formatted = orders
      .map(
        (o) =>
          `${o.order_id}\t\t${o.refund_form_date}\t\t${o.BrandName || ""}\n`
      )
      .join("");
    navigator.clipboard.writeText(formatted);
    showModal("📋 Pending orders copied!");
  };

  return (
    <div style={{ padding: "10px" }}>
      <h2 style={{ textAlign: "center" }}>Seller Update Manager</h2>

      {loading && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            color: "#fff",
            fontSize: "22px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 999,
          }}
        >
          Updating...
        </div>
      )}

      {!isAuthenticated ? (
        <div style={{ textAlign: "center", marginTop: "20px" }}>
          <button
            onClick={handleLogin}
            style={{ padding: "10px 20px", fontSize: "16px" }}
          >
            Login with Google
          </button>
        </div>
      ) : (
        <div>
          {sellers.map((s, i) => {
            const isLate = s.daysSinceUpdate >= 30;
            return (
              <div
                key={i}
                style={{
                  border: "1px solid #ccc",
                  borderRadius: "10px",
                  padding: "15px",
                  marginBottom: "15px",
                  backgroundColor: isLate
                    ? "#ff4d4d"
                    : s.isPastDate
                    ? "#fff3b0"
                    : "#fff",
                  boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
                }}
              >
                <div
                  style={{
                    color: "green",
                    fontWeight: "bolder",
                    textAlign: "center",
                    marginBottom: "10px",
                  }}
                >
                  {s.seller}
                </div>

                {/* Form fields */}
                <div style={{ marginBottom: "8px" }}>
                  <strong>Date:</strong>{" "}
                  <input
                    type="date"
                    value={s.date}
                    onChange={(e) => handleChange(i, "date", e.target.value)}
                    style={{ width: "100%", padding: "6px", marginTop: "4px" }}
                  />
                </div>

                <div style={{ marginBottom: "8px" }}>
                  <strong>Status:</strong>{" "}
                  <select
                    value={s.status}
                    onChange={(e) => handleChange(i, "status", e.target.value)}
                    style={{ width: "100%", padding: "6px", marginTop: "4px" }}
                  >
                    <option value="pending">Pending</option>
                    <option value="complete">Complete</option>
                  </select>
                </div>

                <div style={{ marginBottom: "8px" }}>
                  <strong>Remark:</strong>{" "}
                  <input
                    type="text"
                    value={s.remark}
                    onChange={(e) => handleChange(i, "remark", e.target.value)}
                    style={{ width: "100%", padding: "6px", marginTop: "4px" }}
                  />
                </div>
                <div style={{ marginTop: "8px" }}>
                  <strong>Last Remark:</strong> {s.lastRemark}
                </div>
                <div style={{ marginTop: "8px" }}>
                  <strong>Last Update:</strong>{" "}
                  <input
                    type="date"
                    value={s.lastUpdate || ""}
                    onChange={(e) =>
                      handleChange(i, "lastUpdate", e.target.value)
                    }
                    style={{ width: "100%", padding: "6px", marginTop: "4px" }}
                  />
                  {s.lastUpdate && (
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#555",
                        marginTop: "2px",
                      }}
                    >
                      {dayjs().diff(dayjs(s.lastUpdate), "day")} days ago
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleUpdate(s)}
                  style={{
                    width: "100%",
                    backgroundColor: "#007bff",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    padding: "10px",
                    marginTop: "10px",
                  }}
                >
                  Update
                </button>

                <button
                  onClick={() => fetchPendingOrders(s.seller, i)}
                  style={{
                    width: "100%",
                    backgroundColor: "#28a745",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    padding: "10px",
                    marginTop: "8px",
                  }}
                >
                  Show Pending Orders
                </button>

                {/* ✅ Pending orders list */}
                {s.pendingOrders && s.pendingOrders.length > 0 && (
                  <div
                    style={{
                      background: "#f8f9fa",
                      marginTop: "10px",
                      padding: "10px",
                      borderRadius: "8px",
                      fontSize: "14px",
                    }}
                  >
                    <div
                      style={{
                        fontWeight: "bold",
                        marginBottom: "5px",
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <span>Pending Orders ({s.pendingOrders.length})</span>
                      <button
                        onClick={() => handleCopy(s.pendingOrders)}
                        style={{
                          backgroundColor: "#6c63ff",
                          color: "#fff",
                          border: "none",
                          borderRadius: "4px",
                          padding: "4px 10px",
                        }}
                      >
                        Copy
                      </button>
                    </div>

                    <ul style={{ listStyle: "none", padding: 0 }}>
                      {s.pendingOrders.map((o, idx) => (
                        <li key={idx}>
                          {o.order_id} — {o.refund_form_date} —{" "}
                          {o.BrandName || ""}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {modalMessage && (
        <div
          style={{
            position: "fixed",
            bottom: "20px",
            right: "20px",
            background: "#333",
            color: "#fff",
            padding: "10px 20px",
            borderRadius: "8px",
          }}
        >
          {modalMessage}
        </div>
      )}
    </div>
  );
}

export default SellerUpdate;
