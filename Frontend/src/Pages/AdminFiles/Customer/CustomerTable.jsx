import {
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  IconButton,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { useEffect, useState } from "react";
import {
  getcustomer,
  deletecustomer,
} from "../../../Services/customer.service";
import Loading from "../../../Components/loading";
import {
  deleteAlert,
  showPostError,
  showAlert,
} from "../../../Components/swal_alert";

/**
 * CustomerTable
 * Displays all customer records in a scrollable striped table
 * with inline edit and delete actions per row.
 *
 * Props:
 *   onEdit      - Callback invoked with the row data when edit is clicked.
 *   refreshKey  - Incremented by the parent to trigger a data reload.
 */
export default function CustomerTable({ onEdit, refreshKey }) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);

  /**
   * Fetches all customer records from the API
   * and updates the table rows.
   */
  const fetchCustomers = async () => {
    try {
      const res = await getcustomer();
      setCustomers(res?.items || []);
    } catch (err) {
      console.error("Failed to fetch customers", err);
    }
  };

  // Reload customer data on mount and whenever refreshKey changes
  useEffect(() => {
    fetchCustomers();
  }, [refreshKey]);

  /**
   * Prompts the user for confirmation, then deletes the selected customer.
   * Refreshes the table and shows a success or error alert based on response.
   */
  const handleDelete = async (customerId) => {
    const confirmDelete = await deleteAlert(
      "Are you sure?",
      "Are you sure you want to delete this customer?",
    );

    if (!confirmDelete?.isConfirmed) return;

    try {
      setLoading(true);
      const response = await deletecustomer(customerId);

      if (response?.Status === 1 || response?.statusCode === 200) {
        showAlert("success", "Customer deleted successfully");
        await fetchCustomers();
      } else {
        showPostError(response?.message || "Customer deletion failed");
      }
    } catch (err) {
      console.error("Delete failed", err);
      showAlert("error", err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Full-screen loader shown during delete operation */}
      {loading && <Loading />}

      <Paper
        sx={{
          borderRadius: 3,
          overflow: "hidden",
          background: (theme) =>
            theme.palette.mode === "dark" ? "#14141f" : "#ffffff",
          boxShadow: "0 3px 15px rgba(0,0,0,0.10)",
        }}
      >
        <TableContainer sx={{ maxHeight: 305 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow
                sx={{
                  backgroundColor: (theme) =>
                    theme.palette.mode === "dark" ? "#2c2c3d" : "#ececec",
                  "& th": { fontWeight: 700 },
                }}
              >
                <TableCell width={100}>Action</TableCell>
                <TableCell>Customer Name</TableCell>
                <TableCell>Cust Alias</TableCell>
                <TableCell>City</TableCell>
                <TableCell>PAN No</TableCell>
                <TableCell>GST No</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {customers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No customers found
                  </TableCell>
                </TableRow>
              ) : (
                customers.map((row, index) => (
                  <TableRow
                    key={row.customer_id}
                    sx={(theme) => ({
                      // Zebra stripe — handles both light and dark mode
                      backgroundColor:
                        index % 2 === 0
                          ? theme.palette.mode === "dark"
                            ? "#1f1f2b"
                            : "#ffffff"
                          : theme.palette.mode === "dark"
                            ? "#29293a"
                            : "#f7f7f7",
                      "&:hover": {
                        backgroundColor:
                          theme.palette.mode === "dark" ? "#33334a" : "#e5e5e5",
                      },
                    })}
                  >
                    {/* Edit and delete action icons */}
                    <TableCell>
                      <IconButton size="small" onClick={() => onEdit(row)}>
                        <EditIcon sx={{ color: "#6F60C1" }} />
                      </IconButton>

                      <IconButton
                        size="small"
                        onClick={() => handleDelete(row.customer_id)}
                      >
                        <DeleteIcon sx={{ color: "error.main" }} />
                      </IconButton>
                    </TableCell>

                    <TableCell sx={{ fontWeight: 600 }}>
                      {row.customer_name}
                    </TableCell>
                    <TableCell>{row.customer_alias || "-"}</TableCell>
                    <TableCell>{row.city || "-"}</TableCell>
                    <TableCell>{row.pan_no || "-"}</TableCell>
                    <TableCell>{row.gst_no || "-"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </>
  );
}
