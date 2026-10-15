import { useCallback, useEffect, useState } from "react";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import EditModal from "./EditModal";
import med from "../med";
import { useGoogleAuth, SHEET_ID, GoogleAuthButtons } from "../auth/GoogleAuth";

dayjs.extend(customParseFormat);

const DATE_FORMATS = ["D/M/YYYY", "M/D/YYYY", "D MMM", "D MMMM"];

function Pending() {
  const [mediator, setMediator] = useState("");
  const [orders, setOrders] = useState([]);
  const [copyMode, setCopyMode] = useState("full");
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState({
    mediator: "",
    type: "",
  });
  const [showEditModal, setShowEditModal] = useState(false);
  const [EditId, setEditID] = useState(null);
  const [summaryData, setSummaryData] = useState([]);

  const { isApiReady, isAuthenticated, gapi } = useGoogleAuth();

  const fetchOrders = useCallback(async () => {
    if (!isApiReady || !isAuthenticated || !gapi?.client?.sheets) {
      return;
    }

    try {
      const response = await gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: "Sheet1!A2:N",
      });

      const rows = response.result.values || [];
      const CURRENT_YEAR = new Date().getFullYear();
      const today = dayjs();

      const summary = {};

      rows.forEach((row) => {
        const mediatorName = row[2];

        if (!mediatorName) return;

        const paymentStatus = (row[7] || "").toLowerCase();

        if (
          paymentStatus === "a complete" ||
          paymentStatus === "cancel" ||
          paymentStatus === "seller given"
        ) {
          return;
        }

        let refundDate = dayjs(row[1], DATE_FORMATS, true);

        if (refundDate.isValid() && !/\d{4}/.test(row[1] || "")) {
          refundDate = refundDate.year(CURRENT_YEAR);
        }

        if (!refundDate.isValid()) return;

        const daysOld = today.diff(refundDate, "day");

        if (daysOld < 40) return;

        if (!summary[mediatorName]) {
          summary[mediatorName] = {
            mediator: mediatorName,
            days40: 0,
            days50: 0,
            days60: 0,
          };
        }

        if (daysOld >= 40 && daysOld < 50) {
          summary[mediatorName].days40++;
        } else if (daysOld >= 50 && daysOld < 60) {
          summary[mediatorName].days50++;
        } else if (daysOld >= 60) {
          summary[mediatorName].days60++;
        }
      });

      setSummaryData(
        Object.values(summary).sort((a, b) => b.days60 - a.days60),
      );

      const filteredOrders = rows
        .filter((row) => {
          const paymentStatus = (row[7] || "").toLowerCase();

          const mediatorMatches =
            !mediator ||
            mediator.toLowerCase() === "all mediator" ||
            row[2]?.toLowerCase() === mediator.toLowerCase();

          return (
            mediatorMatches &&
            paymentStatus !== "a complete" &&
            paymentStatus !== "cancel" &&
            paymentStatus !== "seller given"
          );
        })
        .sort((a, b) => {
          const parse = (dateStr) => {
            let parsed = dayjs(dateStr, DATE_FORMATS, true);

            if (parsed.isValid() && !/\d{4}/.test(dateStr || "")) {
              parsed = parsed.year(CURRENT_YEAR);
            }

            return parsed.isValid() ? parsed : dayjs("1900-01-01");
          };

          return parse(a[1]).unix() - parse(b[1]).unix();
        })
        .map((row) => {
          let parsedDate = dayjs(row[1], DATE_FORMATS, true);

          if (parsedDate.isValid() && !/\d{4}/.test(row[1] || "")) {
            parsedDate = parsedDate.year(CURRENT_YEAR);
          }

          return {
            order_id: row[0],
            refund_form_date: parsedDate.isValid()
              ? parsedDate.format("YYYY-MM-DD")
              : "1900-01-01",
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
          };
        });

      if (filteredOrders.length === 0) {
        alert(mediator ? "check med name" : "No pending orders found");
        setOrders([]);
        return;
      }

      setOrders(filteredOrders);
    } catch (error) {
      alert("Error fetching data: " + (error?.message || String(error)));
    }
  }, [mediator, isApiReady, isAuthenticated, gapi]);

  const formatDate = (dateStr) => dayjs(dateStr).format("D MMM");

  const copyToClipboard = async () => {
    let textToCopy = "";
    const filtered = orders;

    if (copyMode === "full") {
      textToCopy = filtered
        .map(
          (o) =>
            `${o.order_id}\t\t${formatDate(
              o.refund_form_date,
            )}\t\t${o.BrandName || ""}\n`,
        )
        .join("\n");
    } else if (copyMode === "idAndDate" || copyMode === "olderThanMonth") {
      textToCopy = filtered
        .map((o) => `${o.order_id}\t\t${formatDate(o.refund_form_date)}\n`)
        .join("\n");
    } else if (copyMode === "olderThanMonthWithBrand") {
      textToCopy = filtered
        .map(
          (o) =>
            `${o.order_id}\t\t${formatDate(
              o.refund_form_date,
            )}\t\t${o.BrandName || ""}\n`,
        )
        .join("\n");
    } else {
      alert("Please select a copy mode.");
      return;
    }

    try {
      await navigator.clipboard.writeText(textToCopy.trim());

      setModalContent({
        mediator: mediator || "All Mediators",
        type: copyMode,
      });

      setShowModal(true);

      setTimeout(() => {
        setShowModal(false);
      }, 2000);
    } catch (error) {
      alert("Copy failed: " + (error?.message || String(error)));
    }
  };

  useEffect(() => {
    if (!isApiReady || !isAuthenticated) return;

    fetchOrders();
  }, [isApiReady, isAuthenticated, fetchOrders]);

  return (
    <div style={{ padding: "10px" }}>
      <h1>Order Filter by Mediator</h1>

      {!isAuthenticated ? (
        <GoogleAuthButtons />
      ) : (
        <>
          <div
            style={{
              display: "flex",
              gap: "10px",
              marginBottom: "10px",
            }}
          >
            <select
              value={mediator}
              onChange={(e) => setMediator(e.target.value)}
            >
              <option value="">Select Mediator</option>

              {med.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>

            <button style={{ width: "30%" }} onClick={fetchOrders}>
              Fetch Orders
            </button>
          </div>

          <div
            style={{
              display: "flex",
              gap: "10px",
              marginBottom: "10px",
            }}
          >
            <select
              value={copyMode}
              onChange={(e) => setCopyMode(e.target.value)}
            >
              {/* <option value="">Select Copy Mode</option> */}
              <option value="full">Order ID + Refund Date + Brand</option>

              {/* <option value="idAndDate">
                Order ID + Refund Date
              </option>
              <option value="olderThanMonth">
                Order ID + Refund Date (Older than 1 month)
              </option>
              <option value="olderThanMonthWithBrand">
                Order ID + Refund Date + Brand (Older than 1 month)
              </option> */}
            </select>

            <button onClick={copyToClipboard}>Copy</button>
          </div>

          {!mediator && summaryData.length > 0 && (
            <table
              border="1"
              style={{
                borderCollapse: "collapse",
                width: "100%",
                marginTop: "20px",
                textAlign: "center",
              }}
            >
              <thead>
                <tr>
                  <th>Mediator</th>
                  <th>40 Days</th>
                  <th>50 Days</th>
                  <th>60+ Days</th>
                </tr>
              </thead>

              <tbody>
                {summaryData.map((item) => (
                  <tr
                    style={{
                      backgroundColor: item.days60 > 25 ? "red" : "",
                      fontWeight: item.days60 > 25 ? "bold" : "normal",
                    }}
                    key={item.mediator}
                  >
                    <td>{item.mediator}</td>
                    <td>{item.days40}</td>
                    <td>{item.days50}</td>
                    <td>{item.days60}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <table border="1">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Refund Date</th>
                <th>Notes</th>
                <th>Brand</th>
              </tr>
            </thead>

            <tbody>
              {orders.map((order, index) => (
                <tr key={index}>
                  <td style={{ minWidth: "150px" }}>
                    <div>
                      {order.order_id}{" "}
                      <span
                        onClick={() => {
                          setEditID(order.order_id);
                          setShowEditModal(true);
                        }}
                        style={{
                          marginLeft: "6px",
                          cursor: "pointer",
                        }}
                      >
                        ✏️
                      </span>
                    </div>

                    <div>
                      {order?.payment && (
                        <span
                          style={{
                            borderRadius: "5px",
                            backgroundColor:
                              order.payment === "me given" ? "yellow" : "",
                            paddingLeft: "5px",
                            paddingRight: "5px",
                          }}
                        >
                          {order.payment}
                        </span>
                      )}

                      {order?.form && (
                        <span
                          style={{
                            borderRadius: "5px",
                            backgroundColor:
                              order.form === "ok" ? "green" : "red",
                            paddingLeft: "5px",
                            paddingRight: "5px",
                          }}
                        >
                          {order.form}
                        </span>
                      )}

                      {order?.buyerRemark}
                    </div>
                  </td>

                  <td>{formatDate(order.refund_form_date)}</td>
                  <td>{order.Notes}</td>
                  <td>{order.BrandName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {showModal && (
        <div
          style={{
            position: "fixed",
            bottom: "20px",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "#333",
            color: "#fff",
            padding: "12px 24px",
            borderRadius: "8px",
            boxShadow: "0 4px 10px rgba(0, 0, 0, 0.3)",
            zIndex: 1000,
            fontSize: "14px",
          }}
        >
          Copied! Mediator: <strong>{modalContent.mediator}</strong> | Type:{" "}
          <strong>{modalContent.type}</strong>
        </div>
      )}

      {showEditModal && (
        <EditModal
          setShowEditModal={setShowEditModal}
          fetchOrders={fetchOrders}
          searchId={EditId}
        />
      )}
    </div>
  );
}

export default Pending;
